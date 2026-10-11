// backend/src/routes/detect.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const upload = require('../middleware/upload');
const { detect: aiDetect } = require('../services/aiDetectService');
const { sha256 } = require('../services/hashService');
const chainService = require('../services/chainService');
const db = require('../db');

/**
 * POST /api/detect/ai
 * AI 生成检测
 */
router.post('/ai', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请上传图片' });
        }

        const imageBuffer = fs.readFileSync(req.file.path);
        fs.unlinkSync(req.file.path);

        const imageHash = sha256(imageBuffer);

        // 执行 AI 检测
        const detection = await aiDetect(imageBuffer);

        // 计算检测结果哈希
        const detectionResultHash = sha256(
            Buffer.from(JSON.stringify({
                imageHash,
                isAIGenerated: detection.isAIGenerated,
                confidence: detection.confidence,
                timestamp: Date.now(),
            }))
        );

        // 记录到链上（可选，失败不阻塞返回）
        let chainTxHash = null;
        try {
            const chainResult = await chainService.logAIDetection(
                imageHash,
                detectionResultHash
            );
            chainTxHash = chainResult.txHash;
        } catch (e) {
            console.warn('[Detect] 链上记录失败:', e.message);
        }

        // 写入数据库
        db.prepare(`
      INSERT INTO detections
        (image_hash, is_aigenerated, confidence, c2pa_detected, c2pa_data, detection_detail, tx_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
            imageHash,
            detection.isAIGenerated ? 1 : 0,
            detection.confidence,
            detection.c2paData ? 1 : 0,
            detection.c2paData ? JSON.stringify(detection.c2paData) : null,
            JSON.stringify(detection),
            chainTxHash
        );

        res.json({
            success: true,
            imageHash,
            detection,
            detectionResultHash,
            chainTxHash,
        });
    } catch (err) {
        console.error('[Detect] 错误:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;