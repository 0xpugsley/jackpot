//SPDX-License-Identifier: MIT

pragma solidity ^0.6.7;

import "./RandomConsumer.sol";

contract RandomKeccak is RandomConsumer {
    uint256 private randomResult;
    bytes32 constant id = "abcabcabc";

    function getRandomNumber(uint256 _seed)
        external
        override
        returns (bytes32)
    {
        randomResult = uint256(
            keccak256(abi.encodePacked(block.difficulty, _seed))
        );

        // dummy id to be compliant with the interface
        return id;
    }

    function getRandomResult() external view override returns (uint256) {
        return randomResult;
    }
}
