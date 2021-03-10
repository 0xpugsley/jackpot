require("@nomiclabs/hardhat-waffle");

require("@eth-optimism/smock/build/src/plugins/hardhat-storagelayout");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-web3");
require("hardhat-deploy");

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs) => {
    const account = web3.utils.toChecksumAddress(taskArgs.account);
    const balance = await web3.eth.getBalance(account);

    console.log(web3.utils.fromWei(balance, "ether"), "ETH");
  });

module.exports = {};

task("show-abis", "print SC's abis").setAction(async (taskArgs) => {
  const util = require("util");
  const jackpot = require("./abi/Jackpot.json");
  const randomVFR = require("./abi/RandomVRF.json");

  console.log(util.inspect(jackpot.abi, { showHidden: false, depth: null }));
  console.log(util.inspect(randomVFR.abi, { showHidden: false, depth: null }));
});

task("fund-link", "Funds a contract with LINK")
  .addParam("contract", "The address of the contract that requires LINK")
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;
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
    const amount = web3.utils.toHex(10 * 1e18);

    //Get signer information
    const accounts = await hre.ethers.getSigners();
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
          " funded with 1 LINK. Transaction Hash: ",
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
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const seed = taskArgs.seed;
    const networkId = network.name;
    console.log(
      "Requesting a random number using VRF consumer contract ",
      contractAddr,
      " on network ",
      networkId
    );

    const randomVFR = require("./abi/RandomVRF.json");
    const RANDOM_NUMBER_CONSUMER_ABI = randomVFR.abi;
    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    //Create connection to VRF Contract and call the getRandomNumber function
    const vrfConsumerContract = new ethers.Contract(
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
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;
    console.log(
      "Reading data from VRF contract ",
      contractAddr,
      " on network ",
      networkId
    );

    const randomVFR = require("./abi/RandomVRF.json");

    const RANDOM_NUMBER_CONSUMER_ABI = randomVFR.abi;
    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    //Create connection to API Consumer Contract and call the createRequestTo function
    const vrfConsumerContract = new ethers.Contract(
      contractAddr,
      RANDOM_NUMBER_CONSUMER_ABI,
      signer
    );
    var result = await vrfConsumerContract
      .getRandomResult()
      .then(function (data) {
        console.log(
          "Random Number is: ",
          web3.utils.hexToNumberString(data._hex)
        );
      });
  });

task("buy-ticket", "Buy a ticket for the lottery")
  .addParam("contract", "The address of the SC")
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;
    console.log(
      "Buying a ticket on the contract ",
      contractAddr,
      " on network ",
      networkId
    );

    const jackpot = require("./abi/Jackpot.json");
    const JACKPOT_ABI = jackpot.abi;
    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    const jackpotContract = new ethers.Contract(
      contractAddr,
      JACKPOT_ABI,
      signer
    );

    var result = await jackpotContract
      .buyTicket({ value: ethers.utils.parseEther("0.05") })
      .then(function (transaction) {
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
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;
    console.log(
      "Draw a lot on the contract ",
      contractAddr,
      " on network ",
      networkId
    );

    const jackpot = require("./abi/Jackpot.json");
    const JACKPOT_ABI = jackpot.abi;
    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    const jackpotContract = new ethers.Contract(
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

module.exports = {
  defaultNetwork: "kovan",
  networks: {
    hardhat: {
      forking: {
        //this env var isn't mandatory for users who want to deploy on public networks
        url:
          process.env.ALCHEMY_MAINNET_RPC_URL ||
          "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
      },
    },
    kovan: {
      url: process.env.KOVAN_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
    feeCollector: {
      default: 1,
    },
  },
  solidity: "0.6.7",
};
