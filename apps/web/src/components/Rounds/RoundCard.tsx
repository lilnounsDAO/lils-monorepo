import { Link } from "react-router-dom";
import { Round } from "@/data/rounds/types";
import { formatNumber } from "@/utils/format";
import RoundStateBadge from "./RoundStateBadge";
import { formatAwardTotal, formatRoundDates } from "./utils";

export default function RoundCard({ round }: { round: Round }) {
  return (
    <Link
      to={`/rounds/${round.handle}`}
      className="flex gap-4 rounded-[16px] border p-6 transition-all hover:border-content-secondary"
    >
      {round.image && (
        <img
          src={round.image}
          alt=""
          loading="lazy"
          className="hidden size-24 shrink-0 rounded-[12px] object-cover md:block"
        />
      )}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <RoundStateBadge round={round} />
          <span className="text-sm text-content-secondary">{formatRoundDates(round)}</span>
        </div>

        <h2 className="text-xl font-bold">{round.name}</h2>
        {round.description && (
          <p className="line-clamp-2 text-content-secondary">{round.description}</p>
        )}

        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {round.awards.length > 0 && (
            <div className="flex gap-1">
              <dt className="text-content-secondary">Funding</dt>
              <dd className="font-bold">{formatAwardTotal(round.awards)}</dd>
            </div>
          )}
          <div className="flex gap-1">
            <dt className="text-content-secondary">Winners</dt>
            <dd className="font-bold">{round.awards.length}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-content-secondary">Proposals</dt>
            <dd className="font-bold">{round.proposalCount}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-content-secondary">Votes</dt>
            <dd className="font-bold">
              {formatNumber({ input: Number(round.voteCount), compact: true })}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
