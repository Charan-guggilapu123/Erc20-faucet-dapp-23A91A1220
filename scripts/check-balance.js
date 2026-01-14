const hre = require("hardhat");

async function main() {
  const provider = hre.ethers.provider;
  const [signer] = await hre.ethers.getSigners();
  const addr = await signer.getAddress();
  const bal = await provider.getBalance(addr);
  const eth = hre.ethers.formatEther(bal);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", addr);
  console.log("Balance:", eth, "ETH");
  if (hre.network.name === "sepolia") {
    const needed = 0.02; // recommended minimum
    if (parseFloat(eth) < needed) {
      console.log(
        `Warning: Low Sepolia balance (< ${needed} ETH). Please fund this address before deploying.`
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
