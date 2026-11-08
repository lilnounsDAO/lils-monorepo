import clsx from "clsx";
import { Check } from "lucide-react";
import { Round } from "@/data/rounds/types";
import { formatTimeLeft } from "@/utils/format";

interface Step {
  label: string;
  at: Date;
}

/**
 * Where the round is between its three timestamps, and how long is left of the
 * stage it is in. The rail fills in as each one passes: a green tick behind it,
 * a ring on the one the round is waiting for, grey ahead of that.
 */
export default function RoundTimeline({ round, className }: { round: Round; className?: string }) {
  const steps: Step[] = [
    { label: "Proposing opens", at: new Date(round.startAt) },
    { label: "Voting opens", at: new Date(round.votingStartAt) },
    { label: "Round ends", at: new Date(round.endAt) },
  ];
  const now = Date.now();
  const nextIndex = steps.findIndex((step) => step.at.getTime() > now);
  const next = nextIndex === -1 ? undefined : steps[nextIndex];

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const passed = step.at.getTime() <= now;
          const current = index === nextIndex;
          const last = index === steps.length - 1;

          return (
            <li key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center self-stretch">
                <span
                  className={clsx(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    passed
                      ? "border-semantic-positive bg-semantic-positive text-white"
                      : current
                        ? "border-semantic-positive bg-background-primary"
                        : "border-border-primary bg-background-primary",
                  )}
                >
                  {passed && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                {/* The segment below a passed step is green too, so the rail
                    reads as one filled line up to where the round is now. */}
                {!last && (
                  <span
                    className={clsx(
                      "w-0.5 flex-1 transition-colors",
                      steps[index + 1].at.getTime() <= now
                        ? "bg-semantic-positive"
                        : passed
                          ? "bg-semantic-positive/40"
                          : "bg-border-primary",
                    )}
                  />
                )}
              </div>

              <div className={clsx("flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2", !last && "pb-5")}>
                <span
                  className={clsx(
                    "text-sm",
                    passed || current ? "font-medium" : "text-content-secondary",
                  )}
                >
                  {step.label}
                </span>
                <span className="ml-auto whitespace-nowrap text-sm text-content-secondary">
                  {Intl.DateTimeFormat("en", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(step.at)}
                </span>
              </div>
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
