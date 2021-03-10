const { expect } = require("chai");
const { smockit } = require("@eth-optimism/smock");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("Jackpot contract", function () {
  let jackPotContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let randomMockContract;

  const price = ethers.constants.WeiPerEther;
  const threshold = 10;

  beforeEach(async function () {
    Jackpot = await ethers.getContractFactory("Jackpot");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const RandomFactory = await ethers.getContractFactory("RandomKeccak");
    randomMockContract = await smockit(RandomFactory);

    jackPotContract = await Jackpot.deploy(
      randomMockContract.address,
      price,
      threshold
    );

    await jackPotContract.deployed();

    randomMockContract.smocked.getRandomNumber.will.return.with(
      ethers.utils.formatBytes32String("abc")
    );
    randomMockContract.smocked.getRandomResult.will.return.with(threshold / 2);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await jackPotContract.owner()).to.equal(owner.address);
    });

    it("Pool balance shoul be 0 after deployment", async function () {
      const ownerBalance = await jackPotContract.getLotteryBalance();
      expect(ownerBalance).to.equal(0);
    });
  });

  describe("Transactions", function () {
    it("Should deposit ethers in the contract", async function () {
      const price = await jackPotContract.getLotteryTicketPrice();
      await jackPotContract.connect(addr1).buyTicket({ value: price });
      const poolSize = await jackPotContract.getLotteryBalance();
      expect(poolSize).to.equal(price);
    });

    it("Should fail if the amount is diffrent than allowed", async function () {
      const price = await jackPotContract.getLotteryTicketPrice();

      expect(
        jackPotContract.connect(addr1).buyTicket({ value: 0 })
      ).to.be.revertedWith("Invalid lottery ticket price");
    });

    it("Should fail if player has no ticket", async function () {
      expect(jackPotContract.connect(addr1).drawLots()).to.be.revertedWith(
        "Player has no ticket"
      );
    });

    it("Should win the lottery", async function () {
      await jackPotContract.connect(addr1).buyTicket({ value: price });

      await jackPotContract.connect(addr1).drawLots();
      const balance = await jackPotContract.getLotteryBalance();
      expect(balance).be.equal(0);
    });

    it("Should not win the lottery", async function () {

      randomMockContract.smocked.getRandomResult.will.return.with(1);

      await jackPotContract.connect(addr1).buyTicket({ value: price });
      await jackPotContract.connect(addr1).drawLots();
      const balance = await jackPotContract.getLotteryBalance();
      expect(balance).be.equal(price);
    });

    it("Should fial if the edition was incremented, someone has already won", async function () {
      await jackPotContract.connect(addr1).buyTicket({ value: price });
      await jackPotContract.connect(addr2).buyTicket({ value: price });

      // addr1 wins
      await jackPotContract.connect(addr1).drawLots();
      // addr2 should not be able to draw
      expect(jackPotContract.connect(addr2).drawLots()).be.revertedWith(
        "Player has no ticket for that edition"
      );

      expect(await jackPotContract.connect(addr2).edition()).be.equal(2);
    });
  });
});
