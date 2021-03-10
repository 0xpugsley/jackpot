//SPDX-License-Identifier: MIT

pragma solidity ^0.6.7;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import "./RandomConsumer.sol";

contract RandomVRF is RandomConsumer, VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;

    address public owner;

    uint256 private randomResult;

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
        owner = msg.sender;
        keyHash = _keyHash;
        fee = _fee;
    }

    /**
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(uint256 userProvidedSeed)
        public
        override
        returns (bytes32 requestId)
    {
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
        randomResult = randomness;
    }

    function getRandomResult() override external view returns (uint256) {
        return randomResult;
    }

    /**
     * Withdraw LINK from this contract
     *
     * DO NOT USE THIS IN PRODUCTION AS IT CAN BE CALLED BY ANY ADDRESS.
     * THIS IS PURELY FOR EXAMPLE PURPOSES.
     */
    function withdrawLink() external {
        require(msg.sender == owner);
        require(
            LINK.transfer(msg.sender, LINK.balanceOf(address(this))),
            "Unable to transfer"
        );
    }
}
