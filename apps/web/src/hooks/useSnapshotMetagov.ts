"use client";

import { useQuery } from "@tanstack/react-query";
import { ProposalOverview } from "@/data/goldsky/governance/common";
import { getSnapshotProposals, SnapshotProposal, matchSnapshotProposal } from "@/data/snapshot/getSnapshotProposals";
import { determineMetagovState } from "@/data/goldsky/governance/common";

export interface MetagovProposal {
  daoProposal: ProposalOverview;
  snapshotProposal?: SnapshotProposal;
  combinedState: ProposalOverview['state'];
}

export function useSnapshotMetagov(
  daoProposals: ProposalOverview[],
  enabled: boolean = true
) {
  // Fetch Snapshot proposals
  const { data: snapshotProposals = [], isLoading } = useQuery({
    queryKey: ['snapshot-proposals'],
    queryFn: () => getSnapshotProposals('leagueoflils.eth'),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Match Snapshot proposals with Nouns DAO proposals
  const metagovProposals: MetagovProposal[] = daoProposals.map(daoProposal => {
    const snapshotProposal = matchSnapshotProposal(daoProposal, snapshotProposals);
    const combinedState = determineMetagovState(daoProposal.state, snapshotProposal);

    return {
      daoProposal,
      snapshotProposal,
      combinedState,
    };
  });

  return {
    metagovProposals,
    isLoading,
  };
}

