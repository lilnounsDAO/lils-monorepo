import { isDAOUpgradedToV6 } from '@/config';

/**
 * Proposal states in V2 (pre-V6 upgrade)
 */
export enum ProposalStateV2 {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
  Vetoed = 8,
}

/**
 * Proposal states in V6 (post-upgrade)
 * Adds: Updatable (9) and ObjectionPeriod (10)
 */
export enum ProposalStateV6 {
  Undetermined = -1,
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
  Vetoed = 8,
  ObjectionPeriod = 9,
  Updatable = 10,
}

/**
 * Returns the human-readable state name for a proposal
 * Works with both V2 and V6 states
 */
export function getProposalStateName(state: number): string {
  // V6-only states
  if (state === ProposalStateV6.Updatable) {
    return 'Updatable';
  }
  if (state === ProposalStateV6.ObjectionPeriod) {
    return 'Objection Period';
  }

  // Common states (V2 and V6)
  switch (state) {
    case ProposalStateV2.Pending:
      return 'Pending';
    case ProposalStateV2.Active:
      return 'Active';
    case ProposalStateV2.Canceled:
      return 'Canceled';
    case ProposalStateV2.Defeated:
      return 'Defeated';
    case ProposalStateV2.Succeeded:
      return 'Succeeded';
    case ProposalStateV2.Queued:
      return 'Queued';
    case ProposalStateV2.Expired:
      return 'Expired';
    case ProposalStateV2.Executed:
      return 'Executed';
    case ProposalStateV2.Vetoed:
      return 'Vetoed';
    default:
      return `Unknown (${state})`;
  }
}

/**
 * Returns true if the proposal state is a V6-only state
 */
export function isV6OnlyState(state: number): boolean {
  return state === ProposalStateV6.Updatable || state === ProposalStateV6.ObjectionPeriod;
}

/**
 * Returns true if the proposal is in a state where it can be edited (V6 only)
 */
export function canEditProposal(state: number): boolean {
  // Only possible in V6 after upgrade
  if (!isDAOUpgradedToV6()) {
    return false;
  }

  return state === ProposalStateV6.Updatable;
}

/**
 * Returns true if the proposal is in objection period (V6 only)
 */
export function isInObjectionPeriod(state: number): boolean {
  // Only possible in V6 after upgrade
  if (!isDAOUpgradedToV6()) {
    return false;
  }

  return state === ProposalStateV6.ObjectionPeriod;
}

/**
 * Returns true if the proposal is in a terminal state (can't change)
 */
export function isTerminalState(state: number): boolean {
  return (
    state === ProposalStateV2.Defeated ||
    state === ProposalStateV2.Expired ||
    state === ProposalStateV2.Executed ||
    state === ProposalStateV2.Vetoed ||
    state === ProposalStateV2.Canceled
  );
}

/**
 * Returns true if the proposal is in a voting state
 */
export function isVotingState(state: number): boolean {
  if (isDAOUpgradedToV6()) {
    return (
      state === ProposalStateV6.Active ||
      state === ProposalStateV6.ObjectionPeriod ||
      state === ProposalStateV6.Updatable
    );
  }

  return state === ProposalStateV2.Active;
}

/**
 * Returns the CSS class for state badge color
 */
export function getStateColorClass(state: number): string {
  // V6-specific states
  if (state === ProposalStateV6.Updatable) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  if (state === ProposalStateV6.ObjectionPeriod) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }

  // Common states
  switch (state) {
    case ProposalStateV2.Active:
      return 'bg-green-100 text-green-800 border-green-200';
    case ProposalStateV2.Succeeded:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case ProposalStateV2.Queued:
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case ProposalStateV2.Executed:
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case ProposalStateV2.Defeated:
    case ProposalStateV2.Canceled:
    case ProposalStateV2.Vetoed:
      return 'bg-red-100 text-red-800 border-red-200';
    case ProposalStateV2.Expired:
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case ProposalStateV2.Pending:
      return 'bg-blue-50 text-blue-600 border-blue-100';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

/**
 * Type guard to check if a proposal state value is valid for the current DAO version
 */
export function isValidProposalState(state: number): boolean {
  if (isDAOUpgradedToV6()) {
    return state >= 0 && state <= 10; // V6 has states 0-10
  }
  return state >= 0 && state <= 8; // V2 has states 0-8
}
