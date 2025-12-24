"use client";
import { useCallback } from "react";
import { encodeFunctionData } from "viem";
import { useAccount } from "wagmi";

import { nounsDaoDataAbi } from "@/abis/nounsDaoData";
import { CHAIN_CONFIG } from "@/config";
import { ProposalIdea } from "@/data/goldsky/governance/ideaTypes";
import { CustomTransactionValidationError } from "./types";
import {
  UseSendTransactionReturnType,
  useSendTransaction,
} from "./useSendTransaction";

interface UseCancelProposalCandidateReturnType
  extends Omit<UseSendTransactionReturnType, "sendTransaction"> {
  cancelCandidate: (candidate: ProposalIdea) => Promise<void>;
}

export function useCancelProposalCandidate(): UseCancelProposalCandidateReturnType {
  const { sendTransaction, ...other } = useSendTransaction();
  const { address } = useAccount();

  const cancelCandidate = useCallback(
    async (candidate: ProposalIdea) => {
      if (!address) {
        throw new CustomTransactionValidationError(
          "NOT_CONNECTED",
          "Wallet not connected.",
        );
      }

      if (address.toLowerCase() !== candidate.proposerAddress.toLowerCase()) {
        throw new CustomTransactionValidationError(
          "UNAUTHORIZED",
          "Only the proposer can cancel this candidate.",
        );
      }

      if (candidate.canceledTimestamp) {
        throw new CustomTransactionValidationError(
          "ALREADY_CANCELED",
          "This candidate is already canceled.",
        );
      }

      if (candidate.latestVersion.proposalId) {
        throw new CustomTransactionValidationError(
          "ALREADY_PROMOTED",
          "This candidate has already been promoted to a proposal.",
        );
      }

      const data = encodeFunctionData({
        abi: nounsDaoDataAbi,
        functionName: "cancelProposalCandidate",
        args: [candidate.slug],
      });

      const request = {
        to: CHAIN_CONFIG.addresses.nounsDAODataProxy,
        data,
        value: BigInt(0),
        gasFallback: BigInt(300000),
      };

      return sendTransaction(
        request,
        {
          type: "cancel-candidate" as any,
          description: `Cancel candidate: ${candidate.slug}`,
        },
        async () => {
          if (!address) {
            return new CustomTransactionValidationError(
              "NOT_CONNECTED",
              "Wallet not connected.",
            );
          }

          if (address.toLowerCase() !== candidate.proposerAddress.toLowerCase()) {
            return new CustomTransactionValidationError(
              "UNAUTHORIZED",
              "Only the proposer can cancel this candidate.",
            );
          }

          if (candidate.canceledTimestamp) {
            return new CustomTransactionValidationError(
              "ALREADY_CANCELED",
              "This candidate is already canceled.",
            );
          }

          if (candidate.latestVersion.proposalId) {
            return new CustomTransactionValidationError(
              "ALREADY_PROMOTED",
              "This candidate has already been promoted to a proposal.",
            );
          }

          return null;
        },
      );
    },
    [address, sendTransaction],
  );

  return { cancelCandidate, ...other };
}


