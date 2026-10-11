const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CopyrightRegistry", function () {
  let registry, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CopyrightRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  it("应成功注册版权", async function () {
    const imageHash = ethers.keccak256(ethers.toUtf8Bytes("image1"));
    const wmHash = ethers.keccak256(ethers.toUtf8Bytes("watermarked1"));
    const fp = ethers.keccak256(ethers.toUtf8Bytes("fingerprint1"));

    await expect(
      registry.registerCopyright(imageHash, wmHash, fp, "cid1", "cid2", "cid3")
    ).to.emit(registry, "CopyrightRegistered");

    const [valid, ownerAddr] = await registry.verifyCopyright(imageHash);
    expect(valid).to.be.true;
    expect(ownerAddr).to.equal(owner.address);
  });

  it("应拒绝重复注册", async function () {
    const imageHash = ethers.keccak256(ethers.toUtf8Bytes("dup"));
    await registry.registerCopyright(
      imageHash, ethers.ZeroHash, ethers.ZeroHash, "a", "b", "c"
    );
    await expect(
      registry.registerCopyright(
        imageHash, ethers.ZeroHash, ethers.ZeroHash, "a", "b", "c"
      )
    ).to.be.revertedWith("Already registered");
  });

  it("未授权地址应无法注册", async function () {
    await expect(
      registry.connect(addr1).registerCopyright(
        ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash, "a", "b", "c"
      )
    ).to.be.reverted;
  });

  it("应能查询到 owner 的所有记录", async function () {
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("img-a"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("img-b"));
    await registry.registerCopyright(h1, ethers.ZeroHash, ethers.ZeroHash, "a", "b", "c");
    await registry.registerCopyright(h2, ethers.ZeroHash, ethers.ZeroHash, "a", "b", "c");
    const list = await registry.getOwnerRecords(owner.address);
    expect(list.length).to.equal(2);
  });
});