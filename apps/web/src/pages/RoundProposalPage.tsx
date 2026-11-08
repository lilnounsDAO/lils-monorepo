import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { ArrowLeft, Pencil, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { SomethingWentWrong } from "@/components/SomethingWentWrong";
import RoundIdentity from "@/components/Rounds/RoundIdentity";
import { ordinal, toRoundActor } from "@/components/Rounds/utils";
import { formatNumber, formatTimestamp } from "@/utils/format";
import { useRound, useRoundProposal } from "@/hooks/rounds/useRounds";

export default function RoundProposalPage() {
  const { handle, id } = useParams<{ handle: string; id: string }>();
  const { address } = useAccount();
  const proposalId = Number(id);
  const { data, isLoading, error } = useRoundProposal(
    Number.isFinite(proposalId) ? proposalId : undefined,
  );
  const { data: roundData } = useRound(handle);

  if (isLoading) {
    return (
      <div className="flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-96 w-full rounded-[16px]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <SomethingWentWrong
        message={error?.message ?? "That proposal could not be loaded."}
        returnHref={handle ? `/rounds/${handle}` : "/rounds"}
      />
    );
  }

  const { proposal } = data;
  const round = roundData?.round;
  const votes = Number(proposal.voteCount);
  const isAuthor = address && proposal.author.toLowerCase() === address.toLowerCase();
  const editable = isAuthor && round?.state === "proposing";

  return (
    <>
      <Helmet>
        <title>{proposal.title} | Lil Nouns Rounds</title>
        <meta name="description" content={proposal.tldr ?? proposal.title} />
      </Helmet>

      <div className="flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <Link
          to={`/rounds/${proposal.roundHandle}`}
          className="flex items-center gap-1 text-sm text-content-secondary hover:text-content-primary"
        >
          <ArrowLeft className="size-4" /> {round?.name ?? "Back to the round"}
        </Link>

        <header className="flex flex-col gap-3">
          {proposal.place != null && (
            <span className="flex w-fit items-center gap-1 rounded-full bg-background-secondary px-3 py-1 text-xs font-medium">
              <Trophy className="size-3" /> {ordinal(proposal.place)} place
            </span>
          )}
          <h1 className="text-3xl font-bold">{proposal.title}</h1>
          {proposal.tldr && <p className="text-content-secondary">{proposal.tldr}</p>}

          <div className="flex flex-wrap items-center gap-4 text-sm text-content-secondary">
            <RoundIdentity
              actor={toRoundActor(proposal.author, proposal.authorName, proposal.authorImage)}
              avatarSize={20}
              className="text-sm"
            />
            <span>
              {formatNumber({ input: votes, compact: true })} {votes === 1 ? "vote" : "votes"} from{" "}
              {proposal.voterCount} {proposal.voterCount === 1 ? "voter" : "voters"}
            </span>
            <span>
              {formatTimestamp({
                timestamp: new Date(proposal.createdAt).getTime(),
                showDay: true,
                showMonth: true,
              })}
            </span>
            {editable && (
              <Link
                to={`/rounds/${proposal.roundHandle}/propose?edit=${proposal.id}`}
                className="flex items-center gap-1 underline hover:text-content-primary"
              >
                <Pencil className="size-3" /> Edit
              </Link>
            )}
          </div>
        </header>

        <MarkdownRenderer className="prose max-w-none">{proposal.content}</MarkdownRenderer>
      </div>
    </>
  );
}
