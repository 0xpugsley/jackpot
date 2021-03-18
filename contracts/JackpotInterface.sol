//SPDX-License-Identifier: MIT

pragma solidity ^0.6.7;

interface JackpotInterface {
    function fulfillRandomNumber(bytes32 requestId, uint256 randomNumber) external;
}
