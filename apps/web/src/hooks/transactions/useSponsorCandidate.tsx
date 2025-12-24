"use client";
import { useCallback } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { encodeFunctionData, Hex, getAddress, keccak256, encodePacked, encodeAbiParameters, parseAbiParameters } from "viem";
import { CHAIN_CONFIG } from "@/config";
import { nounsDaoDataAbi } from "@/abis/nounsDaoData";
import { nounsDaoLogicConfig } from "@/data/generated/wagmi";
import {
  UseSendTransactionReturnType,
  useSendTransaction,
} from "./useSendTransaction";
import { CustomTransactionValidationError } from "./types";
import { ProposalIdea } from "@/data/goldsky/governance/ideaTypes";

interface UseSponsorCandidateReturnType
  extends Omit<UseSendTransactionReturnType, "sendTransaction"> {
  sponsorCandidate: (
    candidate: ProposalIdea,
    expirationTimestamp: number,
    reason?: string,
  ) => Promise<void>;
}

// EIP-712 domain separator for Nouns DAO
const DOMAIN_TYPEHASH = keccak256(
  new TextEncoder().encode(
    "EIP712Domain(string name,uint256 chainId,address verifyingContract)"
  )
);

const PROPOSAL_TYPEHASH = keccak256(
  new TextEncoder().encode(
    "Proposal(address proposer,address[] targets,uint256[] values,string[] signatures,bytes[] calldatas,string description,uint256 expiry)"
  )
);

const UPDATE_PROPOSAL_TYPEHASH = keccak256(
  new TextEncoder().encode(
    "UpdateProposal(uint256 proposalId,address proposer,address[] targets,uint256[] values,string[] signatures,bytes[] calldatas,string description,uint256 expiry)"
  )
);

/**
 * Calculate proposal encode data (matches NounsDAOProposals.calcProposalEncodeData)
 */
function calcProposalEncodeData(
  proposer: string,
  targets: string[],
  values: string[],
  signatures: string[],
  calldatas: string[],
  description: string
): Hex {
  // Hash each signature string
  const signatureHashes = signatures.map(sig => keccak256(new TextEncoder().encode(sig)));
  
  // Hash each calldata bytes
  const calldatasHashes = calldatas.map(calldata => {
    // Ensure calldata is a valid hex string
    const calldataHex = calldata.startsWith('0x') ? calldata as Hex : `0x${calldata}` as Hex;
    return keccak256(calldataHex);
  });

  // Encode exactly as the contract does:
  // abi.encode(proposer, keccak256(abi.encodePacked(targets)), keccak256(abi.encodePacked(values)), 
  //            keccak256(abi.encodePacked(signatureHashes)), keccak256(abi.encodePacked(calldatasHashes)), 
  //            keccak256(bytes(description)))
  return encodeAbiParameters(
    parseAbiParameters("address, bytes32, bytes32, bytes32, bytes32, bytes32"),
    [
      getAddress(proposer),
      keccak256(encodePacked(["address[]"], [targets.map(t => getAddress(t))])),
      keccak256(encodePacked(["uint256[]"], [values.map(v => BigInt(v))])),
      keccak256(encodePacked(["bytes32[]"], [signatureHashes])),
      keccak256(encodePacked(["bytes32[]"], [calldatasHashes])),
      keccak256(new TextEncoder().encode(description)),
    ]
  ) as Hex;
}

/**
 * Calculate signature digest (matches NounsDAOProposals.sigDigest)
 */
function calcSigDigest(
  typeHash: Hex,
  encodedProp: Hex,
  expirationTimestamp: bigint,
  verifyingContract: string
): Hex {
  const domainName = keccak256(new TextEncoder().encode("Nouns DAO"));
  const domainSeparator = keccak256(
    encodeAbiParameters(
      parseAbiParameters("bytes32, bytes32, uint256, address"),
      [DOMAIN_TYPEHASH, domainName, BigInt(CHAIN_CONFIG.chain.id), getAddress(verifyingContract)]
    )
  );

  const structHash = keccak256(
    encodePacked(["bytes32", "bytes", "uint256"], [typeHash, encodedProp, expirationTimestamp])
  );

  return keccak256(
    encodePacked(["bytes2", "bytes32", "bytes32"], ["0x1901", domainSeparator, structHash])
  );
}

export function useSponsorCandidate(): UseSponsorCandidateReturnType {
  const { sendTransaction, ...other } = useSendTransaction();
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const sponsorCandidate = useCallback(
    async (
      candidate: ProposalIdea,
      expirationTimestamp: number,
      reason: string = "",
    ) => {
      if (!address) {
        throw new CustomTransactionValidationError(
          "NOT_CONNECTED",
          "Wallet not connected.",
        );
      }

      // Check if signer has an active proposal (can't sign if they do)
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
              "You already have an active proposal. Wait for it to complete before signing another candidate.",
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

      const proposerAddress = candidate.proposerAddress;
      const slug = candidate.slug;
      const proposalIdToUpdate = candidate.latestVersion.targetProposalId || 0;

      // Get the latest version content
      const content = candidate.latestVersion.content;
      const targets = content.targets.map(t => getAddress(t));
      const values = content.values.map(v => BigInt(v));
      const signatures = content.signatures;
      const calldatas = content.calldatas.map(c => c as Hex);
      // Use the description exactly as stored on-chain (already includes title)
      const description = content.description;

      // Calculate encoded proposal data
      const encodedProp = calcProposalEncodeData(
        proposerAddress,
        content.targets,
        content.values,
        signatures,
        calldatas,
        description
      );

      // Sign the digest using EIP-712
      const isUpdate = proposalIdToUpdate !== 0;
      const signature = await signTypedDataAsync({
        domain: {
          name: "Nouns DAO",
          chainId: CHAIN_CONFIG.chain.id,
          verifyingContract: CHAIN_CONFIG.addresses.nounsDaoProxy,
        },
        types: isUpdate ? {
          UpdateProposal: [
            { name: "proposalId", type: "uint256" },
            { name: "proposer", type: "address" },
            { name: "targets", type: "address[]" },
            { name: "values", type: "uint256[]" },
            { name: "signatures", type: "string[]" },
            { name: "calldatas", type: "bytes[]" },
            { name: "description", type: "string" },
            { name: "expiry", type: "uint256" },
          ],
        } : {
          Proposal: [
            { name: "proposer", type: "address" },
            { name: "targets", type: "address[]" },
            { name: "values", type: "uint256[]" },
            { name: "signatures", type: "string[]" },
            { name: "calldatas", type: "bytes[]" },
            { name: "description", type: "string" },
            { name: "expiry", type: "uint256" },
          ],
        },
        primaryType: isUpdate ? "UpdateProposal" : "Proposal",
        message: isUpdate ? {
          proposalId: BigInt(proposalIdToUpdate),
          proposer: proposerAddress,
          targets,
          values,
          signatures,
          calldatas,
          description,
          expiry: BigInt(expirationTimestamp),
        } : {
          proposer: proposerAddress,
          targets,
          values,
          signatures,
          calldatas,
          description,
          expiry: BigInt(expirationTimestamp),
        },
      });

      // Encode the addSignature function call
      const data = encodeFunctionData({
        abi: nounsDaoDataAbi,
        functionName: "addSignature",
        args: [
          signature as Hex,
          BigInt(expirationTimestamp),
          proposerAddress,
          slug,
          BigInt(proposalIdToUpdate),
          encodedProp,
          reason,
        ],
      });

      const request = {
        to: CHAIN_CONFIG.addresses.nounsDAODataProxy,
        data,
        value: BigInt(0),
        gasFallback: BigInt(200000), // Signature submission is relatively cheap
      };

      return sendTransaction(
        request,
        {
          type: "sponsor-candidate" as any,
          description: `Sponsor candidate: ${content.title}`,
        },
        async () => {
          if (!address) {
            return new CustomTransactionValidationError(
              "NOT_CONNECTED",
              "Wallet not connected.",
            );
          }

          // Check if signer has an active proposal
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
                  "You already have an active proposal. Wait for it to complete before signing another candidate.",
                );
              }
            }
          } catch (e) {
            // Ignore errors checking for active proposals in validation
            console.warn("Failed to check for active proposals:", e);
          }

          return null;
        },
      );
    },
    [sendTransaction, address, signTypedDataAsync],
  );

  return { sponsorCandidate, ...other };
}

