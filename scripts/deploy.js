import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = deployer.address;
  console.log("获取部署合约账户地址：", address);

  const contractFactory = await ethers.getContractFactory("SimpleToken");
  const deployContract = await contractFactory.deploy();

  await deployContract.waitForDeployment();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
