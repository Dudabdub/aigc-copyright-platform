// backend/src/services/aiDetectService.js
const { Reader } = require('@contentauth/c2pa-node');

/**
 * AI 生成检测（初筛版本）
 *
 * 检测维度：
 * 1. C2PA 元数据解析 —— 检测是否携带 Content Credentials 清单
 * 2. 嵌入向量初筛 —— 基于元数据分析（后续可替换为 CLIP/ViT 模型）
 * 3. 元数据分析 —— 检查 EXIF 中的软件标记
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<Object>}
 */
async function detect(imageBuffer) {
    const result = {
        isAIGenerated: false,
        confidence: 0,
        c2paData: null,
        embeddingScore: 0,
        metadataScore: 0,
    };

    // ========== 维度1：C2PA 元数据解析 ==========
    try {
        const reader = await Reader.fromAsset(imageBuffer, {
            mimeType: 'image/png',
        });
        const manifestStore = await reader.getManifestStore();

        if (manifestStore && manifestStore.activeManifest) {
            result.c2paData = {
                activeManifest: manifestStore.activeManifest,
                manifests: Object.keys(manifestStore.manifests || {}),
            };
            // 检测到 C2PA 清单，高度可疑为 AI 生成
            result.isAIGenerated = true;
            result.confidence = 0.85;
            result.metadataScore = 0.85;

            // 检查 C2PA 中的 AI 生成声明
            const manifest = manifestStore.activeManifest;
            const assertions = manifest.assertions || {};
            if (assertions['c2pa.actions']) {
                const actions = assertions['c2pa.actions'];
                if (actions.actions) {
                    for (const action of actions.actions) {
                        if (action.action === 'c2pa.created' &&
                            action.digitalSourceType?.includes('trainedAlgorithmicMedia')) {
                            result.isAIGenerated = true;
                            result.confidence = 0.95;
                        }
                    }
                }
            }
        }
    } catch (err) {
        // C2PA 解析失败（无清单或格式不支持）—— 正常情况
        result.c2paData = null;
    }

    // ========== 维度2：元数据分析（EXIF 软件标记） ==========
    try {
        const metadata = await getImageMetadata(imageBuffer);
        result.embeddingScore = analyzeMetadataForAI(metadata);
    } catch (err) {
        result.embeddingScore = 0;
    }

    // ========== 综合评分 ==========
    // 如果没有 C2PA，使用元数据评分作为参考
    if (!result.c2paData) {
        result.confidence = Math.max(result.embeddingScore, 0.3);
        result.isAIGenerated = result.confidence > 0.5;
    }

    return result;
}

/**
 * 获取图片元数据
 */
async function getImageMetadata(imageBuffer) {
    const sharp = require('sharp');
    return await sharp(imageBuffer).metadata();
}

/**
 * 基于元数据分析 AI 生成可能性
 */
function analyzeMetadataForAI(metadata) {
    let score = 0;

    // 检查 EXIF 中的软件标记
    const software = (metadata.software || '').toLowerCase();
    const aiKeywords = [
        'midjourney', 'stable diffusion', 'dall-e', 'dalle',
        'firefly', 'imagen', 'comfyui', 'automatic1111',
        'novelai', 'leonardo', 'flux', 'sdxl',
    ];

    if (aiKeywords.some((kw) => software.includes(kw))) {
        score = Math.max(score, 0.9);
    }

    // 检查图片尺寸特征（AI 生成图片常见尺寸）
    const { width, height } = metadata;
    const aiSizes = [
        [1024, 1024], [512, 512], [768, 768], [896, 1152],
        [1152, 896], [1024, 1792], [1792, 1024],
    ];
    if (aiSizes.some(([w, h]) => width === w && height === h)) {
        score = Math.max(score, 0.4);
    }

    // 检查 PNG 中的文本块（AI 工具常写入参数）
    if (metadata.exif && Buffer.isBuffer(metadata.exif)) {
        const exifStr = metadata.exif.toString('ascii').toLowerCase();
        if (aiKeywords.some((kw) => exifStr.includes(kw))) {
            score = Math.max(score, 0.85);
        }
    }

    return score;
}

module.exports = { detect };