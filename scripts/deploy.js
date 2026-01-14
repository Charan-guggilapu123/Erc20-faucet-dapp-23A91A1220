const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy Token (no faucet configured yet)
  const Token = await hre.ethers.getContractFactory("FaucetToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  // 2. Deploy Faucet with token address
  const Faucet = await hre.ethers.getContractFactory("TokenFaucet");
  const faucet = await Faucet.deploy(await token.getAddress());
  await faucet.waitForDeployment();

  // 3. Configure token faucet (owner-only, one-time)
  const tx = await token.setFaucet(await faucet.getAddress());
  await tx.wait();

  const tokenAddress = await token.getAddress();
  const faucetAddress = await faucet.getAddress();
  console.log("Token:", tokenAddress);
  console.log("Faucet:", faucetAddress);

  // Persist deployment info to a JSON file for later use
  const networkName = hre.network.name;
  const out = {
    network: networkName,
    deployer: deployer.address,
    token: tokenAddress,
    faucet: faucetAddress,
    timestamp: new Date().toISOString(),
  };
  const outPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("Saved deployment info to:", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
