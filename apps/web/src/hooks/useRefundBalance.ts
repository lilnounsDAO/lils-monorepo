"use client";
import { formatEther, parseEther } from "viem";
import { useBalance } from "wagmi";
import { CHAIN_CONFIG } from "@/config";

// Vote gas refunds are paid from the DAO proxy's own ETH balance (NounsDAOVotes._refundGas)
export const REFUND_LOW_THRESHOLD = parseEther("0.1");
export const REFUND_REFILL_AMOUNT_ETH = "2";

export function useRefundBalance() {
  const { data, isLoading } = useBalance({
    address: CHAIN_CONFIG.addresses.nounsDaoProxy,
    chainId: CHAIN_CONFIG.chain.id,
    query: { refetchInterval: 60_000 },
  });

  const balance = data?.value;
  return {
    balance,
    formatted: balance !== undefined ? Number(formatEther(balance)).toFixed(3) : undefined,
    isLoading,
    isEmpty: balance === BigInt(0),
    isLow: balance !== undefined && balance < REFUND_LOW_THRESHOLD,
  };
}
