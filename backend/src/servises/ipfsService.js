// backend/src/services/ipfsService.js
const { create } = require('ipfs-http-client');
const config = require('../config');

let ipfs = null;
let ipfsInitError = null;

// 延迟初始化 IPFS 客户端（首次调用时才连接）
function getIPFSClient() {
  if (ipfs) return ipfs;
  if (ipfsInitError) throw ipfsInitError;

  try {
    ipfs = create({ url: config.ipfsApiUrl });
    return ipfs;
  } catch (err) {
    ipfsInitError = err;
    throw new Error(`IPFS 客户端初始化失败: ${err.message}`);
  }
}

/**
 * 是否启用 Mock 模式
 */
function isMockMode() {
  return process.env.MOCK_IPFS === 'true' || config.chainMode === 'mock';
}

/**
 * 生成 Mock CID（格式类似 Qm 开头的 IPFS CID v0）
 */
function generateMockCID(prefix) {
  const crypto = require('crypto');
  const hash = crypto
    .createHash('sha256')
    .update((prefix || 'mock') + ':' + Date.now() + ':' + Math.random())
    .digest('hex');
  // 模拟 Qm 开头的 46 字符 CID
  return 'QmMock' + hash.substring(0, 40);
}

/**
 * 上传文件到 IPFS
 * @param {Buffer} buffer - 文件内容
 * @param {string} filename - 文件名
 * @returns {Promise<{cid: string, size: number}>}
 */
async function uploadToIPFS(buffer, filename) {
  // Mock 模式：跳过真实上传，返回假 CID
  if (isMockMode()) {
    console.log(`[IPFS] ⚠️ Mock 模式：跳过真实上传 (${filename}, ${buffer.length} bytes)`);
    return {
      cid: generateMockCID(filename),
      size: buffer.length,
      mock: true,
    };
  }

  try {
    const client = getIPFSClient();
    const result = await client.add(
      { path: filename, content: buffer },
      { pin: true }
    );
    console.log(`[IPFS] ✅ 上传成功: ${result.cid.toString()} (${filename})`);
    return { cid: result.cid.toString(), size: result.size };
  } catch (err) {
    throw new Error(`IPFS 上传失败: ${err.message}`);
  }
}

/**
 * 从 IPFS 获取文件
 * @param {string} cid
 * @returns {Promise<Buffer>}
 */
async function getFromIPFS(cid) {
  // Mock 模式：返回空 Buffer
  if (isMockMode() || cid.startsWith('QmMock')) {
    console.log(`[IPFS] ⚠️ Mock 模式：返回空内容 (${cid})`);
    return Buffer.from('mock-content');
  }

  try {
    const client = getIPFSClient();
    const chunks = [];
    for await (const chunk of client.cat(cid)) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (err) {
    throw new Error(`IPFS 读取失败: ${err.message}`);
  }
}

/**
 * 上传 JSON 元数据到 IPFS
 */
async function uploadJSONToIPFS(obj, filename = 'metadata.json') {
  const buffer = Buffer.from(JSON.stringify(obj, null, 2), 'utf-8');
  return uploadToIPFS(buffer, filename);
}

module.exports = { uploadToIPFS, getFromIPFS, uploadJSONToIPFS };
