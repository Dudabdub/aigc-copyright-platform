// backend/src/services/chainService.js
const { ethers } = require('ethers');
const config = require('../config');

// 合约 ABI（B组导出的最小 ABI，hardhat 模式下使用）
const CONTRACT_ABI = [
  'function signAgreement(bytes32 agreementHash, bytes signature) external',
  'function hasSigned(address creator) external view returns (bool)',
  'function registerCopyright(bytes32 imageHash, bytes32 watermarkedHash, bytes32 fingerprint, string imageCid, string watermarkedCid, string metadataCid) external returns (bytes32)',
  'function verifyCopyright(bytes32 imageHash) external view returns (bool, address, uint256)',
  'function logAIDetection(bytes32 imageId, bytes32 detectionResultHash) external',
  'function getTianpingCertId(bytes32 copyrightId) external view returns (string memory)',
  'event AgreementSigned(address indexed creator, bytes32 agreementHash, uint256 timestamp)',
  'event CopyrightRegistered(bytes32 indexed copyrightId, bytes32 indexed imageHash, address indexed owner, uint256 timestamp)',
  'event AIDetectionLogged(bytes32 indexed imageId, bytes32 detectionResultHash, uint256 timestamp)',
];

class ChainService {
  constructor() {
    if (config.chainMode === 'mock') {
      this._initMock();
    } else if (config.chainMode === 'hardhat') {
      this._initHardhat();
    } else {
      this._initTianping();
    }
  }

  // ==================== Mock 模式（A组独立开发使用） ====================
  _initMock() {
    // Mock 模式下的内存存储，进程重启后会重置
    this.mockStore = {
      agreements: new Map(),   // address -> { agreementHash, signature, signedAt }
      copyrights: new Map(),   // imageHash -> { copyrightId, owner, watermarkedHash, fingerprint, timestamp }
      detections: new Map(),   // imageId -> { detectionResultHash, timestamp }
    };
    console.log('[ChainService] ✅ 使用 Mock 模式（模拟链上存证，数据不会真实上链）');
  }

  // ==================== Hardhat 本地链模式 ====================
  _initHardhat() {
    if (!config.contractAddress) {
      throw new Error('[ChainService] CHAIN_MODE=hardhat 但缺少 CONTRACT_ADDRESS，请检查 .env');
    }
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.contractAddress,
      CONTRACT_ABI,
      this.wallet
    );
    console.log('[ChainService] ✅ 使用 Hardhat 本地节点');
    console.log(`[ChainService] 合约地址: ${config.contractAddress}`);
  }

  // ==================== 天平链模式（预留） ====================
  _initTianping() {
    this.tianpingGateway = config.tianping.gatewayUrl;
    this.appKey = config.tianping.appKey;
    console.log('[ChainService] ⚠️ 使用天平链模式（尚未接入，需要正式授权）');
  }

  // ==================== 公开接口 ====================

  /**
   * 签署原创承诺书
   */
  async signAgreement(creatorAddress, agreementHash, signature) {
    if (config.chainMode === 'mock') {
      const signedAt = Math.floor(Date.now() / 1000);
      this.mockStore.agreements.set(creatorAddress.toLowerCase(), {
        agreementHash, signature, signedAt,
      });
      return {
        txHash: this._mockTxHash('sign', agreementHash),
        signedAt,
        blockNumber: 0,
        chainMode: 'mock',
      };
    }
    if (config.chainMode === 'tianping') {
      return this._tianpingSignAgreement(creatorAddress, agreementHash, signature);
    }
    const tx = await this.contract.signAgreement(agreementHash, signature);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      signedAt: Math.floor(Date.now() / 1000),
      blockNumber: receipt.blockNumber,
      chainMode: 'hardhat',
    };
  }

  /**
   * 注册版权存证
   */
  async registerCopyright(data) {
    if (config.chainMode === 'mock') {
      const copyrightId = 'MOCK-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
      const timestamp = Math.floor(Date.now() / 1000);

      // Mock 模式下检查重复
      const normalizedHash = (data.imageHash || '').toLowerCase();
      if (this.mockStore.copyrights.has(normalizedHash)) {
        const existing = this.mockStore.copyrights.get(normalizedHash);
        return {
          copyrightId: existing.copyrightId,
          txHash: this._mockTxHash('register', data.imageHash),
          blockNumber: 0,
          tianpingCertId: null,
          chainMode: 'mock',
          duplicate: true,
        };
      }

      this.mockStore.copyrights.set(normalizedHash, {
        copyrightId,
        owner: data.ownerAddress,
        watermarkedHash: data.watermarkedHash,
        fingerprint: data.fingerprint,
        timestamp,
      });

      return {
        copyrightId,
        txHash: this._mockTxHash('register', data.imageHash),
        blockNumber: 0,
        tianpingCertId: null,
        chainMode: 'mock',
      };
    }

    if (config.chainMode === 'tianping') {
      return this._tianpingRegisterCopyright(data);
    }

    // Hardhat 真实链
    const tx = await this.contract.registerCopyright(
      data.imageHash,
      data.watermarkedHash,
      data.fingerprint,
      data.imageCid,
      data.watermarkedCid,
      data.metadataCid || ''
    );
    const receipt = await tx.wait();

    const iface = new ethers.Interface(CONTRACT_ABI);
    let copyrightId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === 'CopyrightRegistered') {
          copyrightId = parsed.args.copyrightId;
          break;
        }
      } catch (e) { /* 忽略 */ }
    }

    return {
      copyrightId: copyrightId || ethers.hexlify(ethers.randomBytes(32)),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      tianpingCertId: null,
      chainMode: 'hardhat',
    };
  }

  /**
   * 验证版权
   */
  async verifyCopyright(imageHash) {
    if (config.chainMode === 'mock') {
      const normalizedHash = (imageHash || '').toLowerCase();
      const record = this.mockStore.copyrights.get(normalizedHash);
      if (record) {
        return {
          valid: true,
          owner: record.owner,
          timestamp: record.timestamp,
          chainMode: 'mock',
        };
      }
      return {
        valid: false,
        owner: null,
        timestamp: 0,
        chainMode: 'mock',
      };
    }

    if (config.chainMode === 'tianping') {
      return this._tianpingVerifyCopyright(imageHash);
    }

    const [valid, owner, timestamp] = await this.contract.verifyCopyright(imageHash);
    return {
      valid,
      owner,
      timestamp: Number(timestamp),
      chainMode: 'hardhat',
    };
  }

  /**
   * 记录 AI 检测结果
   */
  async logAIDetection(imageId, detectionResultHash) {
    if (config.chainMode === 'mock') {
      const timestamp = Math.floor(Date.now() / 1000);
      this.mockStore.detections.set(imageId, { detectionResultHash, timestamp });
      return {
        txHash: this._mockTxHash('detect', imageId),
        blockNumber: 0,
        chainMode: 'mock',
      };
    }

    if (config.chainMode === 'tianping') {
      return this._tianpingLogAIDetection(imageId, detectionResultHash);
    }

    const tx = await this.contract.logAIDetection(imageId, detectionResultHash);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      chainMode: 'hardhat',
    };
  }

  /**
   * 查询天平链存证编号
   */
  async getTianpingCertId(copyrightId) {
    if (config.chainMode !== 'tianping') {
      return { tianpingCertId: null };
    }
    const certId = await this.contract.getTianpingCertId(copyrightId);
    return { tianpingCertId: certId };
  }

  // ==================== 私有工具方法 ====================

  /**
   * 生成 Mock 交易哈希（格式符合 0x + 64 位十六进制，便于前端展示）
   */
  _mockTxHash(prefix, seed) {
    const crypto = require('crypto');
    const hash = crypto
      .createHash('sha256')
      .update(prefix + ':' + (seed || '') + ':' + Date.now() + ':' + Math.random())
      .digest('hex');
    return '0x' + hash;
  }

  // ==================== 天平链私有方法（预留） ====================

  async _tianpingSignAgreement() {
    throw new Error('[ChainService] 天平链尚未接入，请使用 CHAIN_MODE=mock 或 hardhat');
  }

  async _tianpingRegisterCopyright() {
    throw new Error('[ChainService] 天平链尚未接入，请使用 CHAIN_MODE=mock 或 hardhat');
  }

  async _tianpingVerifyCopyright() {
    throw new Error('[ChainService] 天平链尚未接入，请使用 CHAIN_MODE=mock 或 hardhat');
  }

  async _tianpingLogAIDetection() {
    throw new Error('[ChainService] 天平链尚未接入，请使用 CHAIN_MODE=mock 或 hardhat');
  }
}

// 单例导出
module.exports = new ChainService();
