import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import { multicall } from "viem/actions";
import { CHAIN_CONFIG } from "@/config";
import {
  useReadNounsNftTokenGetCurrentVotes,
  nounsNftTokenAbi,
  nounsNftTokenAddress,
  nounsDaoLogicConfig,
} from "@/data/generated/wagmi";
import { useReadContract } from "wagmi";
import { ProposalIdea } from "@/data/goldsky/governance/ideaTypes";
import { getAddress } from "viem";
import { useEffect, useState } from "react";

interface CanPromoteResult {
  canPromote: boolean;
  reason?: string;
  isLoading: boolean;
}

/**
 * Hook to check if a user can promote a candidate to a proposal
 * Checks:
 * 1. If proposer has an active proposal (can't promote if they do)
 * 2. If threshold is met (proposer alone OR proposer + sponsors combined)
 */
export function useCanPromoteCandidate(idea: ProposalIdea | undefined): CanPromoteResult {
  const { address } = useAccount();
  const chainId = useChainId();
  const [forceResolve, setForceResolve] = useState(false);

  // Timeout fallback: if loading for more than 5 seconds, force resolve
  useEffect(() => {
    if (!idea) {
      setForceResolve(false);
      return;
    }
    
    setForceResolve(false); // Reset when idea changes
    
    const timer = setTimeout(() => {
      console.warn('[useCanPromoteCandidate] Loading timeout - forcing resolve');
      setForceResolve(true);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [idea]);

  // Check if proposer has an active proposal
  const {
    data: latestProposalId,
    isLoading: isLoadingProposal
  } = useReadContract({
    address: CHAIN_CONFIG.addresses.nounsDaoProxy,
    abi: nounsDaoLogicConfig.abi,
    functionName: "latestProposalIds",
    args: idea?.proposerAddress ? [getAddress(idea.proposerAddress)] : undefined,
    query: {
      enabled: !!idea?.proposerAddress,
    },
  });

  const {
    data: proposalState,
    isLoading: isLoadingState
  } = useReadContract({
    address: CHAIN_CONFIG.addresses.nounsDaoProxy,
    abi: nounsDaoLogicConfig.abi,
    functionName: "state",
    args: latestProposalId && latestProposalId > 0n ? [latestProposalId] : undefined,
    query: {
      enabled: !!latestProposalId && latestProposalId > 0n,
    },
  });

  // Check proposer voting power and threshold
  const {
    data: proposerVoteWeight,
    isLoading: isLoadingProposerVotes
  } = useReadNounsNftTokenGetCurrentVotes({
    args: idea?.proposerAddress ? [getAddress(idea.proposerAddress)] : undefined,
    query: {
      enabled: !!idea?.proposerAddress,
    },
  });

  const {
    data: proposalThreshold,
    isLoading: isLoadingThreshold,
    error: proposalThresholdError,
  } = useReadContract({
    address: CHAIN_CONFIG.addresses.nounsDaoProxy,
    abi: nounsDaoLogicConfig.abi,
    functionName: "proposalThreshold",
    query: {
      enabled: true, // Always enabled - threshold doesn't depend on idea
    },
  });

  // Debug logging for proposal threshold fetch
  useEffect(() => {
    if (proposalThresholdError) {
      console.error('[useCanPromoteCandidate] Failed to fetch proposalThreshold:', proposalThresholdError);
      console.error('[useCanPromoteCandidate] Proxy address:', CHAIN_CONFIG.addresses.nounsDaoProxy);
      console.error('[useCanPromoteCandidate] Chain ID:', chainId);
    }
    if (proposalThreshold !== undefined) {
      console.log('[useCanPromoteCandidate] proposalThreshold fetched:', proposalThreshold?.toString());
    }
  }, [proposalThreshold, proposalThresholdError, chainId]);

  // Check if there are valid sponsors (signatures) - if not, we can skip the query
  const timestamp = Math.floor(Date.now() / 1000);
  const sponsors = idea?.latestVersion.contentSignatures || idea?.sponsors || [];
  const validSponsors = sponsors.filter(
    s => !s.canceled && s.expirationTimestamp > timestamp
  );
  const normalizedProposer = idea?.proposerAddress
    ? getAddress(idea.proposerAddress).toLowerCase()
    : undefined;
  const uniqueSignerAddresses = Array.from(
    new Set(validSponsors.map((s) => getAddress(s.signer.id).toLowerCase()))
  );
  const signerAddressesExcludingProposer = uniqueSignerAddresses.filter(
    (addr) => addr !== normalizedProposer
  );
  const hasSignatures = uniqueSignerAddresses.length > 0;

  // Calculate combined votes (proposer + sponsors)
  // Convert BigInt values to strings for queryKey serialization
  const proposerVoteWeightStr = proposerVoteWeight?.toString();
  const proposalThresholdStr = proposalThreshold?.toString();
  
  // Only enable query if we have signatures (need to fetch signer votes)
  // Use explicit undefined checks to handle 0 values correctly
  const isCombinedVotesQueryEnabled = !!idea && 
    proposerVoteWeight !== undefined && 
    proposalThreshold !== undefined && 
    hasSignatures;
  
  const { data: combinedVotesData, isLoading: isLoadingCombined, isError: isCombinedVotesError } = useQuery({
    queryKey: ["canPromoteCandidate", idea?.id, proposerVoteWeightStr, proposalThresholdStr, signerAddressesExcludingProposer.join(",")],
    queryFn: async () => {
      // Use explicit undefined checks to handle 0 values correctly
      if (!idea || proposerVoteWeight === undefined || proposalThreshold === undefined || !hasSignatures) {
        return { combinedVotes: 0, hasSignatures: false };
      }

      // Calculate combined votes from all signers (exclude proposer to avoid double counting)
      const signerAddresses = signerAddressesExcludingProposer;

      if (signerAddresses.length === 0) {
        return {
          combinedVotes: Number(proposerVoteWeight),
          hasSignatures: true,
        };
      }

      // Fetch voting power for all signers
      const currentTokenAddress = nounsNftTokenAddress[chainId as keyof typeof nounsNftTokenAddress];
      const contracts = signerAddresses.map(signer => ({
        address: currentTokenAddress,
        abi: nounsNftTokenAbi,
        functionName: "getCurrentVotes" as const,
        args: [signer] as const,
      }));

      const signerVotes = await multicall(CHAIN_CONFIG.publicClient, {
        contracts,
        allowFailure: false,
      });

      const totalSignerVotes = signerVotes.reduce(
        (sum: number, votes: bigint) => sum + Number(votes),
        0
      );

      return {
        combinedVotes: Number(proposerVoteWeight) + totalSignerVotes,
        hasSignatures: true,
      };
    },
    enabled: isCombinedVotesQueryEnabled,
    retry: 1,
    staleTime: 30_000, // 30 seconds
  });

  // Simplified loading check: only wait for critical data (proposerVoteWeight and proposalThreshold)
  // Proposal state check is optional - we can proceed without it if timeout occurs
  const hasProposalId = latestProposalId !== undefined; // includes 0n
  const hasProposalState = proposalState !== undefined;
  const hasProposerVotes = proposerVoteWeight !== undefined;
  const hasThreshold = proposalThreshold !== undefined;
  
  // Critical queries: proposer votes and threshold (required for promotion check)
  const needsProposerVotes = !!idea?.proposerAddress;
  const needsThreshold = !!idea;
  const isProposerVotesLoading = needsProposerVotes && !hasProposerVotes && isLoadingProposerVotes && !forceResolve;
  const isThresholdLoading = needsThreshold && !hasThreshold && isLoadingThreshold && !forceResolve;
  
  // Optional queries: proposal state (can proceed without if timeout)
  const needsProposalCheck = !!idea?.proposerAddress;
  const needsStateCheck = !!latestProposalId && latestProposalId > 0n;
  const isProposalQueryLoading = needsProposalCheck && !hasProposalId && isLoadingProposal && !forceResolve;
  const isStateQueryLoading = needsStateCheck && !hasProposalState && isLoadingState && !forceResolve;
  
  // Combined votes query (only if we have signatures)
  const isCombinedLoading = isCombinedVotesQueryEnabled && combinedVotesData === undefined && isLoadingCombined && !forceResolve;
  
  // Only consider loading if critical queries are still loading
  // Optional queries can timeout without blocking
  const isLoading = isProposerVotesLoading || isThresholdLoading || isCombinedLoading;
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[useCanPromoteCandidate] Loading check:', {
      idea: !!idea,
      proposerAddress: idea?.proposerAddress,
      latestProposalId: latestProposalId?.toString(),
      proposalState,
      proposerVoteWeight: proposerVoteWeight?.toString(),
      proposalThreshold: proposalThreshold?.toString(),
      combinedVotesData,
      isLoadingCombined,
      isCombinedVotesQueryEnabled,
      hasSignatures,
      forceResolve,
      isLoading,
      breakdown: {
        isProposalQueryLoading,
        isStateQueryLoading,
        isProposerVotesLoading,
        isThresholdLoading,
        isCombinedLoading,
      },
    });
  }

  if (!idea) {
    return { canPromote: false, isLoading: true };
  }

  // If timeout triggered, force resolve even if still loading
  if (forceResolve && isLoading) {
    console.warn('[useCanPromoteCandidate] Timeout reached - resolving with available data');
    // Fall through to check what we have
  } else if (isLoading && !forceResolve) {
    // If still loading critical data, return loading state
    console.log('[useCanPromoteCandidate] Still loading critical data - returning loading state');
    return { canPromote: false, isLoading: true };
  }

  // Check if proposer has an active proposal
  // State 0 = Pending, 1 = Active, 2 = Canceled, 3 = Defeated, 4 = Succeeded, 5 = Queued, 6 = Expired, 7 = Executed
  // Only check if we have the data (latestProposalId > 0 means query ran, proposalState !== undefined means it completed)
  if (latestProposalId && latestProposalId > 0n && proposalState !== undefined) {
    if (proposalState === 0 || proposalState === 1) {
      return {
        canPromote: false,
        reason: "Your votes are already allocated to an active proposal. Wait for it to complete (queued or defeated) before promoting a new candidate.",
        isLoading: false,
      };
    }
  }

  // Check threshold - if critical data is missing after timeout, show error
  // Otherwise, if still loading, return loading state
  // Note: Use explicit undefined checks instead of falsy checks to handle 0 values correctly
  if (proposerVoteWeight === undefined && !!idea?.proposerAddress) {
    if (forceResolve) {
      return {
        canPromote: false,
        reason: "Unable to verify proposer voting power. Please try refreshing the page.",
        isLoading: false,
      };
    }
    return { canPromote: false, isLoading: true };
  }
  if (proposalThreshold === undefined && !!idea) {
    if (forceResolve) {
      return {
        canPromote: false,
        reason: "Unable to verify proposal threshold. Please try refreshing the page.",
        isLoading: false,
      };
    }
    return { canPromote: false, isLoading: true };
  }
  
  // If we don't have the required data but queries aren't loading and timeout occurred, show error
  if ((proposerVoteWeight === undefined || proposalThreshold === undefined) && forceResolve) {
    return {
      canPromote: false,
      reason: "Unable to verify voting power. Please try refreshing the page.",
      isLoading: false,
    };
  }
  
  // Validate threshold value - treat 0 as invalid and block promotion gracefully
  if (proposalThreshold !== undefined && proposalThreshold <= 0n) {
    return {
      canPromote: false,
      reason: "Unable to load a valid proposal threshold. Please refresh or try again later.",
      isLoading: false,
    };
  }

  const proposerVotes = Number(proposerVoteWeight);
  const threshold = Number(proposalThreshold);

  // If no signatures, check proposer votes only (no need to wait for query)
  if (!hasSignatures) {
    if (proposerVotes < threshold) {
      return {
        canPromote: false,
        reason: `You don't have enough votes to promote this candidate yourself. You need ${threshold} votes but only have ${proposerVotes}. Get more signatures from other voters to meet the threshold.`,
        isLoading: false,
      };
    }
    // Proposer meets threshold alone, can promote
    return { canPromote: true, isLoading: false };
  }

  // If we have signatures, we need to wait for the combined votes query
  if (isCombinedVotesQueryEnabled && isLoadingCombined) {
    return { canPromote: false, isLoading: true };
  }

  // If query failed, fallback to checking proposer votes only
  if (isCombinedVotesQueryEnabled && isCombinedVotesError) {
    if (proposerVotes < threshold) {
      return {
        canPromote: false,
        reason: `You don't have enough votes to promote this candidate yourself. You need ${threshold} votes but only have ${proposerVotes}. Get more signatures from other voters to meet the threshold.`,
        isLoading: false,
      };
    }
    // If proposer meets threshold alone, can promote (even if query failed)
    return { canPromote: true, isLoading: false };
  }

  // If we don't have combined votes data but query should have completed, return loading
  if (isCombinedVotesQueryEnabled && !combinedVotesData) {
    return { canPromote: false, isLoading: true };
  }

  // We should have combined votes data at this point
  if (!combinedVotesData) {
    return { canPromote: false, isLoading: true };
  }

  const combinedVotes = combinedVotesData.combinedVotes;

  // With signatures, combined votes must meet threshold
  if (combinedVotes < threshold) {
    const votesNeeded = threshold - combinedVotes;
    return {
      canPromote: false,
      reason: `Not enough signatures yet. Combined votes (${combinedVotes}) are below the threshold (${threshold}). ${votesNeeded} more votes needed from additional signers.`,
      isLoading: false,
    };
  }

  // Verify user is the proposer
  if (address?.toLowerCase() !== idea.proposerAddress.toLowerCase()) {
    return {
      canPromote: false,
      reason: "Only the proposer can promote this candidate.",
      isLoading: false,
    };
  }

  // Check if candidate is canceled or already promoted
  if (idea.canceledTimestamp) {
    return {
      canPromote: false,
      reason: "This candidate has been canceled.",
      isLoading: false,
    };
  }

  if (idea.latestVersion.proposalId) {
    return {
      canPromote: false,
      reason: "This candidate has already been promoted to a proposal.",
      isLoading: false,
    };
  }

  return { canPromote: true, isLoading: false };
}

