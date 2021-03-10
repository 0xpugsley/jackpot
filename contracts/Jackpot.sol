//SPDX-License-Identifier: MIT

pragma solidity ^0.6.7;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "hardhat/console.sol";
import "./RandomConsumer.sol";

contract Jackpot {
    using SafeMath for uint256;

    address public owner;

    uint256 lotteryTicketPrice;

    mapping(address => uint32) players;

    uint32 public edition = 1;

    uint32 threshold;

    RandomConsumer private randomConsumer;

    event Win(address indexed _to, uint256 value);
    event Loss(address indexed _to);

    constructor(
        RandomConsumer _random,
        uint256 _lotteryTicketPrice,
        uint32 _threshold
    ) public {
        owner = msg.sender;
        lotteryTicketPrice = _lotteryTicketPrice;
        threshold = _threshold;
        randomConsumer = _random;
    }

    function getLotteryBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getLotteryTicketPrice() public view returns (uint256) {
        return lotteryTicketPrice;
    }

    function isRegistered(address _account) external view returns (bool) {
        return players[_account] == edition;
    }

    function buyTicket() public payable {
        require(
            msg.value == lotteryTicketPrice,
            "Invalid lottery ticket price"
        );

        require(
            players[msg.sender] != edition,
            "Player has already bought tikcet"
        );

        players[msg.sender] = edition;
        uint256 price = getLotteryTicketPrice();
        console.log("Bought ticket by %s for %s", msg.sender, price);
    }

    function isWinner() private returns (bool) {
        uint256 seed =
            uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        
        randomConsumer.getRandomNumber(seed);
        uint256 number = randomConsumer.getRandomResult() % threshold;

        if (number == SafeMath.div(threshold, 2)) {
            return true;
        } else {
            return false;
        }
    }

    function drawLots() public payable {
        require(
            players[msg.sender] == edition,
            "Player has no ticket for that edition"
        );
        require(address(this).balance != 0, "The lottery has already been won");

        players[msg.sender] = 0;

        if (isWinner()) {
            edition = edition + 1;
            msg.sender.transfer(getLotteryBalance());
            emit Win(msg.sender, getLotteryBalance());
            console.log("Lucky draw, eth was sent to wthe winner");
        } else {
            emit Loss(msg.sender);
            console.log("Unlucky draw");
        }
    }
}
