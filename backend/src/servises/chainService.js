// backend/src/services/chainService.js
const { ethers } = require('ethers');
const config = require('../config');

// 合约 ABI（从 B 组导出的 artifacts 中提取的最小 ABI）
const CONTRACT_ABI = [
    // signAgreement
    'function signAgreement(bytes32 agreementHash, bytes signature) external',
    'function hasSigned(address creator) external view returns (bool)',
    // registerCopyright
    'function registerCopyright(bytes32 imageHash, bytes32 watermarkedHash, bytes32 fingerprint, string imageCid, string watermarkedCid, string metadataCid) external returns (bytes32)',
    // verifyCopyright
    'function verifyCopyright(bytes32 imageHash) external view returns (bool, address, uint256)',
    // logAIDetection
    'function logAIDetection(bytes32 imageId, bytes32 detectionResultHash) external',
    // events
    'event AgreementSigned(address indexed creator, bytes32 agreementHash, uint256 timestamp)',
    'event CopyrightRegistered(bytes32 indexed copyrightId, bytes32 indexed imageHash, address indexed owner, uint256 timestamp)',
    'event AIDetectionLogged(bytes32 indexed imageId, bytes32 detectionResultHash, uint256 timestamp)',
    // getTianpingCertId
    'function getTianpingCertId(bytes32 copyrightId) external view returns (string memory)',
];

class ChainService {
    constructor() {
        if (config.chainMode === 'hardhat') {
            this._initHardhat();
        } else {
            this._initTianping();
        }
    }

    // ==================== Hardhat 模式 ====================
    _initHardhat() {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        this.contract = new ethers.Contract(
            config.contractAddress,
            CONTRACT_ABI,
            this.wallet
        );
        console.log('[ChainService] 使用 Hardhat 本地节点');
    }

    // ==================== 天平链模式 ====================
    _initTianping() {
        // 天平链正式接入时实现
        // 需要：网关地址、应用密钥、签名算法
        this.tianpingGateway = config.tianping.gatewayUrl;
        this.appKey = config.tianping.appKey;
        console.log('[ChainService] 使用天平链模式（预留）');
    }

    // ==================== 公开接口 ====================

    async signAgreement(creatorAddress, agreementHash, signature) {
        if (config.chainMode === 'tianping') {
            return this._tianpingSignAgreement(creatorAddress, agreementHash, signature);
        }
        const tx = await this.contract.signAgreement(agreementHash, signature);
        const receipt = await tx.wait();
        return {
            txHash: receipt.hash,
            signedAt: Math.floor(Date.now() / 1000),
            blockNumber: receipt.blockNumber,
        };
    }

    async registerCopyright(data) {
        if (config.chainMode === 'tianping') {
            return this._tianpingRegisterCopyright(data);
        }
        const tx = await this.contract.registerCopyright(
            data.imageHash,
            data.watermarkedHash,
            data.fingerprint,
            data.imageCid,
            data.watermarkedCid,
            data.metadataCid || ''
        );
        const receipt = await tx.wait();

        // 从事件中解析 copyrightId
        const iface = new ethers.Interface(CONTRACT_ABI);
        let copyrightId = null;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog(log);
                if (parsed && parsed.name === 'CopyrightRegistered') {
                    copyrightId = parsed.args.copyrightId;
                    break;
                }
            } catch (e) {
                // 忽略非本合约事件
            }
        }

        return {
            copyrightId: copyrightId || ethers.hexlify(ethers.randomBytes(32)),
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            tianpingCertId: null, // Hardhat 模式无天平链编号
        };
    }

    async verifyCopyright(imageHash) {
        if (config.chainMode === 'tianping') {
            return this._tianpingVerifyCopyright(imageHash);
        }
        const [valid, owner, timestamp] = await this.contract.verifyCopyright(imageHash);
        return { valid, owner, timestamp: Number(timestamp) };
    }

    async logAIDetection(imageId, detectionResultHash) {
        if (config.chainMode === 'tianping') {
            return this._tianpingLogAIDetection(imageId, detectionResultHash);
        }
        const tx = await this.contract.logAIDetection(imageId, detectionResultHash);
        const receipt = await tx.wait();
        return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
    }

    async getTianpingCertId(copyrightId) {
        if (config.chainMode === 'hardhat') {
            return { tianpingCertId: null };
        }
        const certId = await this.contract.getTianpingCertId(copyrightId);
        return { tianpingCertId: certId };
    }

    // ==================== 天平链私有方法（预留） ====================
    async _tianpingSignAgreement(creatorAddress, agreementHash, signature) {
        // 调用天平链存证 API
        // const resp = await axios.post(`${this.tianpingGateway}/api/v1/agreement`, {...});
        throw new Error('天平链模式尚未接入，请设置 CHAIN_MODE=hardhat');
    }

    async _tianpingRegisterCopyright(data) {
        throw new Error('天平链模式尚未接入，请设置 CHAIN_MODE=hardhat');
    }

    async _tianpingVerifyCopyright(imageHash) {
        throw new Error('天平链模式尚未接入，请设置 CHAIN_MODE=hardhat');
    }

    async _tianpingLogAIDetection(imageId, detectionResultHash) {
        throw new Error('天平链模式尚未接入，请设置 CHAIN_MODE=hardhat');
    }
}

// 单例导出
module.exports = new ChainService();