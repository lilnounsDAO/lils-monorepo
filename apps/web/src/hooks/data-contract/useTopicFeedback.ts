import { useAccount, useWriteContract } from "wagmi";
import { nounsDaoDataAbi } from "@/abis/nounsDaoData";
import { CHAIN_CONFIG } from "@/config";
import { TransactionState } from "../transactions/types";

interface UseTopicFeedbackReturn {
  sendFeedback: (
    creatorAddress: string,
    slug: string,
    support: number,
    reason: string
  ) => Promise<void>;
  state: TransactionState;
  error: Error | null;
}

export function useTopicFeedback(): UseTopicFeedbackReturn {
  const { address } = useAccount();
  const { writeContractAsync, isPending, isError, error } = useWriteContract();

  const sendFeedback = async (
    creatorAddress: string,
    slug: string,
    support: number,
    reason: string
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    await writeContractAsync({
      address: CHAIN_CONFIG.addresses.nounsDAODataProxy,
      abi: nounsDaoDataAbi,
      functionName: "sendTopicFeedback",
      args: [creatorAddress as `0x${string}`, slug, support, reason],
    });
  };

  let state: TransactionState = "idle";
  if (isPending) state = "pending-txn";
  if (isError) state = "failed";

  return {
    sendFeedback,
    state,
    error: error as Error | null,
  };
}


