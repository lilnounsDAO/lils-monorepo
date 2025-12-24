import { ProposalState } from "@/utils/types";

interface ProposalForStateCalculation {
  status: string;
  startBlock: string;
  endBlock: string;
  forVotes: string;
  againstVotes: string;
  quorumVotes: string;
  executionETA?: string;
  updatePeriodEndBlock?: string;
  objectionPeriodEndBlock?: string;
}

export const getProposalState = (
  blockNumber: number | undefined,
  blockTimestamp: Date | undefined,
  proposal: ProposalForStateCalculation,
): ProposalState => {
  // If we have block number, calculate state accurately (don't trust Goldsky's potentially stale status)
  if (blockNumber) {
    const currentBlock = blockNumber;
    const startBlock = parseInt(proposal.startBlock);
    const endBlock = parseInt(proposal.endBlock);

    // First check terminal states from Goldsky (these are reliable)
    switch (proposal.status.toUpperCase()) {
      case 'CANCELLED':
        return ProposalState.Cancelled;
      case 'VETOED':
        return ProposalState.Vetoed;
      case 'EXECUTED':
        return ProposalState.Executed;
      case 'QUEUED':
        // Check if queued proposal has expired
        if (blockTimestamp && proposal.executionETA) {
          const GRACE_PERIOD = 14 * 60 * 60 * 24; // 14 days in seconds
          const currentTimestamp = blockTimestamp.getTime() / 1000;
          const executionETA = parseInt(proposal.executionETA);

          if (currentTimestamp >= executionETA + GRACE_PERIOD) {
            return ProposalState.Defeated; // Expired
          }
        }
        return ProposalState.Queued;
    }

    // Check if proposal is in updatable period (before startBlock)
    // This must be checked before PENDING check
    if (proposal.updatePeriodEndBlock) {
      const updatePeriodEndBlock = parseInt(proposal.updatePeriodEndBlock);
      if (currentBlock <= updatePeriodEndBlock) {
        return ProposalState.Updatable;
      }
    }

    // Calculate PENDING/ACTIVE/SUCCEEDED/DEFEATED based on current block (don't trust status)
    if (currentBlock < startBlock) {
      return ProposalState.Pending;
    }

    if (currentBlock <= endBlock) {
      return ProposalState.Active;
    }

    // Check if proposal is in objection period (after voting ends)
    if (proposal.objectionPeriodEndBlock) {
      const objectionPeriodEndBlock = parseInt(proposal.objectionPeriodEndBlock);
      if (objectionPeriodEndBlock > 0 && currentBlock <= objectionPeriodEndBlock) {
        return ProposalState.ObjectionPeriod;
      }
    }

    // Voting has ended - determine success/failure
    const forVotes = BigInt(proposal.forVotes);
    const againstVotes = BigInt(proposal.againstVotes);
    const quorumVotes = BigInt(proposal.quorumVotes);

    const hasQuorum = forVotes >= quorumVotes;
    const hasMoreForVotes = forVotes > againstVotes;

    if (hasQuorum && hasMoreForVotes) {
      return ProposalState.Succeeded;
    } else {
      return ProposalState.Defeated;
    }
  }

  // Fallback: No block number available, trust Goldsky's status
  // Handle explicit terminal states from subgraph
  switch (proposal.status.toUpperCase()) {
    case 'CANCELLED':
      return ProposalState.Cancelled;
    case 'VETOED':
      return ProposalState.Vetoed;
    case 'EXECUTED':
      return ProposalState.Executed;
    case 'QUEUED':
      return ProposalState.Queued;
    case 'ACTIVE':
      return ProposalState.Active;
    case 'PENDING':
      return ProposalState.Pending;
    case 'UPDATABLE':
      return ProposalState.Updatable;
    case 'OBJECTION_PERIOD':
      return ProposalState.ObjectionPeriod;
    default:
      // Unknown status, assume pending
      return ProposalState.Pending;
  }
};