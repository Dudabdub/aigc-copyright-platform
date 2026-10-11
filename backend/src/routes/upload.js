// backend/src/routes/upload.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const upload = require('../middleware/upload');
const { uploadToIPFS, uploadJSONToIPFS } = require('../services/ipfsService');
const { sha256, perceptualHash } = require('../services/hashService');
const { embed } = require('../services/watermarkService');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/upload/image
 * 上传图片 → 计算哈希 → IPFS 存原图 → 嵌入水印 → IPFS 存水印图
 * 返回：{ imageHash, watermarkedHash, fingerprint, imageCid, watermarkedCid, watermarkPayload }
 */
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请上传图片文件' });
        }

        const imageBuffer = fs.readFileSync(req.file.path);
        const ownerAddress = req.body.ownerAddress || '0x0000000000000000000000000000000000000000';

        // 1. 计算原图 SHA-256
        const imageHash = sha256(imageBuffer);

        // 2. 计算感知哈希指纹
        const fingerprint = await perceptualHash(imageBuffer);

        // 3. 上传原图到 IPFS
        const originalResult = await uploadToIPFS(imageBuffer, req.file.originalname);

        // 4. 生成水印文本
        const watermarkPayload = `AIGC-Copyright|${ownerAddress}|${Date.now()}`;

        // 5. 嵌入盲水印
        const watermarkedBuffer = await embed(imageBuffer, watermarkPayload);

        // 6. 计算水印图 SHA-256
        const watermarkedHash = sha256(watermarkedBuffer);

        // 7. 上传水印图到 IPFS
        const watermarkedResult = await uploadToIPFS(
            watermarkedBuffer,
            `wm-${req.file.originalname}`
        );

        // 8. 上传元数据到 IPFS
        const metadata = {
            name: req.file.originalname,
            imageHash,
            watermarkedHash,
            fingerprint,
            ownerAddress,
            watermarkPayload,
            createdAt: new Date().toISOString(),
        };
        const metadataResult = await uploadJSONToIPFS(metadata);

        // 9. 清理临时文件
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            imageHash,
            watermarkedHash,
            fingerprint,
            imageCid: originalResult.cid,
            watermarkedCid: watermarkedResult.cid,
            metadataCid: metadataResult.cid,
            watermarkPayload,
            watermarkByteLength: Buffer.byteLength(watermarkPayload, 'utf8'),
        });
    } catch (err) {
        console.error('[Upload] 错误:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;