"use client";
import { Address, encodeFunctionData } from "viem";
import { UseSendTransactionReturnType, useSendTransaction } from "./useSendTransaction";
import { nounsNftTokenConfig } from "@/data/generated/wagmi";
import { useCallback } from "react";
import { CHAIN_CONFIG } from "@/config";

interface UseApproveNounReturnType extends Omit<UseSendTransactionReturnType, "sendTransaction"> {
  approveNoun: (nounId: bigint, spender: Address) => void;
}

export function useApproveNoun(): UseApproveNounReturnType {
  const { sendTransaction, ...other } = useSendTransaction();

  const approveNoun = useCallback(
    (nounId: bigint, spender: Address) => {
      const request = {
        to: CHAIN_CONFIG.addresses.nounsToken,
        data: encodeFunctionData({
          abi: nounsNftTokenConfig.abi,
          functionName: "approve",
          args: [spender, nounId],
        }),
        value: BigInt(0),
        gasFallback: BigInt(100000), // NOUN approve generally ~60k
      };

      return sendTransaction(request, {
        type: "approve-noun",
        description: `Approve Noun ${nounId}`,
      });
    },
    [sendTransaction]
  );

  return { approveNoun, ...other };
}
