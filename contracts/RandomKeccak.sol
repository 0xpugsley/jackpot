//SPDX-License-Identifier: MIT

pragma solidity ^0.6.7;

import "./JackpotInterface.sol";

contract RandomKeccak {
    address public jackpot;

    mapping(bytes32 => uint256) randoms;

    function setJackpotAddress(address _jackpotAddress) public {
        jackpot = _jackpotAddress;
    }

    function getRandomNumber(uint256 _seed) external returns (bytes32) {
        require(msg.sender == jackpot, "Only jackpot contract can call this");
        uint256 randomResult =
            uint256(keccak256(abi.encodePacked(block.difficulty, _seed)));
        randoms[msg.sig] = randomResult;
        return msg.sig;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) public {
        JackpotInterface(jackpot).fulfillRandomNumber(
            requestId,
            randoms[requestId]
        );
    }
}
