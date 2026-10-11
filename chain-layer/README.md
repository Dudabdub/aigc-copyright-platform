# Chain layer integration point (B 组)

本目录用于 B 组的 Hardhat 合约与测试。建议维护 `contracts/`、`scripts/`、`test/` 和 `hardhat.config.js`。部署后把合约地址与 ABI 交付给后端 `chainService.js`，不要让 React 前端直接读取或保存部署私钥。

天平链网关只有在取得官方接入许可、技术规范和有效测试凭据后才能实现；未接入时必须显式返回未接入状态，不得生成伪造存证编号。
