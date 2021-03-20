//SPDX-License-Identifier: MIT

pragma solidity ^0.6.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "hardhat/console.sol";
import "./RNGInterface.sol";

contract Jackpot is Ownable {
    using SafeMath for uint256;

    uint256 lotteryTicketPrice;
    address public rng_address;

    struct Bet {
        uint32 edition;
        bool rolled;
    }

    mapping(address => Bet) players;

    mapping(bytes32 => address) randoms;

    uint32 public edition = 1;

    uint32 threshold;

    uint256 luckyNumber;

    uint256 public radnomNumber;

    event Win(address indexed _to, uint256 value);
    event Loss(address indexed _to);

    constructor(uint256 _lotteryTicketPrice, uint32 _threshold) public {
        lotteryTicketPrice = _lotteryTicketPrice;
        threshold = _threshold;
        luckyNumber = threshold / 2;
    }

    function setRngAddress(address _rng_address) public onlyOwner {
        rng_address = _rng_address;
    }

    function getLotteryBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getLotteryTicketPrice() public view returns (uint256) {
        return lotteryTicketPrice;
    }

    function isRegistered(address _account) external view returns (bool) {
        return players[_account].edition == edition;
    }

    function buyTicket() public payable {
        require(
            msg.value == lotteryTicketPrice,
            "Invalid lottery ticket price"
        );

        require(
            players[msg.sender].edition != edition,
            "Player has already bought tikcet"
        );

        players[msg.sender] = Bet(edition, false);

        uint256 price = getLotteryTicketPrice();
        console.log("Bought ticket by %s for %s", msg.sender, price);
    }

    function roll() external {
        Bet storage bet = players[msg.sender];
        require(
            bet.edition == edition,
            "The player has no ticket for this edition"
        );

        require(!bet.rolled, "The player has already rolled the number");

        uint256 seed =
            uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));

        bytes32 randomId = RNGInterface(rng_address).getRandomNumber(seed);

        randoms[randomId] = msg.sender;

        bet.rolled = true;
    }

    function isWinner(uint256 _number) private view returns (bool) {
        uint256 number = _number % threshold;
        if (number == luckyNumber) {
            return true;
        } else {
            return false;
        }
    }

    function fulfillRandomNumber(bytes32 requestId, uint256 _number)
        external
        payable
    {
        require(msg.sender == rng_address, "Only rng SC can call that");

        address payable player = payable(randoms[requestId]);

        Bet storage bet = players[player];
        require(
            bet.edition == edition,
            "The player has no ticket for this edition"
        );
        require(bet.rolled, "The player has not rolled");
        require(address(this).balance != 0, "The lottery has already been won");

        delete players[player];
        delete randoms[requestId];

        if (isWinner(_number)) {
            edition = edition + 1;
            player.transfer(getLotteryBalance());
            emit Win(player, getLotteryBalance());
            console.log("Lucky draw, eth was sent to wthe winner");
        } else {
            emit Loss(player);
            console.log("Unlucky draw");
        }
    }
}
