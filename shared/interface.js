/**
 * A/B 组共同维护的接口契约说明。
 * 运行时代码由 backend/src/services/chainService.js 实现；前端只调用 REST API。
 * 哈希规则：SHA-256 使用 0x + 64 hex chars；EVM bytes32 参数也必须是固定 32 字节。
 */

const CHAIN_MODES = Object.freeze({ HARDHAT: 'hardhat', TIANPING: 'tianping' });

const API_PATHS = Object.freeze({
  health: '/api/health',
  signAgreement: '/api/copyright/sign-agreement',
  uploadImage: '/api/upload/image',
  registerCopyright: '/api/copyright/register',
  listCopyrights: '/api/copyright/list',
  verifyCopyright: '/api/verify/copyright',
  verifySimilar: '/api/verify/similar',
  detectAI: '/api/detect/ai',
  report: '/api/report/:copyrightId',
});

module.exports = { CHAIN_MODES, API_PATHS };
