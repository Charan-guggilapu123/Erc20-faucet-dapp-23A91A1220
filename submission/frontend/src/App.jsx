import { useEffect, useMemo, useState } from "react";
import {
	connectWallet,
	getBalance,
	canClaim,
	getRemainingAllowance,
	requestTokens,
	getLastClaimAt,
	getPaused,
	COOLDOWN_SECONDS,
} from "./utils/contracts";

function formatEth(amountStr) {
	// Keep base units string per spec, show shortened for UI
	return amountStr;
}

export default function App() {
	const [address, setAddress] = useState("");
	const [balance, setBalance] = useState("0");
	const [eligible, setEligible] = useState(false);
	const [remaining, setRemaining] = useState("0");
	const [lastClaim, setLastClaim] = useState(0);
	const [paused, setPaused] = useState(false);
	const [cooldownLeft, setCooldownLeft] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const connected = useMemo(() => !!address, [address]);

	async function refresh() {
		if (!address) return;
		try {
			setError("");
			const [bal, claimable, rem, last, pausedState] = await Promise.all([
				getBalance(address),
				canClaim(address),
				getRemainingAllowance(address),
				getLastClaimAt(address),
				getPaused(),
			]);
			setBalance(bal);
			setEligible(claimable);
			setRemaining(rem);
			setLastClaim(last);
			setPaused(pausedState);
			const now = Math.floor(Date.now() / 1000);
			const left = Math.max(0, last + COOLDOWN_SECONDS - now);
			setCooldownLeft(left);
		} catch (e) {
			setError(e.message);
		}
	}

	useEffect(() => {
		refresh();
		const ethereum = window.ethereum;
		if (ethereum) {
			const handler = (accounts) => {
				setAddress(accounts[0] || "");
			};
			ethereum.on("accountsChanged", handler);
			return () => ethereum.removeListener("accountsChanged", handler);
		}
	}, [address]);

	useEffect(() => {
		if (!address) return;
		const interval = setInterval(() => {
			const now = Math.floor(Date.now() / 1000);
			setCooldownLeft(Math.max(0, lastClaim + COOLDOWN_SECONDS - now));
		}, 1000);
		return () => clearInterval(interval);
	}, [address, lastClaim]);

	async function onConnect() {
		try {
			const addr = await connectWallet();
			setAddress(addr);
			await refresh();
		} catch (e) {
			setError(e.message);
		}
	}

	async function onClaim() {
		try {
			setLoading(true);
			setError("");
			const hash = await requestTokens();
			await refresh();
			alert(`Claimed! Tx: ${hash}`);
		} catch (e) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ maxWidth: 640, margin: "2rem auto", fontFamily: "sans-serif" }}>
			<h1>ERC-20 Faucet</h1>
			{!connected ? (
				<button onClick={onConnect}>Connect Wallet</button>
			) : (
				<div>
					<div>Connected: {address}</div>
					<div>Balance: {formatEth(balance)}</div>
					<div>Remaining Allowance: {formatEth(remaining)}</div>
					<div>Paused: {paused ? "Yes" : "No"}</div>
					<div>
						Eligibility: {eligible && !paused ? "Ready to claim" : "Cooldown/limit/paused"}
					</div>
					<div>
						Cooldown remaining: {cooldownLeft > 0 ? `${cooldownLeft}s` : "Ready"}
					</div>
					<button onClick={onClaim} disabled={!eligible || paused || loading}>
						{loading ? "Claiming..." : "Request Tokens"}
					</button>
				</div>
			)}
			{error && <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>}
		</div>
	);
}
