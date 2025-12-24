"use client";
import { encodeFunctionData, Hex } from "viem";
import {
  UseSendTransactionReturnType,
  useSendTransaction,
} from "./useSendTransaction";
import { useCallback } from "react";
import { CustomTransactionValidationError } from "./types";
import { useAccount } from "wagmi";
import { CHAIN_CONFIG } from "@/config";
import { nounsDaoDataAbi } from "@/abis/nounsDaoData";

interface UseCreateTopicReturnType
  extends Omit<UseSendTransactionReturnType, "sendTransaction"> {
  createTopic: (
    title: string,
    description: string,
  ) => Promise<void>;
}

/**
 * Hook to create a new topic on NounsDAODataV2
 * Topics allow community discussion without formal proposal structure
 * Costs createTopicCost ETH for non-Nouners (free for Nouners)
 */
export function useCreateTopic(): UseCreateTopicReturnType {
  const { sendTransaction, ...other } = useSendTransaction();
  const { address } = useAccount();

  const createTopicValidation = useCallback(
    async (
      title: string,
      description: string,
    ): Promise<CustomTransactionValidationError | null> => {
      if (!address) {
        return new CustomTransactionValidationError(
          "NOT_CONNECTED",
          "Wallet not connected.",
        );
      }

      if (!title || title.trim() === "") {
        return new CustomTransactionValidationError(
          "MISSING_TITLE",
          "Topic title is required.",
        );
      }

      if (title.length > 200) {
        return new CustomTransactionValidationError(
          "TITLE_TOO_LONG",
          "Topic title must be 200 characters or less.",
        );
      }

      if (!description || description.trim() === "") {
        return new CustomTransactionValidationError(
          "MISSING_DESCRIPTION",
          "Topic description is required.",
        );
      }

      return null;
    },
    [address],
  );

  const createTopic = useCallback(
    async (
      title: string,
      description: string,
    ) => {
      // Create slug from title (lowercase, replace spaces with hyphens, remove special chars)
      const slug = title
        .toLowerCase()
        .replace(/\s+/g, "-")          // Replace spaces with hyphens
        .replace(/[^\w-]+/g, "")       // Remove non-word chars except hyphens
        .replace(/--+/g, "-")          // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, "")       // Remove leading/trailing hyphens
        .substring(0, 100);            // Limit slug length

      // Encode the createTopic function call
      const data = encodeFunctionData({
        abi: nounsDaoDataAbi,
        functionName: "createTopic",
        args: [title, description, slug],
      });

      // Get the fee cost from chain config
      // Non-Nouners must pay this fee, Nouners can post for free
      const value = CHAIN_CONFIG.dataContractFees?.createTopicCost || BigInt(0);

      const request = {
        to: CHAIN_CONFIG.addresses.nounsDAODataProxy,
        data,
        value,
        gasFallback: BigInt(300000), // Topics are simpler than candidates
      };

      return sendTransaction(
        request,
        {
          type: "create-topic" as any,
          description: `Create topic: ${title}`
        },
        () => createTopicValidation(title, description),
      );
    },
    [sendTransaction, createTopicValidation],
  );

  return { createTopic, ...other };
}
