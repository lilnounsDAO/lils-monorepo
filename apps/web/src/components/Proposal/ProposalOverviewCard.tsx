import { ProposalOverview } from "@/data/goldsky/governance/common";
import { SnapshotProposal } from "@/data/snapshot/getSnapshotProposals";
import { formatTimeLeft } from "@/utils/format";
import clsx from "clsx";
import { truncate } from "lodash";
import { Link } from "react-router-dom";
import Icon from "../ui/Icon";
import { ProposalStateBadge } from "./ProposalStateBadge";
import { MetagovStatusBadge } from "./MetagovStatusBadge";

export function ProposalOverviewCard({
  proposalOverview,
  snapshotProposal,
  combinedState,
  isNounsDao = false,
}: {
  proposalOverview: ProposalOverview;
  snapshotProposal?: SnapshotProposal;
  combinedState?: ProposalOverview['state'];
  isNounsDao?: boolean;
}) {
  const displayState = combinedState || proposalOverview.state;
  const votes = (
    <div className="flex gap-3">
      <span>For: {proposalOverview.forVotes}</span>
      <span>Against: {proposalOverview.againstVotes}</span>
      <span>Abstain: {proposalOverview.abstainVotes}</span>
    </div>
  );

  const nowTimestamp = Math.floor(Date.now() / 1000);
  const startTimeDelta = Math.max(
    proposalOverview.votingStartTimestamp - nowTimestamp,
    0,
  );
  const endTimeDelta = Math.max(
    proposalOverview.votingEndTimestamp - nowTimestamp,
    0,
  );

  const timeToVotingStartFormatted = formatTimeLeft(startTimeDelta, true);
  const timeToVotingEndFormatted = formatTimeLeft(endTimeDelta, true);

  // Determine the correct URL based on whether it's a Nouns DAO proposal
  const voteUrl = isNounsDao ? `/vote/nouns/${proposalOverview.id}` : `/vote/${proposalOverview.id}`;

  return (
    <Link
      to={voteUrl}
      className="flex w-full justify-between rounded-[16px] border p-4 transition-colors hover:bg-background-ternary"
    >
      <div className="flex w-full items-center gap-6">
        <div
          className={clsx(
            "flex h-12 w-12 shrink-0 items-center justify-center self-start rounded-[8px] label-md md:self-auto",
            {
              "bg-background-secondary text-semantic-accent":
                displayState === "active" || displayState === "metagov_active",
              "bg-semantic-positive text-white":
                displayState === "successful" ||
                displayState === "queued" ||
                displayState === "executed",
              "bg-semantic-negative text-white":
                displayState === "failed" ||
                displayState === "cancelled" ||
                displayState === "expired",
              "bg-semantic-warning text-content-primary":
                displayState === "vetoed",
              "bg-background-secondary text-content-secondary":
                displayState === "pending" || displayState === "metagov_pending",
              "bg-yellow-100 text-yellow-800":
                displayState === "metagov_closed",
            },
          )}
        >
          {proposalOverview.id}
        </div>
        <div className="flex h-full w-full min-w-0 flex-col justify-between gap-3">
          <div className="overflow-hidden label-lg md:text-ellipsis md:whitespace-nowrap">
            {truncate(proposalOverview.title, { length: 65 })}
          </div>

          <div className="flex flex-col justify-between gap-3 text-content-secondary label-sm md:flex-row">
            {(displayState === "pending" || displayState === "metagov_pending" || displayState === "updatable") && startTimeDelta > 0 ? (
              <div className="flex items-center gap-1">
                <Icon
                  icon="clock"
                  size={16}
                  className="fill-content-secondary"
                />
                <span>Starts in {timeToVotingStartFormatted}</span>
              </div>
            ) : (displayState === "pending" || displayState === "metagov_pending" || displayState === "updatable") && startTimeDelta <= 0 ? (
              <div className="flex items-center gap-1">
                <Icon
                  icon="clock"
                  size={16}
                  className="fill-content-secondary"
                />
                <span>Starting soon</span>
              </div>
            ) : (
              votes
            )}
            <div className="flex flex-row-reverse justify-end gap-1 md:flex-row md:justify-start">
              {(displayState == "active" || displayState === "metagov_active" || displayState === "metagov_closed") && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="block md:hidden">•</span>
                    <Icon
                      icon="clock"
                      size={16}
                      className="fill-content-secondary"
                    />
                    <span>{timeToVotingEndFormatted} left</span>
                  </div>
                  <span className="hidden md:block">•</span>
                </>
              )}
              {snapshotProposal ? (
                <MetagovStatusBadge state={displayState} label="Lil Nouns" />
              ) : (
                <ProposalStateBadge state={proposalOverview.state} objectionPeriodEndBlock={proposalOverview.objectionPeriodEndBlock} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function NoProposals({
  type,
  searchFilterActive,
}: {
  type: string;
  searchFilterActive: boolean;
}) {
  return (
    <div className="flex h-[85px] w-full items-center justify-center rounded-[16px] border bg-gray-100 p-4 text-center">
      There are no {type} proposals
      {searchFilterActive && " matching the search filter"}.
    </div>
  );
}
