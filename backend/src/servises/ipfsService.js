// backend/src/services/ipfsService.js
const { create } = require('ipfs-http-client');
const config = require('../config');

const ipfs = create({ url: config.ipfsApiUrl });

/**
 * 上传文件到 IPFS
 * @param {Buffer} buffer - 文件内容
 * @param {string} filename - 文件名
 * @returns {Promise<{cid: string, size: number}>}
 */
async function uploadToIPFS(buffer, filename) {
    const result = await ipfs.add(
        { path: filename, content: buffer },
        { pin: true }
    );
    return { cid: result.cid.toString(), size: result.size };
}

/**
 * 从 IPFS 获取文件
 * @param {string} cid
 * @returns {Promise<Buffer>}
 */
async function getFromIPFS(cid) {
    const chunks = [];
    for await (const chunk of ipfs.cat(cid)) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

/**
 * 上传 JSON 元数据到 IPFS
 */
async function uploadJSONToIPFS(obj, filename = 'metadata.json') {
    const buffer = Buffer.from(JSON.stringify(obj, null, 2), 'utf-8');
    return uploadToIPFS(buffer, filename);
}

module.exports = { uploadToIPFS, getFromIPFS, uploadJSONToIPFS };