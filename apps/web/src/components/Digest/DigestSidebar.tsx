import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { truncate } from "lodash";
import { getAddress } from "viem";
import { getProposalOverviews } from "@/data/goldsky/governance/getProposalOverviewsVersioned";
import {
  ProposalOverview,
  ProposalState,
} from "@/data/goldsky/governance/common";
import {
  getProposalIdeas,
  makeUrlId,
} from "@/data/goldsky/governance/getProposalIdeas";
import {
  getTopics,
  makeTopicUrlId,
  Topic,
} from "@/data/goldsky/governance/getTopics";
import { getAllVoters } from "@/data/goldsky/governance/getAllVoters";
import { EnsAvatar } from "@/components/EnsAvatar";
import { EnsName } from "@/components/EnsName";
import { formatTimeLeft } from "@/utils/format";
import Icon from "@/components/ui/Icon";
import { ArrowDown, ArrowUp } from "lucide-react";
import { isDaoVersion5 } from "@/utils/daoVersion";
import { RefundBalanceNotice } from "@/components/RefundBalanceNotice";
import { VoteBar } from "@/components/VoteBar";

export type DigestTab =
  | "digest"
  | "proposals"
  | "topics"
  | "candidates"
  | "voters";

const ONGOING_STATES: ProposalState[] = [
  "pending",
  "active",
  "updatable",
  "queued",
];

const DAY = 24 * 60 * 60;

function relative(seconds: number): string {
  return formatTimeLeft(Math.max(0, seconds), true).trim();
}

function longDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

// "Starts in 17 hours", "Ends in 2 days", "Executable in 6 hours",
// "Voting ended 5 hours ago" / "October 24".
function timeLabel(proposal: ProposalOverview): string {
  const now = Math.floor(Date.now() / 1000);
  if (proposal.state === "cancelled") return "Canceled";
  if (proposal.state === "vetoed") return "Vetoed";
  if (proposal.state === "pending" || proposal.state === "updatable") {
    return `Starts in ${relative(proposal.votingStartTimestamp - now)}`;
  }
  // A queued proposal is waiting on the timelock, not on the vote that already
  // finished, so say when it can actually run.
  if (proposal.state === "queued" && proposal.executionEtaTimestamp) {
    const eta = proposal.executionEtaTimestamp;
    return eta > now
      ? `Executable in ${relative(eta - now)}`
      : `Executable since ${longDate(eta)}`;
  }
  if (proposal.votingEndTimestamp > now) {
    return `Ends in ${relative(proposal.votingEndTimestamp - now)}`;
  }
  const ago = now - proposal.votingEndTimestamp;
  return ago < DAY
    ? `Voting ended ${relative(ago)} ago`
    : `Voting ended ${longDate(proposal.votingEndTimestamp)}`;
}

const STATE_BADGE: Partial<
  Record<ProposalState, { label: string; className: string }>
> = {
  pending: {
    label: "Upcoming",
    className: "bg-gray-100 text-content-secondary",
  },
  updatable: {
    label: "Upcoming",
    className: "bg-gray-100 text-content-secondary",
  },
  active: { label: "Ongoing", className: "bg-blue-100 text-blue-700" },
  successful: { label: "Succeeded", className: "bg-green-100 text-green-700" },
  queued: { label: "Queued", className: "bg-green-100 text-green-700" },
  executed: { label: "Executed", className: "bg-green-100 text-green-700" },
  failed: { label: "Defeated", className: "bg-red-100 text-red-700" },
  expired: {
    label: "Expired",
    className: "bg-gray-100 text-content-secondary",
  },
  cancelled: {
    label: "Canceled",
    className: "bg-gray-100 text-content-secondary",
  },
  vetoed: { label: "Vetoed", className: "bg-red-100 text-red-700" },
};

function StateBadge({ state }: { state: ProposalState }) {
  const badge = STATE_BADGE[state] ?? {
    label: state,
    className: "bg-gray-100 text-content-secondary",
  };
  return (
    <span
      className={clsx(
        "rounded-[6px] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        badge.className,
      )}
    >
      {badge.label}
    </span>
  );
}

function VoteChips({ proposal }: { proposal: ProposalOverview }) {
  return (
    <span className="flex items-center gap-px overflow-hidden rounded-[6px] text-xs text-content-secondary">
      <span className="flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5">
        {proposal.forVotes}
        <ArrowUp size={12} strokeWidth={2.5} />/ {proposal.quorumVotes}
      </span>
      <span className="bg-gray-100 px-1.5 py-0.5">{proposal.abstainVotes}</span>
      <span className="flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5">
        {proposal.againstVotes}
        <ArrowDown size={12} strokeWidth={2.5} />
      </span>
    </span>
  );
}

function SidebarProposalRow({ proposal }: { proposal: ProposalOverview }) {
  const upcoming =
    proposal.state === "pending" || proposal.state === "updatable";
  const hasVotes =
    proposal.forVotes + proposal.againstVotes + proposal.abstainVotes > 0;
  return (
    <Link
      to={`/vote/${proposal.id}`}
      className="flex flex-col gap-1.5 rounded-[12px] px-2 py-2.5 transition-colors hover:bg-background-ternary"
    >
      <p className="text-sm text-content-secondary">
        Prop {proposal.id} by{" "}
        <EnsName address={proposal.proposerAddress} className="font-bold" />
      </p>
      <p className="text-base font-bold leading-snug text-content-primary line-clamp-2">
        {proposal.title}
      </p>
      {!upcoming && hasVotes && <VoteBar {...proposal} />}
      <div className="flex flex-wrap items-center gap-2 text-sm text-content-secondary">
        <StateBadge state={proposal.state} />
        {!upcoming && <VoteChips proposal={proposal} />}
        <span>{timeLabel(proposal)}</span>
      </div>
    </Link>
  );
}

function SidebarSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-content-secondary hover:text-content-primary"
          aria-expanded={open}
        >
          <Icon
            icon="chevronDown"
            size={14}
            className={clsx(
              "fill-current transition-transform",
              !open && "-rotate-90",
            )}
          />
          {title}
        </button>
        {action}
      </div>
      {open && <div className="flex flex-col">{children}</div>}
    </section>
  );
}

function EmptyNote({ children }: { children: string }) {
  return (
    <p className="px-2 py-4 text-center text-sm text-content-secondary">
      {children}
    </p>
  );
}

function DigestSummary({
  proposals,
  candidates,
  topics,
}: {
  proposals: ProposalOverview[];
  candidates: ReturnType<typeof activeCandidates>;
  topics: Topic[];
}) {
  const upcoming = proposals.filter(
    (proposal) =>
      proposal.state === "pending" || proposal.state === "updatable",
  );
  const ongoing = proposals.filter(
    (proposal) => proposal.state === "active" || proposal.state === "queued",
  );
  const concluded = proposals
    .filter((proposal) => !ONGOING_STATES.includes(proposal.state))
    .slice(0, 4);
  const recentCandidates = candidates.slice(0, 4);
  const recentTopics = topics
    .filter((topic) => !topic.canceled)
    .sort((a, b) => b.lastUpdatedTimestamp - a.lastUpdatedTimestamp)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <RefundBalanceNotice />
      {ongoing.length > 0 && (
        <SidebarSection title="Ongoing proposals">
          {ongoing.map((proposal) => (
            <SidebarProposalRow key={proposal.id} proposal={proposal} />
          ))}
        </SidebarSection>
      )}

      {upcoming.length > 0 && (
        <SidebarSection title="Upcoming proposals">
          {upcoming.map((proposal) => (
            <SidebarProposalRow key={proposal.id} proposal={proposal} />
          ))}
        </SidebarSection>
      )}

      {ongoing.length === 0 && upcoming.length === 0 && (
        <EmptyNote>No live proposals</EmptyNote>
      )}

      {recentCandidates.length > 0 && (
        <SidebarSection
          title="New candidates"
          action={
            <Link
              to="/candidates"
              className="text-xs text-content-secondary hover:text-content-primary"
            >
              View all
            </Link>
          }
        >
          {recentCandidates.map((candidate) => (
            <Link
              key={candidate.id}
              to={`/candidates/${makeUrlId(candidate.id)}`}
              className="rounded-[12px] p-2 transition-colors hover:bg-background-ternary"
            >
              <p className="text-sm font-medium text-content-primary line-clamp-2">
                {candidate.latestVersion.content.title}
              </p>
              <p className="mt-1 text-xs text-content-secondary">
                {formatTimeLeft(
                  Math.max(
                    0,
                    Math.floor(Date.now() / 1000) -
                      candidate.lastUpdatedTimestamp,
                  ),
                  true,
                ).trim()}
              </p>
            </Link>
          ))}
        </SidebarSection>
      )}

      {recentTopics.length > 0 && (
        <SidebarSection
          title="Topics"
          action={
            <Link
              to="/topics"
              className="text-xs text-content-secondary hover:text-content-primary"
            >
              View all
            </Link>
          }
        >
          {recentTopics.map((topic) => (
            <Link
              key={topic.id}
              to={`/topics/${makeTopicUrlId(topic.id)}`}
              className="rounded-[12px] p-2 transition-colors hover:bg-background-ternary"
            >
              <p className="text-sm font-medium text-content-primary line-clamp-2">
                {topic.title}
              </p>
              <p className="mt-1 text-xs text-content-secondary">
                {topic.feedback.length}{" "}
                {topic.feedback.length === 1 ? "reply" : "replies"}
              </p>
            </Link>
          ))}
        </SidebarSection>
      )}

      <SidebarSection title="Recently concluded proposals">
        {concluded.length > 0 ? (
          concluded.map((proposal) => (
            <SidebarProposalRow key={proposal.id} proposal={proposal} />
          ))
        ) : (
          <EmptyNote>No concluded proposals yet</EmptyNote>
        )}
      </SidebarSection>
    </div>
  );
}

function activeCandidates(
  candidates: Awaited<ReturnType<typeof getProposalIdeas>>,
) {
  const monthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  return candidates.filter(
    (candidate) =>
      !candidate.canceledTimestamp &&
      !candidate.latestVersion.proposalId &&
      !candidate.latestVersion.targetProposalId &&
      candidate.lastUpdatedTimestamp >= monthAgo,
  );
}

export default function DigestSidebar({
  tab,
  onTabChange,
}: {
  tab: DigestTab;
  onTabChange: (tab: DigestTab) => void;
}) {
  const showV5 = isDaoVersion5();
  const tabs: { id: DigestTab; label: string }[] = [
    { id: "digest", label: "Digest" },
    { id: "proposals", label: "Proposals" },
    ...(showV5
      ? [
          { id: "topics" as const, label: "Topics" },
          { id: "candidates" as const, label: "Candidates" },
        ]
      : []),
    { id: "voters", label: "Voters" },
  ];

  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ["digest-proposals"],
    queryFn: () => getProposalOverviews(80, "lilnouns"),
    staleTime: 30_000,
  });

  const { data: candidates = [], isLoading: loadingCandidates } = useQuery({
    queryKey: ["candidates"],
    queryFn: () => getProposalIdeas(80),
    staleTime: 30_000,
    enabled: showV5,
  });

  const { data: topics = [], isLoading: loadingTopics } = useQuery({
    queryKey: ["topics"],
    queryFn: () => getTopics(80),
    staleTime: 30_000,
    enabled: showV5,
  });

  const { data: voters = [], isLoading: loadingVoters } = useQuery({
    queryKey: ["digest-voters"],
    queryFn: () => getAllVoters(200),
    staleTime: 60_000,
    enabled: tab === "voters",
  });

  const newCandidates = activeCandidates(candidates);
  const loading =
    loadingProposals ||
    (showV5 && (loadingCandidates || loadingTopics)) ||
    (tab === "voters" && loadingVoters);

  return (
    <aside className="flex w-full flex-col gap-6 lg:w-[380px] lg:shrink-0">
      <div className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={clsx(
              "-mb-px shrink-0 px-3 py-2 text-sm transition-colors",
              tab === item.id
                ? "border-b-2 border-content-primary font-bold text-content-primary"
                : "border-b-2 border-transparent text-content-secondary hover:text-content-primary",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2 p-2">
              <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : tab === "digest" ? (
        <DigestSummary
          proposals={proposals}
          candidates={newCandidates}
          topics={topics}
        />
      ) : tab === "proposals" ? (
        <div className="flex flex-col gap-1">
          {proposals.length > 0 ? (
            proposals
              .slice(0, 12)
              .map((proposal) => (
                <SidebarProposalRow key={proposal.id} proposal={proposal} />
              ))
          ) : (
            <EmptyNote>No proposals yet</EmptyNote>
          )}
          <Link
            to="/vote"
            className="mt-2 px-2 text-sm text-content-secondary hover:text-content-primary"
          >
            View all proposals
          </Link>
        </div>
      ) : tab === "topics" ? (
        <div className="flex flex-col gap-1">
          {topics.filter((topic) => !topic.canceled).length > 0 ? (
            topics
              .filter((topic) => !topic.canceled)
              .slice(0, 12)
              .map((topic) => (
                <Link
                  key={topic.id}
                  to={`/topics/${makeTopicUrlId(topic.id)}`}
                  className="rounded-[12px] p-2 transition-colors hover:bg-background-ternary"
                >
                  <p className="text-sm font-medium text-content-primary line-clamp-2">
                    {topic.title}
                  </p>
                  <p className="mt-1 text-xs text-content-secondary">
                    {topic.feedback.length}{" "}
                    {topic.feedback.length === 1 ? "reply" : "replies"}
                  </p>
                </Link>
              ))
          ) : (
            <EmptyNote>No topics yet</EmptyNote>
          )}
        </div>
      ) : tab === "candidates" ? (
        <div className="flex flex-col gap-1">
          {newCandidates.length > 0 ? (
            newCandidates.slice(0, 12).map((candidate) => (
              <Link
                key={candidate.id}
                to={`/candidates/${makeUrlId(candidate.id)}`}
                className="rounded-[12px] p-2 transition-colors hover:bg-background-ternary"
              >
                <p className="text-sm font-medium text-content-primary line-clamp-2">
                  {candidate.latestVersion.content.title}
                </p>
                <p className="mt-1 text-xs text-content-secondary">
                  {candidate.slug}
                </p>
              </Link>
            ))
          ) : (
            <EmptyNote>No active candidates</EmptyNote>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {voters.length > 0 ? (
            voters.slice(0, 12).map((voter) => (
              <Link
                key={voter.address}
                to={`/profile/${voter.address}`}
                className="flex items-center gap-3 rounded-[12px] p-2 transition-colors hover:bg-background-ternary"
              >
                <EnsAvatar address={getAddress(voter.address)} size={36} />
                <div className="min-w-0 flex-1">
                  <EnsName
                    address={getAddress(voter.address)}
                    className="block truncate text-sm font-medium"
                  />
                  <p className="text-xs text-content-secondary">
                    {voter.proposalsVotedCount}{" "}
                    {voter.proposalsVotedCount === 1 ? "proposal" : "proposals"}{" "}
                    · {voter.totalVotes} votes
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <EmptyNote>No voters yet</EmptyNote>
          )}
          <Link
            to="/profiles"
            className="mt-2 px-2 text-sm text-content-secondary hover:text-content-primary"
          >
            View all voters
          </Link>
        </div>
      )}
    </aside>
  );
}
