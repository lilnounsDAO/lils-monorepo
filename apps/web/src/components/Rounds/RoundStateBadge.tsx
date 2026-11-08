import clsx from "clsx";
import { Round } from "@/data/rounds/types";
import { ROUND_STATE_LABEL, isArchivedRound } from "./utils";

const STYLES: Record<Round["state"], string> = {
  pending: "bg-background-secondary text-content-secondary",
  proposing: "bg-blue-100 text-blue-700",
  voting: "bg-green-100 text-green-700",
  ended: "bg-background-secondary text-content-secondary",
};

export default function RoundStateBadge({
  round,
  className,
}: {
  round: Round;
  className?: string;
}) {
  const archived = isArchivedRound(round);
  return (
    <span className="flex items-center gap-2">
      <span
        className={clsx(
          "rounded-full px-3 py-1 text-xs font-medium",
          STYLES[round.state],
          className,
        )}
      >
        {ROUND_STATE_LABEL[round.state]}
      </span>
      {archived && (
        <span className="rounded-full bg-background-secondary px-3 py-1 text-xs font-medium text-content-secondary">
          {round.source === "prop-house" ? "Prop House" : "nouns.gg"}
        </span>
      )}
    </span>
  );
}
