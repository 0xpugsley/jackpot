import "@eth-optimism/smock/build/src/plugins/hardhat-storagelayout";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/types";
import "./scripts/tasks";

const config: HardhatUserConfig = {
  defaultNetwork: "kovan",
  solidity: "0.6.7",
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
};

export default config;