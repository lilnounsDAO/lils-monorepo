import clsx from "clsx";
import { Round } from "@/data/rounds/types";
import { formatTimeLeft } from "@/utils/format";

interface Step {
  label: string;
  at: Date;
}

/**
 * Where the round is between its three timestamps, and how long is left of the
 * stage it is in.
 */
export default function RoundTimeline({ round, className }: { round: Round; className?: string }) {
  const steps: Step[] = [
    { label: "Proposing opens", at: new Date(round.startAt) },
    { label: "Voting opens", at: new Date(round.votingStartAt) },
    { label: "Round ends", at: new Date(round.endAt) },
  ];
  const now = Date.now();
  const next = steps.find((step) => step.at.getTime() > now);

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => {
          const passed = step.at.getTime() <= now;
          const current = !passed && steps.findIndex((s) => s.at.getTime() > now) === index;
          return (
            <li key={step.label} className="flex items-center gap-3">
              <span
                className={clsx(
                  "size-2.5 shrink-0 rounded-full",
                  passed ? "bg-content-primary" : current ? "bg-semantic-accent" : "bg-background-secondary",
                )}
              />
              <span className={clsx("text-sm", passed ? "font-medium" : "text-content-secondary")}>
                {step.label}
              </span>
              <span className="ml-auto text-sm text-content-secondary">
                {Intl.DateTimeFormat("en", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(step.at)}
              </span>
            </li>
          );
        })}
      </ol>
      {next && (
        <p className="text-sm text-content-secondary">
          {next.label} in{" "}
          <span className="font-bold text-content-primary">
            {formatTimeLeft(Math.max(0, Math.round((next.at.getTime() - now) / 1000)))}
          </span>
        </p>
      )}
    </div>
  );
}
