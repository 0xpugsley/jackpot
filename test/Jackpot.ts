import { smockit } from "@eth-optimism/smock";
import "@nomiclabs/hardhat-waffle";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Jackpot } from "../typechain/Jackpot";
import { RandomVrf } from "../typechain/RandomVrf";
import { VrfCoordinatorMock } from "../typechain/VrfCoordinatorMock";


describe("Jackpot contract", function () {
  let jackPotContract: Jackpot;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let randomContract: RandomVrf;
  let randomMockContract: RandomVrf;
  let vrfCoordinatorContract: VrfCoordinatorMock;


  const price = ethers.constants.WeiPerEther;
  const threshold = 10;

  const LINK_TOKEN_ADDR = "0xa36085F69e2889c224210F603D836748e7dC0088";
  const VRF_COORDINATOR = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
  const VRF_FEE = "100000000000000000";
  const VRF_KEYHASH =
    "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const jackpot = await ethers.getContractFactory("Jackpot");
    const RandomFactory = await ethers.getContractFactory("RandomVRF");
    const vrfCoordinatorFactory = await ethers.getContractFactory("VRFCoordinatorMock");

    vrfCoordinatorContract = (await vrfCoordinatorFactory.deploy(LINK_TOKEN_ADDR)) as VrfCoordinatorMock;
    await vrfCoordinatorContract.deployed();

    randomContract = (await RandomFactory.deploy(vrfCoordinatorContract.address, LINK_TOKEN_ADDR,
      VRF_KEYHASH, VRF_FEE)) as RandomVrf;
    await randomContract.deployed();
    randomMockContract = await smockit(randomContract);

    jackPotContract = (await jackpot.deploy(price, threshold)) as Jackpot;
    await jackPotContract.deployed();

    await jackPotContract.connect(owner).setRngAddress(randomMockContract.address);
    await randomMockContract.connect(owner).setJackpotAddress(jackPotContract.address);

    randomMockContract.smocked.getRandomNumber.will.return.with(() =>
      ethers.utils.formatBytes32String("abc")
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await jackPotContract.owner()).to.equal(owner.address);
    });

    it("Pool balance should be 0 after deployment", async function () {
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

    it("Should fail if the amount is different than allowed", async function () {
      const price = await jackPotContract.getLotteryTicketPrice();

      expect(
        jackPotContract.connect(addr1).buyTicket({ value: 0 })
      ).to.be.revertedWith("Invalid lottery ticket price");
    });

    it("Should fail if player has no ticket", async function () {
      expect(jackPotContract.connect(addr1).roll()).to.be.revertedWith(
        "The player has no ticket for this edition"
      );
    });

    it("Should win the lottery", async function () {

      await jackPotContract.connect(addr1).buyTicket({ value: price });
      await jackPotContract.connect(addr1).roll();

      await jackPotContract.connect(owner).setRngAddress(owner.address);
      await jackPotContract.fulfillRandomNumber(ethers.utils.formatBytes32String("abc"), threshold / 2);

      const balance = await jackPotContract.getLotteryBalance();
      expect(balance).be.equal(0);
    });

    it("Should not win the lottery", async function () {
      await jackPotContract.connect(addr1).buyTicket({ value: price });
      await jackPotContract.connect(addr1).roll();

      await jackPotContract.connect(owner).setRngAddress(owner.address);
      await jackPotContract.connect(owner).fulfillRandomNumber(ethers.utils.formatBytes32String("abc"), 1);

      const balance = await jackPotContract.getLotteryBalance();
      expect(balance).be.equal(price);
    });

    it("Should fail if the edition was incremented, someone has already won", async function () {
      await jackPotContract.connect(addr1).buyTicket({ value: price });
      await jackPotContract.connect(addr2).buyTicket({ value: price });

      await jackPotContract.connect(addr1).roll();

      await jackPotContract.connect(owner).setRngAddress(owner.address);
      await jackPotContract.connect(owner).fulfillRandomNumber(ethers.utils.formatBytes32String("abc"), threshold / 2);
      // addr1 wins
      expect(await jackPotContract.connect(addr2).edition()).be.equal(2);
    });
  });
});
