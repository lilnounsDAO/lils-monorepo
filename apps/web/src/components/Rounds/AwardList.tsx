import { Link } from "react-router-dom";
import clsx from "clsx";
import { Round, RoundProposal } from "@/data/rounds/types";
import RoundIdentity from "./RoundIdentity";
import { formatAward, ordinal, podiumStyle, toRoundActor } from "./utils";

/**
 * The prizes, and once the round has settled, who won each one. A place with no
 * winner means fewer proposals got votes than there were awards.
 */
export default function AwardList({
  round,
  proposals,
  className,
}: {
  round: Round;
  proposals?: RoundProposal[];
  className?: string;
}) {
  const byId = new Map((proposals ?? []).map((proposal) => [proposal.id, proposal]));
  const settled = round.state === "ended";

  return (
    <ul className={clsx("flex flex-col divide-y", className)}>
      {round.awards.map((award) => {
        const winner = award.winnerProposalId ? byId.get(award.winnerProposalId) : undefined;
        return (
          <li key={award.id} className="flex items-center justify-between gap-4 py-3">
            <span className="flex min-w-0 flex-col">
              <span className="font-bold">{formatAward(award)}</span>
              {winner ? (
                <Link
                  to={`/rounds/${round.handle}/proposals/${winner.id}`}
                  className="flex min-w-0 items-center gap-1 text-sm text-content-secondary hover:text-content-primary"
                >
                  <RoundIdentity
                    actor={toRoundActor(winner.author, winner.authorName, winner.authorImage)}
                    avatarSize={16}
                    className="text-sm font-normal"
                  />
                  <span className="truncate">— {winner.title}</span>
                </Link>
              ) : (
                settled && (
                  <span className="text-sm text-content-secondary">Not awarded</span>
                )
              )}
            </span>
            <span
              className={clsx(
                "shrink-0 rounded-full px-2.5 py-0.5 text-sm font-medium",
                podiumStyle(award.place)?.badge ?? "text-content-secondary",
              )}
            >
              {ordinal(award.place)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
