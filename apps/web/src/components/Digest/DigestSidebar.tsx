import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { truncate } from "lodash";
import { getAddress } from "viem";
import { getProposalOverviews } from "@/data/goldsky/governance/getProposalOverviewsVersioned";
import { ProposalOverview, ProposalState } from "@/data/goldsky/governance/common";
import { getProposalIdeas, makeUrlId } from "@/data/goldsky/governance/getProposalIdeas";
import { getTopics, makeTopicUrlId, Topic } from "@/data/goldsky/governance/getTopics";
import { getAllVoters } from "@/data/goldsky/governance/getAllVoters";
import { ProposalStateBadge } from "@/components/Proposal/ProposalStateBadge";
import { EnsAvatar } from "@/components/EnsAvatar";
import { EnsName } from "@/components/EnsName";
import { formatTimeLeft } from "@/utils/format";
import { isDaoVersion5 } from "@/utils/daoVersion";

export type DigestTab = "digest" | "proposals" | "topics" | "candidates" | "voters";

const ONGOING_STATES: ProposalState[] = [
  "pending",
  "active",
  "updatable",
  "queued",
];

function endsIn(proposal: ProposalOverview): string | null {
  const now = Math.floor(Date.now() / 1000);
  const remaining = proposal.votingEndTimestamp - now;
  if (remaining <= 0) return null;
  return `Ends in ${formatTimeLeft(remaining, true).trim()}`;
}

function SidebarProposalRow({
  proposal,
  extra,
}: {
  proposal: ProposalOverview;
  extra?: string | null;
}) {
  return (
    <Link
      to={`/vote/${proposal.id}`}
      className="flex flex-col gap-1 rounded-[12px] p-2 transition-colors hover:bg-background-ternary"
    >
      <p className="text-sm font-medium text-content-primary line-clamp-2">
        Prop {proposal.id} · {truncate(proposal.title, { length: 70 })}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-content-secondary">
        <ProposalStateBadge
          state={proposal.state}
          objectionPeriodEndBlock={proposal.objectionPeriodEndBlock}
        />
        <span>
          {proposal.forVotes} for · {proposal.againstVotes} against
        </span>
        {extra && <span>{extra}</span>}
      </div>
    </Link>
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
  const ongoing = proposals.filter((proposal) =>
    ONGOING_STATES.includes(proposal.state),
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
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h3 className="heading-6">Ongoing</h3>
        {ongoing.length > 0 ? (
          ongoing.map((proposal) => (
            <SidebarProposalRow
              key={proposal.id}
              proposal={proposal}
              extra={endsIn(proposal)}
            />
          ))
        ) : (
          <EmptyNote>No live proposals</EmptyNote>
        )}
      </section>

      {recentCandidates.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="heading-6">New candidates</h3>
            <Link
              to="/candidates"
              className="text-xs text-content-secondary hover:text-content-primary"
            >
              View all
            </Link>
          </div>
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
                    Math.floor(Date.now() / 1000) - candidate.lastUpdatedTimestamp,
                  ),
                  true,
                ).trim()}
              </p>
            </Link>
          ))}
        </section>
      )}

      {recentTopics.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="heading-6">Topics</h3>
            <Link
              to="/topics"
              className="text-xs text-content-secondary hover:text-content-primary"
            >
              View all
            </Link>
          </div>
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
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="heading-6">Recently concluded</h3>
        {concluded.length > 0 ? (
          concluded.map((proposal) => (
            <SidebarProposalRow key={proposal.id} proposal={proposal} />
          ))
        ) : (
          <EmptyNote>No concluded proposals yet</EmptyNote>
        )}
      </section>
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
            proposals.slice(0, 12).map((proposal) => (
              <SidebarProposalRow
                key={proposal.id}
                proposal={proposal}
                extra={
                  ONGOING_STATES.includes(proposal.state)
                    ? endsIn(proposal)
                    : null
                }
              />
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
