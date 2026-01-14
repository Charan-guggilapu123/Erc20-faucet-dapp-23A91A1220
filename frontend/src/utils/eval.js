import {
  connectWallet as _connectWallet,
  requestTokens as _requestTokens,
  getBalance as _getBalance,
  canClaim as _canClaim,
  getRemainingAllowance as _getRemainingAllowance,
  getContractAddresses as _getContractAddresses,
} from "./contracts";

window.__EVAL__ = {
  async connectWallet() {
    try {
      return await _connectWallet();
    } catch (e) {
      throw new Error(`Wallet connection failed: ${e.message}`);
    }
  },

  async requestTokens() {
    try {
      return await _requestTokens();
    } catch (e) {
      throw new Error(`requestTokens failed: ${e.message}`);
    }
  },

  async getBalance(address) {
    try {
      return await _getBalance(address);
    } catch (e) {
      throw new Error(`getBalance failed: ${e.message}`);
    }
  },

  async canClaim(address) {
    try {
      return await _canClaim(address);
    } catch (e) {
      throw new Error(`canClaim failed: ${e.message}`);
    }
  },

  async getRemainingAllowance(address) {
    try {
      return await _getRemainingAllowance(address);
    } catch (e) {
      throw new Error(`getRemainingAllowance failed: ${e.message}`);
    }
  },

  async getContractAddresses() {
    try {
      return await _getContractAddresses();
    } catch (e) {
      throw new Error(`getContractAddresses failed: ${e.message}`);
    }
  },
};
