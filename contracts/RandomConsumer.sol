//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface RandomConsumer {
    function getRandomNumber(uint256 seed) external returns (bytes32);
    function getRandomResult() external view returns (uint256);
}
