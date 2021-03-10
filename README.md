# Jackpot Playground

This repository contains a sample project made mainly to learn something about
Solidity, Chainlink ecosystem and Hardhat.  
It is based on:  
[https://github.com/pappas999/chainlink-hardhat-box](https://github.com/pappas999/chainlink-hardhat-box)  
[https://github.com/nomiclabs/hardhat-hackathon-boilerplate](https://github.com/nomiclabs/hardhat-hackathon-boilerplate)  
and reuse a lot of them.

It is a dummy lottery. The user buys a ticket in one transaction and then draws a lot in another one, wins or loses.  
It is not the best implementation of the lottery on Ethereum, it may be the worst one or at least too verbose one.

### Requirements

- `NPM`

### Installation

```
npm install
```

Default netowrk: `kovan`

[Set environmental variables](https://github.com/pappas999/chainlink-hardhat-box/blob/main/README.md#installation):

```sh
export KOVAN_RPC_URL='www.infura.io/asdfadsfafdadf'
export PRIVATE_KEY='abcdef'
export ALCHEMY_MAINNET_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/your-api-key"
```

### Building

```sh
npx hardhat compile
```

### Unit testing

```sh
npx hardhat test --network hardhat 
```

### Generating abi

JSON files will be placed in `./abi` directory.

```sh
npx hardhat abi
```

### Deploying - both contracts

```sh
npx hardhat deploy
```

### Funding RandomVRF contract with link token

It needs that to take random numbers from an oracle.

```sh
npx hardhat fund-link --contract insert-vrf-contract-address-here
```

### Interaction

Buying the lottery ticket for i.e. 0.05 ETH

```sh
npx hardhat buy-ticket --contract insert-contract-address-here
```

#### Drawing a lot

If the draw is not be successfull the ticket will be gone.

```sh
 npx hardhat draw-lot --contract insert-contract-address-here
```
