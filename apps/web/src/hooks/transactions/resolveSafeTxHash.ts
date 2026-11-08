import { Hash } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { getTransaction } from "viem/actions";
import { CHAIN_CONFIG } from "@/config";

const SAFE_TX_SERVICE_PREFIX: Record<number, string> = {
  [mainnet.id]: "eth",
  [sepolia.id]: "sep",
};

const POLL_INTERVAL_MS = 5000;
const DEFAULT_TIMEOUT_MS = 1000 * 60 * 30; // Multisig signers can take a while

/**
 * Safe wallets (via WalletConnect / Safe app) return a safeTxHash instead of an on-chain transaction hash.
 * Polls until the Safe transaction is executed and returns the real hash.
 * If `hash` is already an on-chain transaction it is returned as-is.
 * Returns null on timeout (Safe tx not executed yet).
 */
export async function resolveSafeTxHash(
  hash: Hash,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Hash | null> {
  const prefix = SAFE_TX_SERVICE_PREFIX[CHAIN_CONFIG.chain.id];
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    // Already a real transaction (e.g. contract wallet that isn't a Safe, or Safe app that returns the exec tx)
    try {
      await getTransaction(CHAIN_CONFIG.publicClient, { hash });
      return hash;
    } catch {
      // Not found on-chain, check Safe tx service
    }

    if (prefix) {
      try {
        const res = await fetch(
          `https://api.safe.global/tx-service/${prefix}/api/v1/multisig-transactions/${hash}/`,
        );
        if (res.ok) {
          const safeTx = (await res.json()) as { transactionHash?: Hash | null };
          if (safeTx.transactionHash) {
            return safeTx.transactionHash;
          }
        }
      } catch (e) {
        console.warn("Safe tx service request failed", e);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return null;
}
