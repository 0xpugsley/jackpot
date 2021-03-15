#!/bin/bash

npx hardhat buy-ticket --contract $1
npx hardhat roll --contract $1

sleep 5
npx hardhat draw-lot --contract $1
