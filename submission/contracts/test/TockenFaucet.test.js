const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("TokenFaucet", function () {
  let Token, Faucet, token, faucet;
  let owner, user1, user2;

  const FAUCET_AMOUNT = ethers.parseEther("100");
  const MAX_CLAIM_AMOUNT = ethers.parseEther("1000");
  const COOLDOWN = 24 * 60 * 60;

  async function increaseTime(seconds) {
    await network.provider.send("evm_increaseTime", [seconds]);
    await network.provider.send("evm_mine");
  }

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy token first (no faucet configured yet)
    const TokenFactory = await ethers.getContractFactory("FaucetToken");
    token = await TokenFactory.deploy();
    await token.waitForDeployment();

    // Deploy faucet with token address
    const FaucetFactory = await ethers.getContractFactory("TokenFaucet");
    faucet = await FaucetFactory.deploy(await token.getAddress());
    await faucet.waitForDeployment();

    // Configure token faucet (owner-only)
    const tx = await token.setFaucet(await faucet.getAddress());
    await tx.wait();
  });

  /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT TESTS
  //////////////////////////////////////////////////////////////*/

  it("should deploy with correct admin and token address", async function () {
    expect(await faucet.admin()).to.equal(owner.address);
    expect(await faucet.token()).to.equal(await token.getAddress());
  });

  it("token should have zero initial supply", async function () {
    expect(await token.totalSupply()).to.equal(0);
  });

  /*//////////////////////////////////////////////////////////////
                        SUCCESSFUL CLAIM
  //////////////////////////////////////////////////////////////*/

  it("should allow a user to successfully claim tokens", async function () {
    await expect(faucet.connect(user1).requestTokens())
      .to.emit(faucet, "TokensClaimed")
      .withArgs(user1.address, FAUCET_AMOUNT, await timeLatest());

    expect(await token.balanceOf(user1.address)).to.equal(FAUCET_AMOUNT);
    expect(await faucet.totalClaimed(user1.address)).to.equal(FAUCET_AMOUNT);
  });

  /*//////////////////////////////////////////////////////////////
                        COOLDOWN ENFORCEMENT
  //////////////////////////////////////////////////////////////*/

  it("should revert if user claims during cooldown", async function () {
    await faucet.connect(user1).requestTokens();

    await expect(
      faucet.connect(user1).requestTokens()
    ).to.be.revertedWith("Cooldown period active");
  });

  it("should allow claim after cooldown passes", async function () {
    await faucet.connect(user1).requestTokens();
    await increaseTime(COOLDOWN);

    await faucet.connect(user1).requestTokens();

    expect(await token.balanceOf(user1.address)).to.equal(
      FAUCET_AMOUNT * 2n
    );
  });

  /*//////////////////////////////////////////////////////////////
                    LIFETIME LIMIT ENFORCEMENT
  //////////////////////////////////////////////////////////////*/

  it("should enforce lifetime claim limit", async function () {
    const maxClaims = MAX_CLAIM_AMOUNT / FAUCET_AMOUNT;

    for (let i = 0; i < maxClaims; i++) {
      await faucet.connect(user1).requestTokens();
      await increaseTime(COOLDOWN);
    }

    await expect(
      faucet.connect(user1).requestTokens()
    ).to.be.revertedWith("Lifetime claim limit reached");
  });

  it("remainingAllowance should return correct value", async function () {
    await faucet.connect(user1).requestTokens();
    expect(await faucet.remainingAllowance(user1.address)).to.equal(
      MAX_CLAIM_AMOUNT - FAUCET_AMOUNT
    );
  });

  /*//////////////////////////////////////////////////////////////
                        PAUSE MECHANISM
  //////////////////////////////////////////////////////////////*/

  it("admin should be able to pause faucet", async function () {
    await expect(faucet.connect(owner).setPaused(true))
      .to.emit(faucet, "FaucetPaused")
      .withArgs(true);

    expect(await faucet.isPaused()).to.equal(true);
  });

  it("non-admin cannot pause faucet", async function () {
    await expect(
      faucet.connect(user1).setPaused(true)
    ).to.be.revertedWith("Only admin can pause");
  });

  it("should revert claims when faucet is paused", async function () {
    await faucet.connect(owner).setPaused(true);

    await expect(
      faucet.connect(user1).requestTokens()
    ).to.be.revertedWith("Faucet is paused");
  });

  /*//////////////////////////////////////////////////////////////
                        MULTI-USER TESTS
  //////////////////////////////////////////////////////////////*/

  it("multiple users should have independent cooldowns", async function () {
    await faucet.connect(user1).requestTokens();
    await faucet.connect(user2).requestTokens();

    expect(await token.balanceOf(user1.address)).to.equal(FAUCET_AMOUNT);
    expect(await token.balanceOf(user2.address)).to.equal(FAUCET_AMOUNT);
  });

  it("canClaim should return correct values", async function () {
    expect(await faucet.canClaim(user1.address)).to.equal(true);

    await faucet.connect(user1).requestTokens();

    expect(await faucet.canClaim(user1.address)).to.equal(false);
  });

  /*//////////////////////////////////////////////////////////////
                        HELPER
  //////////////////////////////////////////////////////////////*/

  async function timeLatest() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
