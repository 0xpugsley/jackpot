// SPDX-License-Identifier: MIT

pragma solidity ^0.6.7;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./JackpotInterface.sol";

contract RandomVRF is VRFConsumerBase, Ownable {
    bytes32 public keyHash;
    uint256 public fee;

    address public lottery;
    address public vrfCoordinator;

    uint256 public randomResult;

    /**
     * Constructor inherits VRFConsumerBase
     *
     * Network: Kovan
     * Chainlink VRF Coordinator address: 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9
     * LINK token address:                0xa36085F69e2889c224210F603D836748e7dC0088
     * Key Hash: 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4
     */
    constructor(
        address _vrfCoordinator,
        address _link,
        bytes32 _keyHash,
        uint256 _fee
    )
        public
        VRFConsumerBase(
            _vrfCoordinator, // VRF Coordinator
            _link // LINK Token
        )
    {
        keyHash = _keyHash;
        fee = _fee;
        vrfCoordinator = _vrfCoordinator;
    }

    function setJackpotAddress(address _jackpotAddress) public onlyOwner {
        lottery = _jackpotAddress;
    }
    /**
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(uint256 userProvidedSeed)
        public
        returns (bytes32 requestId)
    {
        require(msg.sender == lottery, "Only lotery contract can call this");
        require(
            LINK.balanceOf(address(this)) > fee,
            "Not enough LINK - fill contract with faucet"
        );

        return requestRandomness(keyHash, fee, userProvidedSeed);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        require(
            msg.sender == vrfCoordinator,
            "Fulillment only permitted by Coordinator"
        );
        randomResult = randomness;
        JackpotInterface(lottery).fulfillRandomNumber(requestId, randomness);
    }

    function withdrawLink() external onlyOwner {
        require(
            LINK.transfer(msg.sender, LINK.balanceOf(address(this))),
            "Unable to transfer"
        );
    }
}
