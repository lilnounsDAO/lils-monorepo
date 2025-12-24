import { Address, encodeFunctionData, erc20Abi } from "viem";
import { useCallback } from "react";
import { useSendTransaction, UseSendTransactionReturnType } from "wagmi";

interface UseApproveErc20ReturnType extends Omit<UseSendTransactionReturnType, "sendTransaction"> {
  approveErc20: (tokenAddress: Address, spender: Address, amount: bigint) => void;
}

export function useApproveErc20(): UseApproveErc20ReturnType {
  const { sendTransaction, ...other } = useSendTransaction();

  const approveErc20 = useCallback(
    (tokenAddress: Address, spender: Address, amount: bigint) => {
      sendTransaction({
        to: tokenAddress,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [spender, amount],
        }),
      });
    },
    [sendTransaction],
  );

  return { approveErc20, ...other };
} 