module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("deployer is %s", deployer);
  //LINK Token address set to Kovan address. Can get other values at https://docs.chain.link/docs/link-token-contracts
  //VRF Details set for Kovan environment, can get other values at https://docs.chain.link/docs/vrf-contracts#config
  const LINK_TOKEN_ADDR = "0xa36085F69e2889c224210F603D836748e7dC0088";
  const VRF_COORDINATOR = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
  const VRF_FEE = "100000000000000000";
  const VRF_KEYHASH =
    "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";

  LOTTERY_TICKET_PRICE = "50000000000000000";
  LOTTERY_THRESHOLD = 2;

  const jackpot = await deploy("Jackpot", {
    from: deployer,
    gasLimit: 4000000,
    args: [LOTTERY_TICKET_PRICE, LOTTERY_THRESHOLD],
  });

  console.log("Jackpot deployed to: ", jackpot.address);

  console.log("----------------------------------------------------");
  console.log("Deploying RandomVRF");
  const randomNumberConsumer = await deploy("RandomVRF", {
    from: deployer,
    gasLimit: 4000000,
    args: [VRF_COORDINATOR, LINK_TOKEN_ADDR, VRF_KEYHASH, VRF_FEE],
  });

  console.log("RandomVRF deployed to: ", randomNumberConsumer.address);

  console.log("Run the following command to fund contract with LINK:");
  console.log(
    "npx hardhat fund-link --contract ",
    randomNumberConsumer.address
  );
  console.log(
    "Then run RandomNumberConsumer contract with the following command, replacing '777' with your chosen seed number:"
  );
  console.log(
    "npx hardhat request-random-number --contract ",
    randomNumberConsumer.address,
    " --seed '777'"
  );

  console.log(
    "npx hardhat set-addresses --contract ",
    jackpot.address,
    " --rngaddr ",
    randomNumberConsumer.address
  );
  console.log("----------------------------------------------------");
};
