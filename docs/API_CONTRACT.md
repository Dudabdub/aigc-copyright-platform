# A/B 组接口契约

## 链服务

```ts
export interface IChainService {
  signAgreement(creatorAddress: string, agreementHash: string, signature: string): Promise<{
    txHash: string | null;
    signedAt: number;
    mode: 'hardhat' | 'tianping';
  }>;
  registerCopyright(data: {
    imageHash: string;          // 0x + 64 hex chars, SHA-256
    watermarkedHash: string;    // 0x + 64 hex chars, SHA-256
    fingerprint: string;        // 0x + 64 hex chars, bytes32
    imageCid: string;
    watermarkedCid: string;
    metadataCid?: string;
    ownerAddress: string;
  }): Promise<{
    copyrightId: string;
    txHash: string | null;
    blockNumber?: number;
    tianpingCertId: string | null;
  }>;
  verifyCopyright(imageHash: string): Promise<{
    valid: boolean; owner: string | null; timestamp: number | null;
  }>;
  logAIDetection(imageId: string, detectionResultHash: string): Promise<{ txHash: string | null }>;
  getTianpingCertId(copyrightId: string): Promise<{ tianpingCertId: string | null }>;
}
```

## 前端依赖的 API 请求

- `POST /api/copyright/sign-agreement` JSON `{ creatorAddress, agreementText, signature }`
- `POST /api/upload/image` multipart `{ image, ownerAddress }`
- `POST /api/copyright/register` JSON `{ imageHash, watermarkedHash, fingerprint, imageCid, watermarkedCid, metadataCid, ownerAddress, watermarkPayload }`
- `GET /api/copyright/list?owner=<address>` 返回 `{ success: true, data: [...] }`
- `POST /api/verify/copyright` multipart `{ image }`
- `POST /api/verify/similar` multipart `{ image }`
- `POST /api/detect/ai` multipart `{ image }`
- `GET /api/report/:copyrightId` 返回 `application/pdf`

## 约束

1. 哈希和 bytes32 均使用规范的 `0x` + 64 位十六进制字符串。原有 pHash 若只返回 64 位，应先转换/补齐并在契约中固定规则。
2. `ownerAddress` 必须从钱包账户读取，后端必须验证签名对应地址，不应信任客户端传入的地址。
3. Hardhat 模式没有真实天平链编号，返回 `tianpingCertId: null`，不可用随机值填充。
4. 天平链适配器在未配置正式网关与授权凭据时应显式返回“未接入”，不能伪造成功状态。
