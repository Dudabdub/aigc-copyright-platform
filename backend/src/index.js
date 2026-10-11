// backend/src/index.js
const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');

const app = express();

// ==================== 中间件 ====================
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ==================== 路由 ====================
app.use('/api/upload', require('./routes/upload'));
app.use('/api/copyright', require('./routes/copyright'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/detect', require('./routes/detect'));

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        chainMode: config.chainMode,
        timestamp: new Date().toISOString(),
    });
});

// ==================== 取证报告下载 ====================
const { generateReport } = require('./services/reportService');

app.get('/api/report/:copyrightId', async (req, res) => {
    try {
        const record = db.prepare(
            'SELECT * FROM copyrights WHERE copyright_id = ?'
        ).get(req.params.copyrightId);

        if (!record) {
            return res.status(404).json({ error: '未找到该版权记录' });
        }

        const detection = db.prepare(
            'SELECT * FROM detections WHERE image_hash = ? ORDER BY created_at DESC LIMIT 1'
        ).get(record.image_hash);

        const pdfBuffer = await generateReport({
            ...record,
            createdAt: record.created_at,
            detection: detection ? JSON.parse(detection.detection_detail || '{}') : null,
            watermarkValid: !!record.watermark_payload,
            watermarkText: record.watermark_payload,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=report-${req.params.copyrightId}.pdf`
        );
        res.send(pdfBuffer);
    } catch (err) {
        console.error('[Report] 错误:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== 错误处理 ====================
app.use((err, req, res, next) => {
    console.error('[Global Error]', err);
    if (err.message && err.message.includes('不支持的文件格式')) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || '服务器内部错误' });
});

// ==================== 启动 ====================
app.listen(config.port, () => {
    console.log(`\n🚀 AIGC 版权保护平台后端已启动`);
    console.log(`   端口: ${config.port}`);
    console.log(`   链模式: ${config.chainMode}`);
    console.log(`   合约地址: ${config.contractAddress}`);
    console.log(`   数据库: ${config.dbPath}\n`);
});

module.exports = app;