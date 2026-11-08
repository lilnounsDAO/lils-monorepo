import { Link } from "react-router-dom";
import clsx from "clsx";
import { Trophy } from "lucide-react";
import { Round, RoundProposal } from "@/data/rounds/types";
import { formatNumber } from "@/utils/format";
import RoundIdentity from "./RoundIdentity";
import { ordinal, toRoundActor } from "./utils";

export default function RoundProposalCard({
  round,
  proposal,
  children,
}: {
  round: Round;
  proposal: RoundProposal;
  /** The ballot's controls for this proposal, while voting is open. */
  children?: React.ReactNode;
}) {
  const votes = Number(proposal.voteCount);
  const won = round.state === "ended" && proposal.place != null;

  return (
    <div
      className={clsx(
        "flex flex-col gap-3 rounded-[16px] border p-5 transition-all",
        won && "border-content-primary",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <Link to={`/rounds/${round.handle}/proposals/${proposal.id}`} className="min-w-0">
          <h3 className="font-bold hover:underline">{proposal.title}</h3>
        </Link>
        {won && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-background-secondary px-3 py-1 text-xs font-medium">
            <Trophy className="size-3" />
            {ordinal(proposal.place!)}
          </span>
        )}
      </div>

      {proposal.tldr && (
        <p className="line-clamp-2 text-sm text-content-secondary">{proposal.tldr}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-content-secondary">
          <RoundIdentity
            actor={toRoundActor(proposal.author, proposal.authorName, proposal.authorImage)}
            avatarSize={18}
            className="text-sm"
          />
          <span>
            {formatNumber({ input: votes, compact: true })} {votes === 1 ? "vote" : "votes"}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
