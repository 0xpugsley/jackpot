#!/bin/bash

npx hardhat buy-ticket --contract $1
npx hardhat roll --contract $1

