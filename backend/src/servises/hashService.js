// backend/src/services/hashService.js
const crypto = require('crypto');
const sharp = require('sharp');

/**
 * 计算 SHA-256 哈希，返回 0x 前缀的 66 字符十六进制字符串
 * @param {Buffer} buffer
 * @returns {string}
 */
function sha256(buffer) {
    return '0x' + crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * 计算感知哈希（pHash）指纹 —— 用于近似重复检测
 * 算法：图片 → 32x32 灰度 → DCT → 取左上 8x8 低频 → 计算均值 → 二值化
 * @param {Buffer} imageBuffer
 * @returns {Promise<string>} 16 字符十六进制字符串
 */
async function perceptualHash(imageBuffer) {
    // 1. 转为 32x32 灰度图
    const { data } = await sharp(imageBuffer)
        .greyscale()
        .resize(32, 32, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true });

    // 2. 对每一行做一维 DCT，简化处理：取低频部分（前 8 个像素的平均值）
    const size = 32;
    const lowFreq = [];

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            // 对每个 8x8 块取左上角像素的均值作为低频分量
            let sum = 0;
            for (let dy = 0; dy < 4; dy++) {
                for (let dx = 0; dx < 4; dx++) {
                    sum += data[(y * 4 + dy) * size + (x * 4 + dx)];
                }
            }
            lowFreq.push(sum / 16);
        }
    }

    // 3. 计算均值
    const avg = lowFreq.reduce((a, b) => a + b, 0) / lowFreq.length;

    // 4. 二值化 → 64 位 → 16 位十六进制
    let hashBits = '';
    for (const v of lowFreq) {
        hashBits += v >= avg ? '1' : '0';
    }

    let hashHex = '';
    for (let i = 0; i < 64; i += 4) {
        hashHex += parseInt(hashBits.substring(i, i + 4), 2).toString(16);
    }
    return '0x' + hashHex.padEnd(16, '0');
}

/**
 * 计算 JSON 对象的 keccak256 哈希（用于承诺书文本）
 * 使用 ethers.js 的 keccak256
 */
function keccak256OfString(str) {
    const { keccak256, toUtf8Bytes } = require('ethers');
    return keccak256(toUtf8Bytes(str));
}

module.exports = { sha256, perceptualHash, keccak256OfString };