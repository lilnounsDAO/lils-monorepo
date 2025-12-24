"use client";
import { useCallback } from "react";
import { encodeFunctionData } from "viem";
import { useAccount } from "wagmi";

import { nounsDaoDataAbi } from "@/abis/nounsDaoData";
import { CHAIN_CONFIG } from "@/config";
import { Topic } from "@/data/goldsky/governance/getTopics";
import { CustomTransactionValidationError } from "./types";
import {
  UseSendTransactionReturnType,
  useSendTransaction,
} from "./useSendTransaction";

interface UseCancelTopicReturnType
  extends Omit<UseSendTransactionReturnType, "sendTransaction"> {
  cancelTopic: (topic: Topic) => Promise<void>;
}

export function useCancelTopic(): UseCancelTopicReturnType {
  const { sendTransaction, ...other } = useSendTransaction();
  const { address } = useAccount();

  const cancelTopic = useCallback(
    async (topic: Topic) => {
      if (!address) {
        throw new CustomTransactionValidationError(
          "NOT_CONNECTED",
          "Wallet not connected.",
        );
      }

      if (address.toLowerCase() !== topic.creator.toLowerCase()) {
        throw new CustomTransactionValidationError(
          "UNAUTHORIZED",
          "Only the creator can cancel this topic.",
        );
      }

      if (topic.canceled) {
        throw new CustomTransactionValidationError(
          "ALREADY_CANCELED",
          "This topic is already canceled.",
        );
      }

      const data = encodeFunctionData({
        abi: nounsDaoDataAbi,
        functionName: "cancelTopic",
        args: [topic.slug],
      });

      const request = {
        to: CHAIN_CONFIG.addresses.nounsDAODataProxy,
        data,
        value: BigInt(0),
        gasFallback: BigInt(250000),
      };

      return sendTransaction(
        request,
        {
          type: "cancel-topic" as any,
          description: `Cancel topic: ${topic.slug}`,
        },
        async () => {
          if (!address) {
            return new CustomTransactionValidationError(
              "NOT_CONNECTED",
              "Wallet not connected.",
            );
          }

          if (address.toLowerCase() !== topic.creator.toLowerCase()) {
            return new CustomTransactionValidationError(
              "UNAUTHORIZED",
              "Only the creator can cancel this topic.",
            );
          }

          if (topic.canceled) {
            return new CustomTransactionValidationError(
              "ALREADY_CANCELED",
              "This topic is already canceled.",
            );
          }

          return null;
        },
      );
    },
    [address, sendTransaction],
  );

  return { cancelTopic, ...other };
}


