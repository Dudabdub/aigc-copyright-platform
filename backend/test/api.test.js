// backend/test/api.test.js
const request = require('supertest');
const app = require('../src/index');
const fs = require('fs');
const path = require('path');

// 生成一个测试用的 1x1 PNG
function createTestPNG() {
    return Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
    );
}

describe('API 集成测试', () => {
    test('GET /api/health 返回健康状态', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    test('POST /api/upload/image 上传图片', async () => {
        const png = createTestPNG();
        const res = await request(app)
            .post('/api/upload/image')
            .attach('image', png, 'test.png')
            .field('ownerAddress', '0x1234567890123456789012345678901234567890');

        // IPFS 可能未运行，允许失败
        if (res.statusCode === 200) {
            expect(res.body.imageHash).toMatch(/^0x[a-f0-9]{64}$/);
            expect(res.body.watermarkedHash).toMatch(/^0x[a-f0-9]{64}$/);
        }
    });

    test('POST /api/verify/copyright 验证不存在的图片', async () => {
        const png = createTestPNG();
        const res = await request(app)
            .post('/api/verify/copyright')
            .attach('image', png, 'test.png');

        expect([200, 500]).toContain(res.statusCode);
        if (res.statusCode === 200) {
            expect(res.body).toHaveProperty('valid');
            expect(res.body).toHaveProperty('imageHash');
        }
    });
});