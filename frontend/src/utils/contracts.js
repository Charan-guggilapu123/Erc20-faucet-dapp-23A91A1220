import { ethers } from "ethers";
import tokenAbi from "./abis/FaucetToken.json";
import faucetAbi from "./abis/TokenFaucet.json";

export const COOLDOWN_SECONDS = 24 * 60 * 60;

function getProvider() {
	const rpcUrl = import.meta.env.VITE_RPC_URL;
	if (typeof window !== "undefined" && window.ethereum) {
		return new ethers.BrowserProvider(window.ethereum);
	}
	if (!rpcUrl) throw new Error("VITE_RPC_URL is not configured");
	return new ethers.JsonRpcProvider(rpcUrl);
}

export async function getSigner() {
	const provider = getProvider();
	try {
		return await provider.getSigner();
	} catch {
		throw new Error("Wallet not connected. Call connectWallet() first.");
	}
}

export function getTokenContract(signerOrProvider) {
	const address = import.meta.env.VITE_TOKEN_ADDRESS;
	if (!address) throw new Error("VITE_TOKEN_ADDRESS is not configured");
	return new ethers.Contract(address, tokenAbi, signerOrProvider ?? getProvider());
}

export function getFaucetContract(signerOrProvider) {
	const address = import.meta.env.VITE_FAUCET_ADDRESS;
	if (!address) throw new Error("VITE_FAUCET_ADDRESS is not configured");
	return new ethers.Contract(address, faucetAbi, signerOrProvider ?? getProvider());
}

export async function getBalance(address) {
	const token = getTokenContract(getProvider());
	const bal = await token.balanceOf(address);
	return bal.toString();
}

export async function canClaim(address) {
	const faucet = getFaucetContract(getProvider());
	return await faucet.canClaim(address);
}

export async function getRemainingAllowance(address) {
	const faucet = getFaucetContract(getProvider());
	const rem = await faucet.remainingAllowance(address);
	return rem.toString();
}

export async function getLastClaimAt(address) {
	const faucet = getFaucetContract(getProvider());
	const ts = await faucet.lastClaimAt(address);
	return Number(ts);
}

export async function getPaused() {
	const faucet = getFaucetContract(getProvider());
	return await faucet.isPaused();
}

export async function requestTokens() {
	const signer = await getSigner();
	const faucet = getFaucetContract(signer);
	const tx = await faucet.requestTokens();
	const receipt = await tx.wait();
	return receipt.hash ?? tx.hash;
}

export async function connectWallet() {
	if (!window.ethereum) throw new Error("No EIP-1193 wallet found");
	const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
	if (!accounts || accounts.length === 0) throw new Error("Wallet connection rejected or no accounts");
	return accounts[0];
}

export function getContractAddresses() {
	return {
		token: import.meta.env.VITE_TOKEN_ADDRESS,
		faucet: import.meta.env.VITE_FAUCET_ADDRESS,
	};
}
