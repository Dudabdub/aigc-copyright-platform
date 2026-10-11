const ChainService = require("../chainService");
const { ethers } = require("ethers");

async function main() {
  const chain = new ChainService(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // Hardhat Account #0 私钥，仅本地测试用
  );

  const imageHash = ethers.keccak256(ethers.toUtf8Bytes("smoke-image"));
  const wmHash = ethers.keccak256(ethers.toUtf8Bytes("smoke-wm"));
  const fp = ethers.keccak256(ethers.toUtf8Bytes("smoke-fp"));

  const result = await chain.registerCopyright({
    imageHash, watermarkedHash: wmHash, fingerprint: fp,
    imageCid: "cid-img", watermarkedCid: "cid-wm", metadataCid: "cid-meta"
  });
  console.log("注册成功:", result);

  const v = await chain.verifyCopyright(imageHash);
  console.log("验证结果:", v);
  console.log("断言:", v.valid === true ? "PASS" : "FAIL");
}

main().then(() => process.exit(0)).catch(console.error);