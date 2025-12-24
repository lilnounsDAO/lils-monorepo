"use client";
import { ProposalOverview } from "@/data/goldsky/governance/common";
import { MetagovProposal } from "@/hooks/useSnapshotMetagov";
import { useSearchContext } from "../Search";
import { NoProposals, ProposalOverviewCard } from "./ProposalOverviewCard";

export default function FilteredProposalOverviews({
  type,
  overviews,
  metagovMap,
  isNounsDao = false,
}: {
  type: string;
  overviews: ProposalOverview[];
  metagovMap?: Map<number, MetagovProposal>;
  isNounsDao?: boolean;
}) {
  const { debouncedSearchValue } = useSearchContext();

  const filteredOverviews = overviews.filter((overview) => {
    return (
      overview.title
        .toLowerCase()
        .includes(debouncedSearchValue.toLowerCase()) ||
      overview.proposerAddress
        .toLowerCase()
        .includes(debouncedSearchValue.toLowerCase())
    );
  });

  return (
    <>
      {filteredOverviews.length > 0 ? (
        filteredOverviews.map((p, i) => {
          const metagov = metagovMap?.get(p.id);
          return (
            <ProposalOverviewCard 
              key={i} 
              proposalOverview={p}
              snapshotProposal={metagov?.snapshotProposal}
              combinedState={metagov?.combinedState}
              isNounsDao={isNounsDao}
            />
          );
        })
      ) : (
        <NoProposals
          type={type}
          searchFilterActive={debouncedSearchValue != ""}
        />
      )}
    </>
  );
}
