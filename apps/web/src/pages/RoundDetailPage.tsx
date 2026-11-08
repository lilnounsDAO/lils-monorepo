import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import clsx from "clsx";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { SomethingWentWrong } from "@/components/SomethingWentWrong";
import AwardList from "@/components/Rounds/AwardList";
import BallotBar from "@/components/Rounds/BallotBar";
import ConnectPrompt from "@/components/Rounds/ConnectPrompt";
import RoundActivityFeed from "@/components/Rounds/RoundActivityFeed";
import RoundIdentity from "@/components/Rounds/RoundIdentity";
import RoundProposalCard from "@/components/Rounds/RoundProposalCard";
import RoundImage from "@/components/Rounds/RoundImage";
import RoundStateBadge from "@/components/Rounds/RoundStateBadge";
import RoundTimeline from "@/components/Rounds/RoundTimeline";
import VoteControls from "@/components/Rounds/VoteControls";
import {
  formatAwardTotal,
  isArchivedRound,
  toRoundActor,
} from "@/components/Rounds/utils";
import { useCastRoundVotes } from "@/hooks/rounds/useRoundWrites";
import { useRound, useRoundActivity, useRoundPower } from "@/hooks/rounds/useRounds";
import { useScrollToTop } from "@/hooks/rounds/useScrollToTop";

type Tab = "proposals" | "activity" | "about";

export default function RoundDetailPage() {
  useScrollToTop();
  const { handle } = useParams<{ handle: string }>();
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>("proposals");
  /** Votes the wallet is about to cast, by proposal id. Signed in one go. */
  const [ballot, setBallot] = useState<Record<number, number>>({});

  const { data, isLoading, error } = useRound(handle);
  const { data: activity } = useRoundActivity(handle, 100);
  const { data: power } = useRoundPower(handle);
  const castVotes = useCastRoundVotes();

  const allocated = useMemo(
    () => Object.values(ballot).reduce((total, votes) => total + votes, 0),
    [ballot],
  );

  if (isLoading) {
    return (
      <div className="flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48 w-full rounded-[16px]" />
        <Skeleton className="h-96 w-full rounded-[16px]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <SomethingWentWrong
        message={error?.message ?? "That round could not be loaded."}
        returnHref="/rounds"
      />
    );
  }

  const { round, proposals } = data;
  const archived = isArchivedRound(round);
  const canVote = round.state === "voting" && (power?.canVote ?? false);
  const remaining = power ? Number(power.votesRemaining) - allocated : 0;

  return (
    <>
      <Helmet>
        <title>{round.name} | Lil Nouns Rounds</title>
        <meta name="description" content={round.description ?? round.name} />
        {round.image && <meta property="og:image" content={round.image} />}
      </Helmet>

      <div className="flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
        <Link
          to="/rounds"
          className="flex items-center gap-1 text-sm text-content-secondary hover:text-content-primary"
        >
          <ArrowLeft className="size-4" /> All rounds
        </Link>

        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <RoundStateBadge round={round} />
          </div>
          <div className="flex items-start gap-4">
            <RoundImage
              src={round.image}
              className="hidden size-20 shrink-0 rounded-[12px] object-cover md:block"
            />
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-3xl font-bold">{round.name}</h1>
              {/* A div, not a p: the avatar inside RoundIdentity renders a div. */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-content-secondary">
                <span>Opened by</span>
                <RoundIdentity
                  actor={toRoundActor(round.creator, round.creatorName, round.creatorImage)}
                  avatarSize={18}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
          {round.description && <p className="text-content-secondary">{round.description}</p>}
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex min-w-0 flex-col gap-6">
            <nav className="flex gap-2 border-b">
              {(
                [
                  { id: "proposals" as const, label: `Proposals (${proposals.length})` },
                  { id: "activity" as const, label: "Activity" },
                  { id: "about" as const, label: "About" },
                ]
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTab(option.id)}
                  className={clsx(
                    "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    tab === option.id
                      ? "border-content-primary text-content-primary"
                      : "border-transparent text-content-secondary hover:text-content-primary",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </nav>

            {tab === "proposals" && (
              <div className="flex flex-col gap-4">
                {round.state === "proposing" && !archived && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border p-4">
                    <p className="text-sm text-content-secondary">
                      {round.proposeStrategyDescription}.
                    </p>
                    {address ? (
                      <Link to={`/rounds/${round.handle}/propose`}>
                        <Button>
                          <Plus className="mr-1 size-4" /> Propose
                        </Button>
                      </Link>
                    ) : (
                      <ConnectPrompt>Connect to propose</ConnectPrompt>
                    )}
                  </div>
                )}

                {proposals.length === 0 ? (
                  <p className="py-8 text-center text-content-secondary">
                    {archived
                      ? "This round's proposals were not preserved. See About for what survived."
                      : round.state === "ended"
                        ? "This round ended without any proposals."
                        : "No proposals yet."}
                  </p>
                ) : (
                  proposals.map((proposal) => (
                    <RoundProposalCard key={proposal.id} round={round} proposal={proposal}>
                      {canVote && (
                        <VoteControls
                          votes={ballot[proposal.id] ?? 0}
                          remaining={remaining}
                          disabled={castVotes.isPending}
                          onChange={(votes) =>
                            setBallot((current) => {
                              const next = { ...current };
                              if (votes <= 0) delete next[proposal.id];
                              else next[proposal.id] = votes;
                              return next;
                            })
                          }
                        />
                      )}
                    </RoundProposalCard>
                  ))
                )}

                {canVote && power && allocated > 0 && (
                  <BallotBar
                    power={power}
                    allocated={allocated}
                    pending={castVotes.isPending}
                    error={castVotes.error?.message ?? null}
                    onClear={() => setBallot({})}
                    onSubmit={() =>
                      castVotes.mutate(
                        {
                          handle: round.handle,
                          votes: Object.entries(ballot).map(([proposal, votes]) => ({
                            proposal: Number(proposal),
                            votes: String(votes),
                          })),
                        },
                        { onSuccess: () => setBallot({}) },
                      )
                    }
                  />
                )}
              </div>
            )}

            {tab === "activity" && (
              <RoundActivityFeed round={round} events={activity?.events ?? []} />
            )}

            {tab === "about" && (
              <MarkdownRenderer className="prose max-w-none">
                {round.content ?? round.description ?? ""}
              </MarkdownRenderer>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <section className="flex flex-col gap-3 rounded-[16px] border p-5">
              <h2 className="font-bold">
                Awards
                {round.awards.length > 0 && (
                  <span className="pl-2 font-normal text-content-secondary">
                    {formatAwardTotal(round.awards)}
                  </span>
                )}
              </h2>
              <AwardList round={round} proposals={proposals} />
            </section>

            <section className="flex flex-col gap-3 rounded-[16px] border p-5">
              <h2 className="font-bold">Timeline</h2>
              <RoundTimeline round={round} />
            </section>

            <section className="flex flex-col gap-2 rounded-[16px] border p-5 text-sm">
              <h2 className="font-bold">Rules</h2>
              {/* An archived round describes both sides the same way; say it once. */}
              <p className="text-content-secondary">{round.proposeStrategyDescription}</p>
              {round.voteStrategyDescription !== round.proposeStrategyDescription && (
                <p className="text-content-secondary">{round.voteStrategyDescription}</p>
              )}
              {round.snapshotBlock && (
                <p className="text-content-secondary">
                  Voting power read at block {round.snapshotBlock.toLocaleString()}
                </p>
              )}
              {power && round.state === "voting" && (
                <p className="pt-2">
                  You have <span className="font-bold">{power.votesRemaining}</span> of{" "}
                  <span className="font-bold">{power.votingPower}</span>{" "}
                  {power.votingPower === "1" ? "vote" : "votes"} left.
                </p>
              )}
              {!address && round.state === "voting" && (
                <div className="pt-2">
                  <ConnectPrompt>Connect to vote</ConnectPrompt>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
