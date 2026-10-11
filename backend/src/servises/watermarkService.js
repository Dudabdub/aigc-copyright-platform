// backend/src/services/watermarkService.js
const { TracelessWatermark } = require('@traceless-watermark/node');

// 水印配置
const watermark = new TracelessWatermark({
    blockSize: 4,            // 4x4 块
    correctionLevel: 'medium' // Reed-Solomon 纠错等级
});

/**
 * 嵌入盲水印
 * @param {Buffer} imageBuffer - 原始图片
 * @param {string} payload     - 水印文本（如 "AIGC-Copyright|作者地址|时间戳"）
 * @returns {Promise<Buffer>}  - 带水印的 PNG 图片
 */
async function embed(imageBuffer, payload) {
    const result = await watermark.encodeText(imageBuffer, payload);
    if (!result.success) {
        throw new Error(`水印嵌入失败: ${result.error}`);
    }
    return Buffer.from(result.value);
}

/**
 * 提取盲水印
 * @param {Buffer} imageBuffer - 带水印图片
 * @param {number} byteCount   - 水印文本的字节数（需预知）
 * @returns {Promise<{valid: boolean, text: string|null}>}
 */
async function extract(imageBuffer, byteCount) {
    const result = await watermark.decodeText(imageBuffer, byteCount);
    if (!result.success) {
        return { valid: false, text: null };
    }
    return {
        valid: true,
        text: result.value.payload,
        correctionUsage: result.value.correctionUsage, // 纠错码使用比例
    };
}

/**
 * 检测是否含水印（不需要知道水印长度）
 */
async function detect(imageBuffer) {
    // 尝试用常见长度解码
    const commonLengths = [64, 128, 256];
    for (const len of commonLengths) {
        const result = await watermark.decodeText(imageBuffer, len);
        if (result.success) {
            return { found: true, text: result.value.payload };
        }
    }
    return { found: false, text: null };
}

module.exports = { embed, extract, detect };