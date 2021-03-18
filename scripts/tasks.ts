import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

async function readArtifactAbi(name: string, hre: HardhatRuntimeEnvironment) {
  const artifact = await hre.artifacts.readArtifact(name);
  return artifact.abi;
}


task("accounts", "Prints the list of accounts", async (_, { ethers }) => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs, { web3 }) => {
    const account = web3.utils.toChecksumAddress(taskArgs.account);
    const balance = await web3.eth.getBalance(account);

    console.log(web3.utils.fromWei(balance, "ether"), "ETH");
  });


task("show-abis", "print SC's abis").setAction(async (_, hre) => {
  const util = require("util");
  const jackpot = await readArtifactAbi("Jackpot", hre);
  const randomVFR = await readArtifactAbi("RandomVRF", hre);

  console.log(util.inspect(jackpot, { showHidden: false, depth: null }));
  console.log(util.inspect(randomVFR, { showHidden: false, depth: null }));
});

task("fund-link", "Funds a contract with LINK")
  .addParam("contract", "The address of the contract that requires LINK")
  .setAction(async (taskArgs, { web3, ethers, network }) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;


    let linkContractAddr;
    console.log("Funding contract ", contractAddr, " on network ", networkId);
    const LINK_TOKEN_ABI = [
      {
        inputs: [
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];

    //set the LINK token contract address according to the environment
    switch (networkId) {
      case "mainnet":
        linkContractAddr = "0x514910771af9ca656af840dff83e8264ecf986ca";
        break;
      case "kovan":
        linkContractAddr = "0xa36085F69e2889c224210F603D836748e7dC0088";
        break;
      case "rinkeby":
        linkContractAddr = "0x01BE23585060835E02B77ef475b0Cc51aA1e0709";
        break;
      case "goerli":
        linkContractAddr = "0x326c977e6efc84e512bb9c30f76e30c160ed06fb";
        break;
      default:
        //default to kovan
        linkContractAddr = "0xa36085F69e2889c224210F603D836748e7dC0088";
    }
    //Fund with 10 LINK token
    const amount = web3.utils.toHex(1e18);

    //Get signer information
    const accounts = await ethers.getSigners();
    const signer = accounts[0];

    //Create connection to LINK token contract and initiate the transfer
    const linkTokenContract = new ethers.Contract(
      linkContractAddr,
      LINK_TOKEN_ABI,
      signer
    );
    var result = await linkTokenContract
      .transfer(contractAddr, amount)
      .then(function (transaction) {
        console.log(
          "Contract ",
          contractAddr,
          " funded with 10 LINK. Transaction Hash: ",
          transaction.hash
        );
      });
  });

task(
  "request-random-number",
  "Requests a random number for a Chainlink VRF enabled smart contract"
)
  .addParam(
    "contract",
    "The address of the API Consumer contract that you want to call"
  )
  .addParam(
    "seed",
    "The seed to be used in the requst for randomness",
    777,
    types.int
  )
  .setAction(async (taskArgs, hre) => {
    const contractAddr = taskArgs.contract;
    const seed = taskArgs.seed;
    const networkId = hre.network.name;
    console.log(
      "Requesting a random number using VRF consumer contract ",
      contractAddr,
      " on network ",
      networkId
    );

    const RANDOM_NUMBER_CONSUMER_ABI = await readArtifactAbi("RandomVRF", hre);
    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    //Create connection to VRF Contract and call the getRandomNumber function
    const vrfConsumerContract = new hre.ethers.Contract(
      contractAddr,
      RANDOM_NUMBER_CONSUMER_ABI,
      signer
    );
    var result = await vrfConsumerContract
      .getRandomNumber(seed)
      .then(function (transaction) {
        console.log(
          "Contract ",
          contractAddr,
          " external data request successfully called. Transaction Hash: ",
          transaction.hash
        );
        console.log("Run the following to read the returned random number:");
        console.log("npx hardhat read-random-number --contract ", contractAddr);
      });
  });

task(
  "read-random-number",
  "Reads the random number returned to a contract by Chainlink VRF"
)
  .addParam("contract", "The address of the VRF contract that you want to read")
  .setAction(async (taskArgs, hre) => {
    const contractAddr = taskArgs.contract;
    const networkId = hre.network.name;
    console.log(
      "Reading data from VRF contract ",
      contractAddr,
      " on network ",
      networkId
    );

    const RANDOM_NUMBER_CONSUMER_ABI = await readArtifactAbi("RandomVRF", hre);
    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    //Create connection to API Consumer Contract and call the createRequestTo function
    const vrfConsumerContract = new hre.ethers.Contract(
      contractAddr,
      RANDOM_NUMBER_CONSUMER_ABI,
      signer
    );
    var result = await vrfConsumerContract
      .getRandomResult()
      .then(function (data) {
        console.log(
          "Random Number is: ",
          hre.web3.utils.hexToNumberString(data._hex)
        );
      });
  });

task("buy-ticket", "Buy a ticket for the lottery")
  .addParam("contract", "The address of the SC")
  .setAction(async (taskArgs, hre) => {
    const contractAddr = taskArgs.contract;
    const networkId = hre.network.name;
    console.log(
      "Buying a ticket on the contract ",
      contractAddr,
      " on network ",
      networkId
    );

    const JACKPOT_ABI = await readArtifactAbi("Jackpot", hre);
    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    const jackpotContract = new hre.ethers.Contract(
      contractAddr,
      JACKPOT_ABI,
      signer
    );

    var result = await jackpotContract
      .buyTicket({ value: hre.ethers.utils.parseEther("0.05") })
      .then(function (transaction) {
        console.log(
          "Contract ",
          contractAddr,
          " external data request successfully called. Transaction Hash: ",
          transaction.hash
        );
        console.log("Run the following to draw a lot");
        console.log("npx hardhat roll --contract ", contractAddr);
      });
  });

task("roll", "roll to generate some random number")
  .addParam("contract", "The address of the SC")
  .setAction(async (taskArgs, hre) => {
    const contractAddr = taskArgs.contract;
    const networkId = hre.network.name;
    console.log(
      "Rolling on the contract ",
      contractAddr,
      " on network ",
      networkId
    );

    const JACKPOT_ABI = await readArtifactAbi("Jackpot", hre);
    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    const jackpotContract = new hre.ethers.Contract(
      contractAddr,
      JACKPOT_ABI,
      signer
    );

    var result = await jackpotContract.roll().then(function (transaction) {
      console.log(
        "Contract ",
        contractAddr,
        " external data request successfully called. Transaction Hash: ",
        transaction.hash
      );
      console.log("Run the following to draw a lot");
      console.log("npx hardhat draw-lot --contract ", contractAddr);
    });
  });

task("draw-lot", "Draw a lot in the lottery")
  .addParam("contract", "The address of the SC")
  .setAction(async (taskArgs, hre) => {
    const contractAddr = taskArgs.contract;
    const networkId = hre.network.name;
    console.log(
      "Draw a lot on the contract ",
      contractAddr,
      " on network ",
      networkId
    );

    const JACKPOT_ABI = await readArtifactAbi("Jackpot", hre);
    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    const jackpotContract = new hre.ethers.Contract(
      contractAddr,
      JACKPOT_ABI,
      signer
    );

    var result = await jackpotContract.drawLots().then(function (transaction) {
      console.log(
        "Contract ",
        contractAddr,
        " external data request successfully called. Transaction Hash: ",
        transaction.hash
      );
    });
  });

task("set-addresses", "set rng address")
  .addParam("contract", "The address of the SC")
  .addParam("rngaddr", "The address of the SC")
  .setAction(async (taskArgs, hre) => {
    const contractAddr = taskArgs.contract;
    const rngAddr = taskArgs.rngaddr;
    const networkId = hre.network.name;
    console.log(
      "Draw a lot on the contract ",
      contractAddr,
      " on network ",
      networkId
    );

    const JACKPOT_ABI = await readArtifactAbi("Jackpot", hre);
    const VRF_ABI = await readArtifactAbi("RandomVRF", hre);
    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    const jackpotContract = new hre.ethers.Contract(
      contractAddr,
      JACKPOT_ABI,
      signer
    );

    const rngContract = new hre.ethers.Contract(
      rngAddr,
      VRF_ABI,
      signer
    );

    var result = await jackpotContract.setRngAddress(rngAddr).then(function (transaction) {
      console.log(
        "Contract ",
        contractAddr,
        " external data request successfully called. Transaction Hash: ",
        transaction.hash
      );
    });

    var result = await rngContract.setJackpotAddress(contractAddr).then(function (transaction) {
      console.log(
        "Contract ",
        contractAddr,
        " external data request successfully called. Transaction Hash: ",
        transaction.hash
      );
    });
  });
module.exports = {};