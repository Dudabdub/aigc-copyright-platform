# 墨证 MOZHENG · AIGC 图片版权保护平台（前端优化版）

这是基于现有方案整理的可运行 React 前端工程，包含工作台、钱包连接、原创承诺书签署、图片上传与版权登记、版权/AI/相似图片检测、证书列表和取证报告入口。

> **环境边界：** 默认使用 Hardhat 本地测试网络。前端显示的“存证完成”只说明后端流程返回成功；除非拿到天平链官方接入权限、使用真实网关并验证返回凭据，否则不能称为真实天平链司法存证。AI 生成结果也是启发式初筛，不是法律认定。

## 1. 项目范围

本压缩包包含完整前端源代码、接口契约说明和整仓库建议结构。原有后端代码以你提供的 `粘贴的文本 (1).txt` 为基准继续集成；压缩包没有把原后端文本中所有代码重复复制成第二份，以免产生两套不一致实现。

## 2. 环境要求

- Node.js 20 LTS 或更新的兼容版本
- npm 10 或兼容版本
- 原方案的后端服务运行于 `http://localhost:3001`
- 如要走链上存证，还需启动 B 组 Hardhat 节点，并部署合约；如后端使用 IPFS，还需启动 IPFS 节点
- 浏览器需安装 MetaMask 或兼容的 EVM 钱包

## 3. 启动前端

```bash
cd frontend
cp .env.example .env       # Windows 可手动复制为 .env
npm install
npm run dev
```

访问 `http://localhost:3000`。开发服务器会把 `/api` 请求代理到 `http://localhost:3001`。若后端不在此地址，修改 `frontend/.env` 中的 `VITE_API_PROXY_TARGET`。

生产构建：

```bash
cd frontend
npm run build
npm run preview
```

构建产物位于 `frontend/dist/`。生产部署时应把 `VITE_API_BASE_URL` 指向真实后端地址，或由 Nginx 等反向代理 `/api`。

## 4. 功能页面

- **工作台**：API 连接状态、个人存证数量、快捷操作和最近记录。
- **原创存证**：展示承诺书、钱包签名、选择图片、显示哈希/CID、调用版权登记接口。
- **版权检测**：并行调用版权验证、AI 初筛、相似图片检索；单个接口失败时仍展示其他接口的结果。
- **我的证书**：加载后端列表，搜索编号/哈希/地址，复制字段，打开取证报告和 IPFS 内容链接。
- **钱包状态**：跟踪账户/网络变更；不会读取或保存私钥。
- **响应式布局**：桌面侧边栏、平板布局和移动端抽屉导航。

## 5. 后端 API 契约

前端默认调用下列接口（与原方案保持一致）：

| Method | Endpoint | 用途 |
|---|---|---|
| GET | `/api/health` | 检查后端状态 |
| POST | `/api/copyright/sign-agreement` | 提交承诺书文本和钱包签名 |
| POST | `/api/upload/image` | 图片哈希、水印、IPFS 上传 |
| POST | `/api/copyright/register` | 登记版权 |
| GET | `/api/copyright/list?owner=0x...` | 查询证书列表 |
| POST | `/api/verify/copyright` | 验证版权记录 |
| POST | `/api/verify/similar` | 相似图片检索 |
| POST | `/api/detect/ai` | AI 初筛及检测记录 |
| GET | `/api/report/:copyrightId` | 下载 PDF 取证报告 |

文件上传字段均为 `image`；上传原创图片时另传 `ownerAddress`。API 的表单由浏览器自动生成 multipart boundary，因此代码不会手动写死 `Content-Type`。

## 6. 前后端联调注意事项

1. **链 ID**：Hardhat 默认 Chain ID 是 `31337`。MetaMask 应添加本地网络 `http://127.0.0.1:8545`，并使用本地测试账户。测试账户仅用于本地链。
2. **合约地址**：后端 `.env` 的 `CONTRACT_ADDRESS` 必须填写本次 Hardhat 部署地址，不能长期使用示例地址。
3. **指纹格式**：现有后端的 pHash 生成函数返回 `0x` 加 16 位十六进制；前端登记前将其左侧补零转为 32-byte hex，以满足合约 `bytes32` 入参。若 B 组改为真正的 256-bit 指纹，应同步更新双方契约。
4. **ABI 与合约签名**：后端 `chainService.js` 的函数签名必须与 B 组合约一致。若合约的 `registerCopyright` 参数/返回值变化，更新后端链服务，不需要让 React 直接调用合约。
5. **时间字段**：后端列表使用 SQLite 的 `created_at`（Unix 秒，snake_case）；前端兼容 `createdAt` 和 `created_at` 两种格式。
6. **钱包签名核验**：现有后端流程把 `creatorAddress`、文本哈希和签名写入合约，但应由后端/合约增加签名恢复与地址一致性校验，避免用户只提交任意地址与签名。
7. **安全边界**：不要把应用私钥放进前端环境变量；任何 `VITE_*` 值都会进入浏览器构建结果。生产环境还应加入身份认证、限流、文件魔数校验、上传清理、CORS 白名单与审计日志。

## 7. 推荐开发分工

- A 组维护 `frontend/` 与后端链下服务：图片上传、水印、元数据、AI/C2PA 初筛、报告导出。
- B 组维护 `chain-layer/`：Solidity 合约、Hardhat 测试、部署脚本、ABI/地址交付，以及天平链接入适配器。
- 双方共同维护 `shared/` 接口契约与 `docs/API_CONTRACT.md`；A 组只调用后端 API，不直接依赖合约内部实现。

## 8. 已知限制

- 天平链正式实现依赖官方应用单位审核、网关/API 文档与测试凭据；本工程不会伪造天平链存证编号。
- 当前 AI 检测服务若只依据 EXIF/尺寸等元数据打分，并不是真正的 CLIP/ViT 图像分类器；界面已把它定位为“线索初筛”。
- PDF 报告依赖后端生成。报告中的法律效力表述应经指导老师或法律顾问审核，不能声称所有存证均必然被司法采信。
