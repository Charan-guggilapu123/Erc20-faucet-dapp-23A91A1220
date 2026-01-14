// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FaucetToken
 * @author You
 * @notice ERC-20 token mintable only by the Faucet contract
 */
contract FaucetToken is ERC20, Ownable {
    /// @notice Maximum token supply (immutable after deployment)
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10 ** 18;

    /// @notice Faucet contract allowed to mint tokens
    address public faucet;
    bool public faucetSet;

    constructor() ERC20("FaucetToken", "FCT") Ownable(msg.sender) {}

    /**
     * @notice One-time configuration of the faucet address (owner-only)
     * @param _faucet Address of the TokenFaucet contract
     */
    function setFaucet(address _faucet) external onlyOwner {
        require(!faucetSet, "Faucet already set");
        require(_faucet != address(0), "Faucet address cannot be zero");
        faucet = _faucet;
        faucetSet = true;
    }

    /**
     * @notice Mint tokens to a user (only callable by faucet)
     * @param to Recipient address
     * @param amount Amount to mint (in base units)
     */
    function mint(address to, uint256 amount) external {
        require(faucetSet, "Faucet not configured");
        require(msg.sender == faucet, "Only faucet can mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");

        _mint(to, amount);
        // ERC20 _mint emits Transfer(address(0), to, amount)
    }
}
