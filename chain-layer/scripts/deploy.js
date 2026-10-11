const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Agreement = await hre.ethers.getContractFactory("OriginalityAgreement");
  const agreement = await Agreement.deploy();
  await agreement.waitForDeployment();
  const agreementAddr = await agreement.getAddress();
  console.log("OriginalityAgreement:", agreementAddr);

  const Registry = await hre.ethers.getContractFactory("CopyrightRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("CopyrightRegistry:", registryAddr);

  const REGISTRAR_ROLE = await registry.REGISTRAR_ROLE();
  const tx = await registry.grantRole(REGISTRAR_ROLE, deployer.address);
  await tx.wait();
  console.log("REGISTRAR_ROLE granted to deployer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });