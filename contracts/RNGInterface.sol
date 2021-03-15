//SPDX-License-Identifier: MIT

pragma solidity ^0.6.7;

interface RNGInterface {

    function getRandomNumber(uint256 userProvidedSeed) external returns (bytes32 requestId);
}