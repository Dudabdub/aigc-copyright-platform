// backend/src/config.js
require('dotenv').config();
const path = require('path');

module.exports = {
    port: parseInt(process.env.PORT, 10) || 3001,
    ipfsApiUrl: process.env.IPFS_API_URL || 'http://localhost:5001',
    chainMode: process.env.CHAIN_MODE || 'hardhat',  // 'hardhat' | 'tianping'
    contractAddress: process.env.CONTRACT_ADDRESS,
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    privateKey: process.env.PRIVATE_KEY,
    dbPath: path.resolve(process.env.DB_PATH || './data/copyright.db'),
    uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
    // 天平链配置（正式接入时填写）
    tianping: {
        gatewayUrl: process.env.TIANPING_GATEWAY || '',
        appKey: process.env.TIANPING_APP_KEY || '',
        appSecret: process.env.TIANPING_APP_SECRET || '',
    },
};