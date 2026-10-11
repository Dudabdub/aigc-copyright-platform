# AIGC 图片版权保护平台 - 接口契约

本文件由 A 组（前端 + 后端）与 B 组（链服务）共同维护。
任何一方修改字段或返回格式，必须同步更新此文档并通知对方。
版本：v1.0
冻结日期：2026-10-11

---

## 一、总则（最高原则）

### 1. 统一返回格式

**成功返回：**
```json
{
  "success": true,
  "data": { ... }
}
失败返回：

json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误描述"
  }
}
2. 字段格式规范
哈希（imageHash / watermarkedHash / agreementHash）：0x 开头的 64 位十六进制字符串（SHA-256），例如 0x3f7a...b9c2。

感知指纹（fingerprint）：0x 开头的 16 位十六进制字符串（pHash），例如 0x9a3c5e7f1b2d4a6c。

IPFS CID（imageCid / watermarkedCid / metadataCid）：以 Qm 或 bafy 开头，例如 QmXyZ...AbCd。

钱包地址（ownerAddress / creatorAddress）：0x 开头的 40 位十六进制字符串。

时间戳（timestamp / createdAt / signedAt）：Unix 时间戳（秒），整数。

3. 诚信底线（非常重要）
在 Hardhat 本地开发模式下，tianpingCertId 必须返回 null。

本地测试链没有司法存证能力，严禁伪造天平链证书编号（如随机生成 TP-xxxx）。

前端也必须根据 chainMode 显示“本地测试链（演示环境）”，不得将本地模拟交易误称为司法存证。

接入真实天平链后，才允许返回真实的 tianpingCertId。

4. 链模式（chainMode）取值
chainMode	含义	tianpingCertId
mock	A2 实现的本地模拟链服务	必须为 null
hardhat	B 组实现的 Hardhat 本地链适配器	必须为 null
tianping	真实天平链接入后启用	真实证书编号
二、通用错误码
错误码	含义
INVALID_INPUT	请求参数缺失或格式错误
INVALID_SIGNATURE	签名与钱包地址不匹配
DUPLICATE_REGISTRATION	该图片已登记过版权
CHAIN_SERVICE_UNAVAILABLE	链服务未启动或合约地址错误
IPFS_UPLOAD_FAILED	IPFS 节点不可达
WATERMARK_EMBED_FAILED	水印嵌入或提取失败
AI_DETECT_FAILED	AI 检测失败
REPORT_NOT_FOUND	未找到对应的版权存证记录
TIANPING_NOT_AVAILABLE	天平链尚未接入
INTERNAL_ERROR	服务器内部错误
三、核心接口定义（共 9 个）
1. GET /api/health —— 健康检查
负责人： A 组（A2）
请求： 无

返回：

json
{
  "success": true,
  "data": {
    "service": "aigc-copyright-backend",
    "chainMode": "hardhat",
    "timestamp": "2026-10-11T12:00:00Z"
  }
}
2. POST /api/copyright/sign-agreement —— 签署原创承诺书
负责人： A 组（A2）+ B 组
请求：

json
{
  "creatorAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "agreementText": "原创承诺书\n本人声明...",
  "signature": "0x1234abcd..."
}
返回：

json
{
  "success": true,
  "data": {
    "agreementHash": "0xabcd...1234",
    "txHash": "0x5678...ef90",
    "signedAt": 1712345678
  }
}
说明：

后端必须使用 ethers.js 的 verifyMessage 验证签名和地址是否一致。

验证失败返回 INVALID_SIGNATURE。

3. POST /api/upload/image —— 上传图片（链下处理）
负责人： A 组（A2）
请求： multipart/form-data

image：图片文件

ownerAddress：钱包地址

返回：

json
{
  "success": true,
  "data": {
    "imageHash": "0x3f7a...b9c2",
    "watermarkedHash": "0x8e1d...7a45",
    "fingerprint": "0x9a3c5e7f1b2d4a6c",
    "imageCid": "QmXyZ...AbCd",
    "watermarkedCid": "QmMnOp...QrSt",
    "metadataCid": "QmEfGh...IjKl",
    "watermarkPayload": "AIGC-Copyright|0x70997...|1712345678000"
  }
}
说明：

后端负责计算 SHA-256、pHash、嵌入盲水印、上传 IPFS。

返回的 CID 必须是 IPFS 真实上传结果。

4. POST /api/copyright/register —— 链上版权登记（A+B 协作核心）
负责人： A 组（A2）+ B 组
请求：

json
{
  "imageHash": "0x3f7a...b9c2",
  "watermarkedHash": "0x8e1d...7a45",
  "fingerprint": "0x9a3c5e7f1b2d4a6c",
  "imageCid": "QmXyZ...AbCd",
  "watermarkedCid": "QmMnOp...QrSt",
  "metadataCid": "QmEfGh...IjKl",
  "ownerAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "watermarkPayload": "AIGC-Copyright|0x70997...|1712345678000"
}
返回（Mock / Hardhat 模式）：

json
{
  "success": true,
  "data": {
    "copyrightId": "1",
    "txHash": "0x5678...ef90",
    "blockNumber": 12,
    "tianpingCertId": null,
    "chainMode": "hardhat"
  }
}
⭐ 硬性规定：

tianpingCertId 在 Mock 和 Hardhat 模式下必须为 null。

绝对不允许伪造天平链存证编号。

若图片已存在（imageHash 重复），返回 DUPLICATE_REGISTRATION。

5. GET /api/copyright/list?owner=0x... —— 查询证书列表
负责人： A 组（A2）
请求： 查询参数 owner（钱包地址）

返回：

json
{
  "success": true,
  "data": [
    {
      "copyrightId": "1",
      "imageHash": "0x3f7a...b9c2",
      "watermarkedHash": "0x8e1d...7a45",
      "ownerAddress": "0x70997...79C8",
      "txHash": "0x5678...ef90",
      "tianpingCertId": null,
      "chainMode": "hardhat",
      "createdAt": 1712345678
    }
  ]
}
说明：

若 owner 未传，返回最近 50 条记录。

6. POST /api/verify/copyright —— 版权验证
负责人： A 组（A2）+ B 组
请求： multipart/form-data，上传待验证图片。

返回：

json
{
  "success": true,
  "data": {
    "valid": true,
    "imageHash": "0x3f7a...b9c2",
    "owner": "0x70997...79C8",
    "timestamp": 1712345678,
    "copyrightId": "1",
    "tianpingCertId": null,
    "watermark": {
      "valid": true,
      "text": "AIGC-Copyright|0x70997...|1712345678000"
    },
    "source": "chain"
  }
}
说明：

valid 表示是否匹配到存证记录。

source 取值：chain（链上查到）、database（仅数据库查到）、none（未找到）。

7. POST /api/verify/similar —— 相似图片检索
负责人： A 组（A2）
请求： multipart/form-data，上传待检索图片。

返回：

json
{
  "success": true,
  "data": {
    "fingerprint": "0x9a3c5e7f1b2d4a6c",
    "similarCount": 1,
    "similar": [
      {
        "copyright_id": "1",
        "hammingDistance": 4,
        "similarity": 0.9375
      }
    ]
  }
}
说明：

汉明距离 ≤ 10 视为相似。

similarity = 1 - hammingDistance / 64。

8. POST /api/detect/ai —— AI 生成检测
负责人： A 组（A2）
请求： multipart/form-data，上传待检测图片。

返回：

json
{
  "success": true,
  "data": {
    "imageHash": "0x3f7a...b9c2",
    "detection": {
      "isAIGenerated": true,
      "confidence": 0.85,
      "c2paData": null,
      "embeddingScore": 0.3,
      "metadataScore": 0.85
    },
    "detectionResultHash": "0xaaaa...bbbb",
    "chainTxHash": "0xcccc...dddd"
  }
}
说明：

confidence 范围为 0–1。

chainTxHash 若链上记录失败，可以为 null。

9. GET /api/report/:copyrightId —— 下载 PDF 取证报告
负责人： A 组（A2）
请求： URL 参数 copyrightId

返回：

Content-Type：application/pdf

二进制 PDF 文件流，前端通过 <a href> 直接下载。

若记录不存在，返回 REPORT_NOT_FOUND。

四、联调检查清单
□ 双方确认所有字段名、类型、示例。
□ A 组实现 MockChainService 时，必须返回 chainMode: "mock"，并且 tianpingCertId: null。
□ B 组实现 HardhatAdapter 时，必须返回 chainMode: "hardhat"，并且 tianpingCertId: null。
□ 前端必须根据 chainMode 显示不同状态文案。
□ 后端必须验证签名，不能只存签名字符串。
□ Hardhat 本地链重启后，合约地址会变化，A2 必须同步更新 backend/.env。
□ 任何改动必须同时更新此文档和对应的单元测试。
text

---

**操作步骤：**
1. 在项目根目录 `shared/` 下新建 `api-contract.md`。
2. 把上方全部内容复制进去。
3. 提交到 GitHub：
   ```bash
   git checkout feature/frontend-backend
   git add shared/api-contract.md
   git commit -m "docs: freeze API contract v1.0"
   git push
