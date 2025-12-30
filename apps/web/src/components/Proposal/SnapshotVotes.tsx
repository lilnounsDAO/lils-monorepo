"use client";

import { useQuery } from "@tanstack/react-query";
import { SnapshotProposal, getSnapshotVotes, SnapshotVote } from "@/data/snapshot/getSnapshotProposals";
import { Check, X, MinusCircle } from "lucide-react";
import clsx from "clsx";

interface SnapshotVotesProps {
  snapshotProposal: SnapshotProposal;
}

export function SnapshotVotes({ snapshotProposal }: SnapshotVotesProps) {
  const { data: votes = [], isLoading } = useQuery({
    queryKey: ['snapshot-votes', snapshotProposal.id],
    queryFn: () => getSnapshotVotes(snapshotProposal.id),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 animate-pulse bg-gray-200 rounded" />
        <div className="h-4 w-48 animate-pulse bg-gray-200 rounded" />
      </div>
    );
  }

  // For leagueoflils.eth Snapshot: 1 = For, 2 = Against, 3 = Abstain
  const forVotes = votes.filter(v => v.choice === 1);
  const againstVotes = votes.filter(v => v.choice === 2);
  const abstainVotes = votes.filter(v => v.choice === 3);

  const totalVp = votes.reduce((sum, v) => sum + v.vp, 0);
  const forVp = forVotes.reduce((sum, v) => sum + v.vp, 0);
  const againstVp = againstVotes.reduce((sum, v) => sum + v.vp, 0);
  const abstainVp = abstainVotes.reduce((sum, v) => sum + v.vp, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Lil Nouns Snapshot Votes</span>
        <span className="text-xs text-content-secondary">({votes.length} voters)</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-green-600" />
            <span>For</span>
          </div>
          <span className="font-medium">{forVotes.length} votes ({forVp.toFixed(2)} VP)</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <X size={16} className="text-red-600" />
            <span>Against</span>
          </div>
          <span className="font-medium">{againstVotes.length} votes ({againstVp.toFixed(2)} VP)</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <MinusCircle size={16} className="text-gray-600" />
            <span>Abstain</span>
          </div>
          <span className="font-medium">{abstainVotes.length} votes ({abstainVp.toFixed(2)} VP)</span>
        </div>
      </div>

      <div className="border-t pt-2">
        <div className="text-xs text-content-secondary">
          Total Voting Power: {totalVp.toFixed(2)} VP
        </div>
      </div>
    </div>
  );
}

