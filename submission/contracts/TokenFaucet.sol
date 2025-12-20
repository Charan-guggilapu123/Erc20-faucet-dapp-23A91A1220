// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFaucetToken {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title TokenFaucet
 * @author You
 * @notice ERC-20 token faucet with cooldown and lifetime limits
 */
contract TokenFaucet {
    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant FAUCET_AMOUNT = 100 * 10 ** 18;
    uint256 public constant COOLDOWN_TIME = 1 days;
    uint256 public constant MAX_CLAIM_AMOUNT = 1000 * 10 ** 18;

    /*//////////////////////////////////////////////////////////////
                                STATE
    //////////////////////////////////////////////////////////////*/

    IFaucetToken public immutable token;
    address public immutable admin;
    bool private paused;

    mapping(address => uint256) public lastClaimAt;
    mapping(address => uint256) public totalClaimed;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event FaucetPaused(bool paused);

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "Invalid token address");
        token = IFaucetToken(tokenAddress);
        admin = msg.sender;
        paused = false;
    }

    /*//////////////////////////////////////////////////////////////
                          EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Request faucet tokens
     */
    function requestTokens() external {
        require(!paused, "Faucet is paused");

        address user = msg.sender;

        require(
            block.timestamp >= lastClaimAt[user] + COOLDOWN_TIME,
            "Cooldown period active"
        );

        uint256 remaining = remainingAllowance(user);
        require(remaining >= FAUCET_AMOUNT, "Lifetime claim limit reached");

        // Effects
        lastClaimAt[user] = block.timestamp;
        totalClaimed[user] += FAUCET_AMOUNT;

        // Interaction
        token.mint(user, FAUCET_AMOUNT);

        emit TokensClaimed(user, FAUCET_AMOUNT, block.timestamp);
    }

    /**
     * @notice Check if an address can currently claim tokens
     */
    function canClaim(address user) public view returns (bool) {
        if (paused) return false;
        if (block.timestamp < lastClaimAt[user] + COOLDOWN_TIME) return false;
        if (totalClaimed[user] >= MAX_CLAIM_AMOUNT) return false;
        return true;
    }

    /**
     * @notice Remaining lifetime allowance for an address
     */
    function remainingAllowance(address user) public view returns (uint256) {
        if (totalClaimed[user] >= MAX_CLAIM_AMOUNT) {
            return 0;
        }
        return MAX_CLAIM_AMOUNT - totalClaimed[user];
    }

    /**
     * @notice Pause or unpause the faucet (admin only)
     */
    function setPaused(bool _paused) external {
        require(msg.sender == admin, "Only admin can pause");
        paused = _paused;
        emit FaucetPaused(_paused);
    }

    /**
     * @notice Check if faucet is paused
     */
    function isPaused() external view returns (bool) {
        return paused;
    }
}
