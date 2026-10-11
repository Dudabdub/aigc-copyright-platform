// backend/src/routes/copyright.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const chainService = require('../services/chainService');
const { keccak256OfString, sha256 } = require('../services/hashService');

/**
 * POST /api/copyright/sign-agreement
 * 签署原创承诺书
 * body: { creatorAddress, agreementText, signature }
 */
router.post('/sign-agreement', async (req, res) => {
    try {
        const { creatorAddress, agreementText, signature } = req.body;

        if (!creatorAddress || !agreementText || !signature) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        // 计算承诺书文本哈希
        const agreementHash = keccak256OfString(agreementText);

        // 调用链上合约
        const result = await chainService.signAgreement(
            creatorAddress,
            agreementHash,
            signature
        );

        // 写入数据库
        const stmt = db.prepare(`
      INSERT INTO agreements (creator_address, agreement_hash, signature, tx_hash)
      VALUES (?, ?, ?, ?)
    `);
        stmt.run(creatorAddress, agreementHash, signature, result.txHash);

        res.json({
            success: true,
            agreementHash,
            txHash: result.txHash,
            signedAt: result.signedAt,
        });
    } catch (err) {
        console.error('[Copyright] 签约错误:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/copyright/register
 * 注册版权存证
 * body: { imageHash, watermarkedHash, fingerprint, imageCid, watermarkedCid, metadataCid, ownerAddress, watermarkPayload }
 */
router.post('/register', async (req, res) => {
    try {
        const {
            imageHash, watermarkedHash, fingerprint,
            imageCid, watermarkedCid, metadataCid,
            ownerAddress, watermarkPayload,
        } = req.body;

        if (!imageHash || !watermarkedHash || !imageCid || !watermarkedCid) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        // 检查是否已注册（去重）
        const existing = db.prepare(
            'SELECT copyright_id FROM copyrights WHERE image_hash = ?'
        ).get(imageHash);

        if (existing) {
            return res.status(409).json({
                error: '该图片已注册版权',
                copyrightId: existing.copyright_id,
            });
        }

        // 调用链上合约
        const chainResult = await chainService.registerCopyright({
            imageHash,
            watermarkedHash,
            fingerprint: fingerprint || '0x00000000000000000000000000000000',
            imageCid,
            watermarkedCid,
            metadataCid: metadataCid || '',
            ownerAddress,
        });

        // 生成业务 ID
        const copyrightId = chainResult.copyrightId || `CP-${uuidv4()}`;

        // 写入数据库
        const stmt = db.prepare(`
      INSERT INTO copyrights
        (copyright_id, image_hash, watermarked_hash, fingerprint,
         image_cid, watermarked_cid, metadata_cid, owner_address,
         tx_hash, tianping_cert_id, watermark_payload)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(
            copyrightId, imageHash, watermarkedHash, fingerprint || '',
            imageCid, watermarkedCid, metadataCid || '', ownerAddress,
            chainResult.txHash, chainResult.tianpingCertId, watermarkPayload || ''
        );

        res.json({
            success: true,
            copyrightId,
            txHash: chainResult.txHash,
            tianpingCertId: chainResult.tianpingCertId,
            blockNumber: chainResult.blockNumber,
        });
    } catch (err) {
        console.error('[Copyright] 注册错误:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/copyright/list?owner=0x...
 * 查询某地址的所有版权
 */
router.get('/list', (req, res) => {
    const { owner } = req.query;
    let rows;
    if (owner) {
        rows = db.prepare(
            'SELECT * FROM copyrights WHERE owner_address = ? ORDER BY created_at DESC'
        ).all(owner);
    } else {
        rows = db.prepare(
            'SELECT * FROM copyrights ORDER BY created_at DESC LIMIT 50'
        ).all();
    }
    res.json({ success: true, data: rows });
});

module.exports = router;