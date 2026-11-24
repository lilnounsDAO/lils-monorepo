import { ProposalState } from "@/utils/types";

interface ProposalForStateCalculation {
  status: string;
  startBlock: string;
  endBlock: string;
  forVotes: string;
  againstVotes: string;
  quorumVotes: string;
  executionETA?: string;
}

// V2 state parser - trusts Goldsky status first, then refines based on RPC block number
// This matches the pattern used in production to avoid misclassifying QUEUED proposals
export const getProposalStateV2 = (
  blockNumber: number | undefined,
  blockTimestamp: Date | undefined,
  proposal: ProposalForStateCalculation,
): ProposalState => {
  // Map Goldsky status string to ProposalState enum
  const goldskyStatus = proposal.status.toUpperCase();
  let status: ProposalState;
  
  // Map Goldsky status to ProposalState enum
  switch (goldskyStatus) {
    case 'CANCELLED':
      return ProposalState.Cancelled;
    case 'VETOED':
      return ProposalState.Vetoed;
    case 'EXECUTED':
      return ProposalState.Executed;
    case 'QUEUED':
      status = ProposalState.Queued;
      break;
    case 'ACTIVE':
      status = ProposalState.Active;
      break;
    case 'PENDING':
      status = ProposalState.Pending;
      break;
    default:
      // Unknown status, assume pending
      status = ProposalState.Pending;
  }

  // Refine status based on RPC block number (trust Goldsky status, but verify with RPC)
  if (!blockNumber) {
    // No block number available - trust Goldsky status
    return status;
  }

  const currentBlock = blockNumber;
  const startBlock = parseInt(proposal.startBlock);
  const endBlock = parseInt(proposal.endBlock);

  // Goldsky often leaves status at PENDING after voting starts and ends.
  // Use the block window for both PENDING and ACTIVE instead of trusting that.
  if (status === ProposalState.Pending || status === ProposalState.Active) {
    if (currentBlock <= startBlock) {
      return ProposalState.Pending;
    }
    if (currentBlock <= endBlock) {
      return ProposalState.Active;
    }

    const forVotes = BigInt(proposal.forVotes);
    const againstVotes = BigInt(proposal.againstVotes);
    const quorumVotes = BigInt(proposal.quorumVotes);

    if (forVotes <= againstVotes || forVotes < quorumVotes) {
      return ProposalState.Defeated;
    }

    if (proposal.executionETA) {
      return ProposalState.Queued;
    }
    return ProposalState.Succeeded;
  }

  // Handle QUEUED status - check if expired
  if (status === ProposalState.Queued) {
    if (!blockTimestamp || !proposal.executionETA) {
      // Can't determine expiration without timestamp/ETA
      return ProposalState.Queued;
    }
    
    const GRACE_PERIOD = 14 * 60 * 60 * 24; // 14 days in seconds
    const currentTimestamp = blockTimestamp.getTime() / 1000;
    const executionETA = parseInt(proposal.executionETA);

    if (currentTimestamp >= executionETA + GRACE_PERIOD) {
      return ProposalState.Defeated; // Expired
    }
    
    // Still queued (waiting in timelock)
    return ProposalState.Queued;
  }

  // Return the status as-is for other states
  return status;
};

