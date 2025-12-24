"use client";
import { useCallback } from "react";
import { useAccount } from "wagmi";
import { encodeFunctionData, Hex, getAddress } from "viem";
import { multicall } from "viem/actions";
import { CHAIN_CONFIG } from "@/config";
import { nounsDaoLogicConfig, nounsNftTokenConfig } from "@/data/generated/wagmi";
import {
  UseSendTransactionReturnType,
  useSendTransaction,
} from "./useSendTransaction";
import { CustomTransactionValidationError } from "./types";
import { ProposalIdea } from "@/data/goldsky/governance/ideaTypes";
import { nounsDoaLogicAbi } from "@/abis/nounsDoaLogic";

type PromoteMode = "auto" | "signatures" | "tokens";

interface UsePromoteCandidateReturnType
  extends Omit<UseSendTransactionReturnType, "sendTransaction"> {
  promoteCandidate: (
    candidate: ProposalIdea,
    options?: { mode?: PromoteMode },
  ) => Promise<void>;
}

export function usePromoteCandidate(): UsePromoteCandidateReturnType {
  const { sendTransaction, ...other } = useSendTransaction();
  const { address } = useAccount();

  const promoteCandidate = useCallback(
    async (candidate: ProposalIdea, options?: { mode?: PromoteMode }) => {
      if (!address) {
        throw new CustomTransactionValidationError(
          "NOT_CONNECTED",
          "Wallet not connected.",
        );
      }

      // Verify user is the proposer
      if (address.toLowerCase() !== candidate.proposerAddress.toLowerCase()) {
        throw new CustomTransactionValidationError(
          "UNAUTHORIZED",
          "Only the proposer can promote this candidate.",
        );
      }

      // Check if proposer has an active proposal
      try {
        const latestProposalId = await CHAIN_CONFIG.publicClient.readContract({
          address: CHAIN_CONFIG.addresses.nounsDaoProxy,
          abi: nounsDaoLogicConfig.abi,
          functionName: "latestProposalIds",
          args: [address],
        });

        if (latestProposalId && latestProposalId > 0n) {
          const proposalState = await CHAIN_CONFIG.publicClient.readContract({
            address: CHAIN_CONFIG.addresses.nounsDaoProxy,
            abi: nounsDaoLogicConfig.abi,
            functionName: "state",
            args: [latestProposalId],
          });

          // State 0 = Pending, 1 = Active, 2 = Canceled, 3 = Defeated, 4 = Succeeded, 5 = Queued, 6 = Expired, 7 = Executed
          if (proposalState === 0 || proposalState === 1) {
            throw new CustomTransactionValidationError(
              "ACTIVE_PROPOSAL_EXISTS",
              "You already have an active proposal. Wait for it to complete before promoting a new candidate.",
            );
          }
        }
      } catch (e) {
        // Re-throw validation errors
        if (e instanceof CustomTransactionValidationError) {
          throw e;
        }
        // Ignore other errors checking for active proposals
        console.warn("Failed to check for active proposals:", e);
      }

      const content = candidate.latestVersion.content;
      
      // Get valid signatures from the candidate
      const timestamp = Math.floor(Date.now() / 1000);
      const sponsors = candidate.latestVersion.contentSignatures || candidate.sponsors || [];
      const validSponsors = sponsors.filter(
        s => !s.canceled && s.expirationTimestamp > timestamp
      );
      const mode: PromoteMode = options?.mode ?? "auto";

      // Build proposer signatures array
      const proposerSignaturesMap = new Map<string, {
        sig: Hex;
        signer: string;
        expirationTimestamp: bigint;
      }>();

      validSponsors.forEach((sponsor) => {
        const signer = getAddress(sponsor.signer.id);
        const sigHex = sponsor.sig.startsWith('0x')
          ? sponsor.sig as Hex
          : `0x${sponsor.sig}` as Hex;

        if (!proposerSignaturesMap.has(signer)) {
          proposerSignaturesMap.set(signer, {
            sig: sigHex,
            signer,
            expirationTimestamp: BigInt(sponsor.expirationTimestamp),
          });
        }
      });

      const proposerSignatures = Array.from(proposerSignaturesMap.values());

      const targets = content.targets.map(t => getAddress(t));
      const values = content.values.map(v => BigInt(v));
      const signatures = content.signatures;
      const calldatas = content.calldatas.map(c => c as Hex);
      const description = `# ${content.title}\n\n${content.description}`;

      let data: Hex;
      const useSignaturePath = mode === "signatures" || (mode === "auto" && proposerSignatures.length > 0);
      const shouldForceTokenPath = mode === "tokens";

      // If forced tokens path or no signatures, use regular propose function (sole proposer)
      if (!useSignaturePath || shouldForceTokenPath) {
        // Check voting power and proposal threshold before promoting
        const [currentVotes, proposalThreshold] = await multicall(
          CHAIN_CONFIG.publicClient,
          {
            contracts: [
              {
                address: CHAIN_CONFIG.addresses.nounsToken,
                abi: nounsNftTokenConfig.abi,
                functionName: "getCurrentVotes",
                args: [address],
              },
              {
                address: CHAIN_CONFIG.addresses.nounsDaoProxy,
                abi: nounsDaoLogicConfig.abi,
                functionName: "proposalThreshold",
                args: [],
              },
            ],
            allowFailure: false,
          },
        );

        if (currentVotes < proposalThreshold) {
          throw new CustomTransactionValidationError(
            "INSUFFICIENT_VOTES",
            `You need at least ${proposalThreshold} votes to create a proposal. You currently have ${currentVotes} votes.`,
          );
        }

        // Filter ABI to remove the 6-parameter propose function and keep only the 5-parameter one
        const filteredAbi = nounsDoaLogicAbi.filter(
          (item) => 
            !(item.type === 'function' && 
              item.name === 'propose' && 
              item.inputs &&
              Array.isArray(item.inputs) &&
              item.inputs.length === 6)
        );

        // Encode the propose function call (5 parameters only)
        data = encodeFunctionData({
          abi: filteredAbi,
          functionName: "propose",
          args: [targets, values, signatures, calldatas, description],
        });
      } else {
        if (proposerSignatures.length === 0 && mode === "signatures") {
          throw new CustomTransactionValidationError(
            "INSUFFICIENT_VOTES",
            "No signatures available. Add signatures or use your own voting power to promote.",
          );
        }
        // With signatures, validate combined votes meet threshold
        const [proposerVotes, proposalThreshold] = await multicall(
          CHAIN_CONFIG.publicClient,
          {
            contracts: [
              {
                address: CHAIN_CONFIG.addresses.nounsToken,
                abi: nounsNftTokenConfig.abi,
                functionName: "getCurrentVotes",
                args: [address],
              },
              {
                address: CHAIN_CONFIG.addresses.nounsDaoProxy,
                abi: nounsDaoLogicConfig.abi,
                functionName: "proposalThreshold",
                args: [],
              },
            ],
            allowFailure: false,
          },
        );

        // Fetch voting power for all signers
        const signerAddresses = proposerSignatures
          .map(sig => sig.signer.toLowerCase())
          .filter((signer) => signer !== address.toLowerCase());
        const signerVoteContracts = signerAddresses.map(signer => ({
          address: CHAIN_CONFIG.addresses.nounsToken,
          abi: nounsNftTokenConfig.abi,
          functionName: "getCurrentVotes" as const,
          args: [getAddress(signer)] as const,
        }));

        let totalSignerVotes = 0n;
        if (signerVoteContracts.length > 0) {
          const signerVotes = await multicall(CHAIN_CONFIG.publicClient, {
            contracts: signerVoteContracts,
            allowFailure: false,
          });

          totalSignerVotes = signerVotes.reduce(
            (sum, votes) => sum + votes,
            0n
          );
        }

        const combinedVotes = proposerVotes + totalSignerVotes;

        if (combinedVotes < proposalThreshold) {
          throw new CustomTransactionValidationError(
            "INSUFFICIENT_VOTES",
            `Combined votes (${combinedVotes}) are below the threshold (${proposalThreshold}). ${proposalThreshold - combinedVotes} more votes needed.`,
          );
        }

        // Encode the proposeBySigs function call (with signatures)
        data = encodeFunctionData({
          abi: nounsDaoLogicConfig.abi,
          functionName: "proposeBySigs",
          args: [
            proposerSignatures,
            targets,
            values,
            signatures,
            calldatas,
            description
          ],
        });
      }

      const request = {
        to: CHAIN_CONFIG.addresses.nounsDaoProxy,
        data,
        value: BigInt(0),
        gasFallback: BigInt(500000), // Promotion can be gas-intensive
      };

      return sendTransaction(
        request,
        {
          type: "promote-candidate" as any,
          description: `Promote candidate to proposal: ${content.title}`,
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
              "Only the proposer can promote this candidate.",
            );
          }
          
          // Check if proposer has an active proposal
          try {
            const latestProposalId = await CHAIN_CONFIG.publicClient.readContract({
              address: CHAIN_CONFIG.addresses.nounsDaoProxy,
              abi: nounsDaoLogicConfig.abi,
              functionName: "latestProposalIds",
              args: [address],
            });

            if (latestProposalId && latestProposalId > 0n) {
              const proposalState = await CHAIN_CONFIG.publicClient.readContract({
                address: CHAIN_CONFIG.addresses.nounsDaoProxy,
                abi: nounsDaoLogicConfig.abi,
                functionName: "state",
                args: [latestProposalId],
              });

              // State 0 = Pending, 1 = Active, 2 = Canceled, 3 = Defeated, 4 = Succeeded, 5 = Queued, 6 = Expired, 7 = Executed
              if (proposalState === 0 || proposalState === 1) {
                return new CustomTransactionValidationError(
                  "ACTIVE_PROPOSAL_EXISTS",
                  "You already have an active proposal. Wait for it to complete before promoting a new candidate.",
                );
              }
            }
          } catch (e) {
            // Ignore errors checking for active proposals in validation
            console.warn("Failed to check for active proposals:", e);
          }

          // Recalculate valid signatures for validation
          const timestamp = Math.floor(Date.now() / 1000);
          const sponsors = candidate.latestVersion.contentSignatures || candidate.sponsors || [];
          const validSponsors = sponsors.filter(
            s => !s.canceled && s.expirationTimestamp > timestamp
          );
          
          // If no signatures or token path, validate threshold requirement
          if (!useSignaturePath || validSponsors.length === 0) {
            try {
              const [currentVotes, proposalThreshold] = await multicall(
                CHAIN_CONFIG.publicClient,
                {
                  contracts: [
                    {
                      address: CHAIN_CONFIG.addresses.nounsToken,
                      abi: nounsNftTokenConfig.abi,
                      functionName: "getCurrentVotes",
                      args: [address],
                    },
                    {
                      address: CHAIN_CONFIG.addresses.nounsDaoProxy,
                      abi: nounsDaoLogicConfig.abi,
                      functionName: "proposalThreshold",
                      args: [],
                    },
                  ],
                  allowFailure: false,
                },
              );

              if (currentVotes < proposalThreshold) {
                return new CustomTransactionValidationError(
                  "INSUFFICIENT_VOTES",
                  `You need at least ${proposalThreshold} votes to create a proposal. You currently have ${currentVotes} votes.`,
                );
              }
            } catch (e) {
              // Ignore errors checking threshold in validation
              console.warn("Failed to check proposal threshold:", e);
            }
            } else {
            // With signatures, validate combined votes
            try {
              const [proposerVotes, proposalThreshold] = await multicall(
                CHAIN_CONFIG.publicClient,
                {
                  contracts: [
                    {
                      address: CHAIN_CONFIG.addresses.nounsToken,
                      abi: nounsNftTokenConfig.abi,
                      functionName: "getCurrentVotes",
                      args: [address],
                    },
                    {
                      address: CHAIN_CONFIG.addresses.nounsDaoProxy,
                      abi: nounsDaoLogicConfig.abi,
                      functionName: "proposalThreshold",
                      args: [],
                    },
                  ],
                  allowFailure: false,
                },
              );

              // Fetch voting power for all signers
              const signerAddresses = proposerSignatures
                .map(sig => sig.signer.toLowerCase())
                .filter((signer) => signer !== address.toLowerCase());
              const signerVoteContracts = signerAddresses.map(signer => ({
                address: CHAIN_CONFIG.addresses.nounsToken,
                abi: nounsNftTokenConfig.abi,
                functionName: "getCurrentVotes" as const,
                args: [getAddress(signer)] as const,
              }));

              let totalSignerVotes = 0n;
              if (signerVoteContracts.length > 0) {
                const signerVotes = await multicall(CHAIN_CONFIG.publicClient, {
                  contracts: signerVoteContracts,
                  allowFailure: false,
                });

                totalSignerVotes = signerVotes.reduce(
                  (sum, votes) => sum + votes,
                  0n
                );
              }

              const combinedVotes = proposerVotes + totalSignerVotes;

              if (combinedVotes < proposalThreshold) {
                return new CustomTransactionValidationError(
                  "INSUFFICIENT_VOTES",
                  `Combined votes (${combinedVotes}) are below the threshold (${proposalThreshold}). ${proposalThreshold - combinedVotes} more votes needed.`,
                );
              }
            } catch (e) {
              // Ignore errors checking combined votes in validation
              console.warn("Failed to check combined votes:", e);
            }
          }
          
          return null;
        },
      );
    },
    [sendTransaction, address],
  );

  return { promoteCandidate, ...other };
}

