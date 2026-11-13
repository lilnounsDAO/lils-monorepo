"use client";
import { erc721Abi } from "viem";
import { useBlockNumber, useReadContract, useReadContracts } from "wagmi";
import { CHAIN_CONFIG } from "@/config";
import { nounsDoaLogicAbi } from "@/abis/nounsDoaLogic";

export interface DynamicQuorumParams {
  minQuorumVotesBPS: number;
  maxQuorumVotesBPS: number;
  quorumCoefficient: number;
}

/**
 * Mirrors NounsDAOLogicV3.dynamicQuorumVotes (integer math, same rounding):
 * quorum rises with against votes, from min BPS up to max BPS of the adjusted total supply.
 */
export function dynamicQuorumVotes(
  againstVotes: number,
  totalSupply: number,
  params: DynamicQuorumParams,
): number {
  if (totalSupply <= 0) return 0;
  const against = BigInt(againstVotes);
  const supply = BigInt(totalSupply);
  const againstVotesBPS = (BigInt(10000) * against) / supply;
  const quorumAdjustmentBPS =
    (BigInt(params.quorumCoefficient) * againstVotesBPS) / BigInt(1e6);
  const adjustedQuorumBPS =
    BigInt(params.minQuorumVotesBPS) + quorumAdjustmentBPS;
  const maxBPS = BigInt(params.maxQuorumVotesBPS);
  const quorumBPS = adjustedQuorumBPS < maxBPS ? adjustedQuorumBPS : maxBPS;
  return Number((supply * quorumBPS) / BigInt(10000));
}

/** The governor defeats a proposal when for <= against or for < quorum. */
export function isPassing(
  forVotes: number,
  againstVotes: number,
  totalSupply: number,
  params: DynamicQuorumParams,
) {
  return (
    forVotes > againstVotes &&
    forVotes >= dynamicQuorumVotes(againstVotes, totalSupply, params)
  );
}

/** Extra for votes needed to pass, given the current against votes. */
export function forVotesToPass(
  forVotes: number,
  againstVotes: number,
  totalSupply: number,
  params: DynamicQuorumParams,
) {
  const quorum = dynamicQuorumVotes(againstVotes, totalSupply, params);
  return Math.max(0, quorum - forVotes, againstVotes + 1 - forVotes);
}

/** Extra against votes needed to defeat a passing proposal (each one also raises quorum). */
export function againstVotesToDefeat(
  forVotes: number,
  againstVotes: number,
  totalSupply: number,
  params: DynamicQuorumParams,
) {
  if (!isPassing(forVotes, againstVotes, totalSupply, params)) return 0;
  let extra = 1;
  while (
    againstVotes + extra <= totalSupply &&
    isPassing(forVotes, againstVotes + extra, totalSupply, params)
  ) {
    extra++;
  }
  return extra;
}

/** Quorum inputs a proposal created right now would snapshot. */
export function useQuorumSnapshot() {
  const { data: blockNumber } = useBlockNumber({ chainId: CHAIN_CONFIG.chain.id });

  // adjustedTotalSupply() reverts on the Lil Nouns governor (no fork escrow), so compute it the same way:
  // token supply minus what the treasury holds
  const { data: supplyReads, isLoading: loadingSupply } = useReadContracts({
    contracts: [
      {
        address: CHAIN_CONFIG.addresses.nounsToken,
        abi: erc721Abi,
        functionName: "totalSupply",
        chainId: CHAIN_CONFIG.chain.id,
      },
      {
        address: CHAIN_CONFIG.addresses.nounsToken,
        abi: erc721Abi,
        functionName: "balanceOf",
        args: [CHAIN_CONFIG.addresses.nounsTreasury],
        chainId: CHAIN_CONFIG.chain.id,
      },
    ],
    allowFailure: false,
  });
  const totalSupply = supplyReads
    ? supplyReads[0] - supplyReads[1]
    : undefined;

  const { data: params, isLoading: loadingParams } = useReadContract({
    address: CHAIN_CONFIG.addresses.nounsDaoProxy,
    abi: nounsDoaLogicAbi,
    functionName: "getDynamicQuorumParamsAt",
    args: blockNumber !== undefined ? [blockNumber] : undefined,
    chainId: CHAIN_CONFIG.chain.id,
    query: { enabled: blockNumber !== undefined },
  });

  return {
    totalSupply: totalSupply !== undefined ? Number(totalSupply) : undefined,
    params: params
      ? {
          minQuorumVotesBPS: Number(params.minQuorumVotesBPS),
          maxQuorumVotesBPS: Number(params.maxQuorumVotesBPS),
          quorumCoefficient: Number(params.quorumCoefficient),
        }
      : undefined,
    isLoading: loadingSupply || loadingParams || blockNumber === undefined,
  };
}
