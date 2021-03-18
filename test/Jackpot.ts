import { smockit } from "@eth-optimism/smock";
import "@nomiclabs/hardhat-waffle";
import { expect } from "chai";
import { ethers } from "hardhat";

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
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const Jackpot = await ethers.getContractFactory("Jackpot", owner);
    const RandomFactory = await ethers.getContractFactory("RandomKeccak", owner);
    const randomContract = await RandomFactory.deploy();


    jackPotContract = await Jackpot.deploy(price, threshold);

    await jackPotContract.deployed();
    await randomContract.deployed();


    await jackPotContract.setRngAddress(randomContract.address);
    await randomContract.setJackpotAddress(jackPotContract.address);


    randomMockContract = await smockit(randomContract);

    console.log("radom address ", randomMockContract.address);

    randomMockContract.smocked.getRandomNumber.will.return.with(
      ethers.utils.formatBytes32String("abc")
    );
    randomMockContract.smocked.fulfillRandomness.will.return.with((id: string, rng: number) => {
      jackPotContract.fulfillRandomNumber(id, rng);
    }
    );

    await jackPotContract.setRngAddress(randomMockContract.address);
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
      await randomMockContract.connect(owner).fulfillRandomness(ethers.utils.formatBytes32String("abc"), threshold / 2);
      const balance = await jackPotContract.getLotteryBalance();
      expect(balance).be.equal(0);
    });

    it("Should not win the lottery", async function () {
      await jackPotContract.connect(addr1).buyTicket({ value: price });
      await jackPotContract.connect(addr1).roll();
      await randomMockContract.connect(owner).fulfillRandomness(ethers.utils.formatBytes32String("abc"), 1);
      const balance = await jackPotContract.getLotteryBalance();
      expect(balance).be.equal(price);
    });

    it("Should fail if the edition was incremented, someone has already won", async function () {
      await jackPotContract.connect(addr1).buyTicket({ value: price });
      await jackPotContract.connect(addr2).buyTicket({ value: price });

      await jackPotContract.connect(addr1).roll();
      await randomMockContract.connect(owner).fulfillRandomness(ethers.utils.formatBytes32String("abc"), threshold / 2);
      // addr1 wins
      expect(await jackPotContract.connect(addr2).edition()).be.equal(2);
    });
  });
});
