//SPDX-License-Identifier: MIT

pragma solidity ^0.6.7;

import "./JackpotInterface.sol";

contract RandomKeccak {
    address public jackpot;

    constructor(address _jackpot) public {
        jackpot = _jackpot;
    }

    function getRandomNumber(uint256 _seed) external returns (bytes32) {
        require(msg.sender == jackpot, "Only jackpot contract can call this");
        uint256 randomResult =
            uint256(keccak256(abi.encodePacked(block.difficulty, _seed)));
        // dummy id to be compliant with the interface
        fulfillRandomness(msg.sig, randomResult);
        return msg.sig;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal {
        JackpotInterface(jackpot).fulfilRandomNumber(randomness);
    }
}
