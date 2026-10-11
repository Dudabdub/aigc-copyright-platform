// backend/src/routes/verify.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const upload = require('../middleware/upload');
const { sha256, perceptualHash } = require('../services/hashService');
const { extract: extractWatermark } = require('../services/watermarkService');
const chainService = require('../services/chainService');
const db = require('../db');

/**
 * POST /api/verify/copyright
 * 验证图片版权
 * 上传图片 → 计算 SHA-256 → 链上查询 → 水印验证 → 返回结果
 */
router.post('/copyright', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请上传待验证图片' });
        }

        const imageBuffer = fs.readFileSync(req.file.path);
        fs.unlinkSync(req.file.path);

        // 1. 计算 SHA-256
        const imageHash = sha256(imageBuffer);

        // 2. 链上验证
        const chainResult = await chainService.verifyCopyright(imageHash);

        // 3. 数据库查询（补充链上可能没有的元数据）
        const dbRecord = db.prepare(
            'SELECT * FROM copyrights WHERE image_hash = ?'
        ).get(imageHash);

        // 4. 水印验证
        let watermarkResult = { valid: false, text: null };
        try {
            const commonLengths = [64, 128, 256];
            for (const len of commonLengths) {
                const r = await extractWatermark(imageBuffer, len);
                if (r.valid) {
                    watermarkResult = r;
                    break;
                }
            }
        } catch (e) {
            // 水印提取失败，不阻塞验证
        }

        // 5. 综合判断
        const valid = chainResult.valid || !!dbRecord;
        const owner = chainResult.owner || dbRecord?.owner_address || null;
        const timestamp = chainResult.timestamp || dbRecord?.created_at || null;

        res.json({
            success: true,
            valid,
            imageHash,
            owner,
            timestamp,
            copyrightId: dbRecord?.copyright_id || null,
            tianpingCertId: dbRecord?.tianping_cert_id || null,
            txHash: dbRecord?.tx_hash || null,
            watermark: watermarkResult,
            source: chainResult.valid ? 'chain' : (dbRecord ? 'database' : 'none'),
        });
    } catch (err) {
        console.error('[Verify] 错误:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/verify/similar
 * 相似图片检测（基于感知哈希）
 */
router.post('/similar', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请上传图片' });
        }

        const imageBuffer = fs.readFileSync(req.file.path);
        fs.unlinkSync(req.file.path);

        const fingerprint = await perceptualHash(imageBuffer);

        // 获取所有已注册的指纹
        const all = db.prepare(
            'SELECT copyright_id, fingerprint, owner_address, image_hash FROM copyrights WHERE fingerprint != ?'
        ).all('');

        // 计算汉明距离，找相似图片
        const similar = [];
        const target = BigInt(fingerprint);
        for (const row of all) {
            try {
                const fp = BigInt(row.fingerprint);
                const xor = target ^ fp;
                let dist = 0;
                let v = xor;
                while (v > 0n) { dist += Number(v & 1n); v >>= 1n; }
                if (dist <= 10) { // 汉明距离阈值
                    similar.push({ ...row, hammingDistance: dist, similarity: 1 - dist / 64 });
                }
            } catch (e) { /* 跳过无效指纹 */ }
        }

        similar.sort((a, b) => a.hammingDistance - b.hammingDistance);

        res.json({
            success: true,
            fingerprint,
            similarCount: similar.length,
            similar: similar.slice(0, 10),
        });
    } catch (err) {
        console.error('[Verify] 相似检测错误:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;