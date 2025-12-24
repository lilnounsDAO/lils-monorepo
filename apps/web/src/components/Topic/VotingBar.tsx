import clsx from "clsx";

interface VotingBarProps {
  current: number;
  threshold: number;
  className?: string;
}

export default function VotingBar({ current, threshold, className }: VotingBarProps) {
  const percentage = Math.min((current / threshold) * 100, 100);
  const isThresholdMet = current >= threshold;

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-background-secondary">
        <div
          className={clsx(
            "h-full transition-all duration-500",
            isThresholdMet ? "bg-semantic-positive" : "bg-blue-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-content-secondary paragraph-sm">
        <span className="font-medium text-content-primary">
          {current} / {threshold} votes
        </span>
        {isThresholdMet && (
          <span className="text-semantic-positive">Ready to promote ✓</span>
        )}
      </div>
    </div>
  );
}

