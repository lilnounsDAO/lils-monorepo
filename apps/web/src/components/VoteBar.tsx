import clsx from "clsx";

// For from the left, against from the right (abstain beside it), quorum tick.
export function VoteBar({
  forVotes,
  againstVotes,
  abstainVotes,
  quorumVotes,
  size = "sm",
  className,
}: {
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  quorumVotes: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const total = Math.max(
    quorumVotes * 1.1,
    forVotes + againstVotes + abstainVotes,
    1,
  );
  const pct = (value: number) => `${(value / total) * 100}%`;
  return (
    <div
      className={clsx(
        "relative w-full rounded-full bg-gray-100",
        size === "lg" ? "h-2" : "h-[3px]",
        className,
      )}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-semantic-positive transition-all"
        style={{ width: pct(forVotes) }}
      />
      <div
        className="absolute inset-y-0 rounded-full bg-gray-400 transition-all"
        style={{ right: pct(againstVotes), width: pct(abstainVotes) }}
      />
      <div
        className="absolute inset-y-0 right-0 rounded-full bg-semantic-negative transition-all"
        style={{ width: pct(againstVotes) }}
      />
      {quorumVotes > 0 && (
        <div
          className={clsx(
            "absolute w-[3px] -translate-x-1/2 rounded-full bg-semantic-warning transition-all",
            size === "lg" ? "-top-1 h-4" : "-top-[3px] h-[9px]",
          )}
          style={{ left: pct(quorumVotes) }}
        />
      )}
    </div>
  );
}
