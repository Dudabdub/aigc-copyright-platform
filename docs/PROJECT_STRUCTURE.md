# 优化后的整项目结构

```text
aigc-copyright-platform/
├── README.md
├── .gitignore
├── frontend/                              # 本包提供完整可运行实现
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                       # React 入口
│       ├── App.jsx                        # 页面路由状态、全局状态与 Toast
│       ├── styles.css                     # Design system + responsive UI
│       ├── hooks/
│       │   └── useWallet.js                # 钱包生命周期/账户和网络监听
│       ├── services/
│       │   └── api.js                     # 统一 API 客户端
│       ├── utils/
│       │   └── format.js                  # 日期、地址、错误和响应兼容
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── WalletButton.jsx
│       │   ├── Toast.jsx
│       │   └── ImagePicker.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── RegisterPage.jsx
│           ├── DetectPage.jsx
│           └── CertificatesPage.jsx
├── backend/                               # 接入你现有 Node.js 后端代码
│   ├── .env.example                       # 仅放占位值，禁止提交真实密钥
│   ├── package.json
│   ├── src/
│   │   ├── index.js                       # Express 入口、全局错误处理
│   │   ├── config.js                      # 环境变量校验
│   │   ├── db.js                          # SQLite schema / migration
│   │   ├── routes/
│   │   │   ├── upload.js
│   │   │   ├── copyright.js
│   │   │   ├── verify.js
│   │   │   └── detect.js
│   │   ├── middleware/
│   │   │   ├── upload.js                  # MIME + 文件大小限制
│   │   │   └── errorHandler.js
│   │   └── services/
│   │       ├── hashService.js
│   │       ├── watermarkService.js
│   │       ├── ipfsService.js
│   │       ├── aiDetectService.js
│   │       ├── chainService.js             # 唯一链服务适配入口
│   │       └── reportService.js
│   └── test/
│       ├── api.test.js
│       └── services/
├── chain-layer/                           # B 组维护
│   ├── package.json
│   ├── hardhat.config.js
│   ├── contracts/
│   │   ├── OriginalityAgreement.sol
│   │   ├── CopyrightRegistry.sol
│   │   └── AIDetectionLog.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── test/
│       ├── OriginalityAgreement.test.js
│       └── CopyrightRegistry.test.js
├── shared/
│   └── interface.js                       # 双方共同冻结的服务契约
└── docs/
    ├── PROJECT_STRUCTURE.md
    └── API_CONTRACT.md
```

## 分层原则

- React 只负责交互和展示，统一调用 `/api/*`，不把链上私钥放入浏览器。
- Express 路由负责参数校验和业务编排；哈希、水印、IPFS、AI、链服务保持独立。
- `chainService.js` 是唯一链适配层：本地 Hardhat 和天平链模式对外暴露相同接口。
- Solidity 只保存证明所需的哈希/时间/所有者等信息，图片二进制和大块元数据保存在 IPFS 或受控对象存储。
- `shared/` 与 `docs/API_CONTRACT.md` 是 A/B 两组联调的契约来源；接口变更需要版本化。
