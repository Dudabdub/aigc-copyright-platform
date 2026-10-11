// backend/src/services/reportService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * 生成取证报告 PDF
 * @param {Object} data
 * @returns {Promise<Buffer>}
 */
function generateReport(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ========== 标题 ==========
        doc.fontSize(22).font('Helvetica-Bold')
            .text('AIGC 图片版权取证报告', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica')
            .text(`报告编号：RPT-${Date.now()}`, { align: 'center' });
        doc.text(`生成时间：${new Date().toISOString()}`, { align: 'center' });
        doc.moveDown(1);

        // ========== 分隔线 ==========
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        // ========== 一、作品信息 ==========
        doc.fontSize(14).font('Helvetica-Bold').text('一、作品信息');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');

        const fields = [
            ['版权存证编号', data.copyrightId || '—'],
            ['作品名称', data.title || '未命名'],
            ['创作者地址', data.ownerAddress || '—'],
            ['原图 SHA-256', data.imageHash || '—'],
            ['水印图 SHA-256', data.watermarkedHash || '—'],
            ['感知哈希指纹', data.fingerprint || '—'],
            ['原图 IPFS CID', data.imageCid || '—'],
            ['水印图 IPFS CID', data.watermarkedCid || '—'],
            ['链上交易哈希', data.txHash || '—'],
            ['天平链存证编号', data.tianpingCertId || '（测试环境暂无）'],
            ['存证时间', data.createdAt ? new Date(data.createdAt * 1000).toISOString() : '—'],
        ];

        for (const [label, value] of fields) {
            doc.font('Helvetica-Bold').text(`${label}：`, { continued: true });
            doc.font('Helvetica').text(value);
            doc.moveDown(0.2);
        }

        // ========== 二、AI 检测结果 ==========
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Bold').text('二、AI 生成检测结果');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');

        const detectFields = [
            ['检测结论', data.detection?.isAIGenerated ? '⚠️ 疑似 AI 生成' : '✅ 未检测到 AI 生成特征'],
            ['置信度', data.detection ? `${(data.detection.confidence * 100).toFixed(1)}%` : '—'],
            ['C2PA 清单', data.detection?.c2paData ? '检测到 Content Credentials' : '未检测到'],
            ['元数据评分', data.detection ? data.detection.metadataScore?.toFixed(2) : '—'],
        ];

        for (const [label, value] of detectFields) {
            doc.font('Helvetica-Bold').text(`${label}：`, { continued: true });
            doc.font('Helvetica').text(value);
            doc.moveDown(0.2);
        }

        // ========== 三、水印验证 ==========
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Bold').text('三、盲水印验证');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');
        doc.text(`水印状态：${data.watermarkValid ? '✅ 验证通过' : '❌ 未检测到有效水印'}`);
        if (data.watermarkText) {
            doc.text(`水印内容：${data.watermarkText}`);
        }

        // ========== 四、法律声明 ==========
        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica-Bold').text('四、声明');
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').text(
            '本报告由 AIGC 图片版权保护平台自动生成。报告中的哈希值、IPFS CID 和链上交易记录' +
            '可通过公开渠道验证。天平链存证信息可作为司法证据使用。' +
            '如有异议，请联系平台管理员。',
            { align: 'justify' }
        );

        doc.end();
    });
}

module.exports = { generateReport };