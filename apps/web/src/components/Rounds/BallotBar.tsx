"use client";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { RoundPower } from "@/data/rounds/types";

/**
 * The ballot in progress. It sits at the bottom of the round page while voting
 * is open and the wallet has votes left, and submitting signs the whole
 * allocation at once.
 */
export default function BallotBar({
  power,
  allocated,
  pending,
  error,
  onSubmit,
  onClear,
}: {
  power: RoundPower;
  allocated: number;
  pending: boolean;
  error?: string | null;
  onSubmit: () => void;
  onClear: () => void;
}) {
  const remaining = Number(power.votesRemaining) - allocated;

  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background-primary px-4 py-3 md:mx-0 md:rounded-[16px] md:border md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-bold">{allocated}</span> of{" "}
          <span className="font-bold">{power.votesRemaining}</span>{" "}
          {Number(power.votesRemaining) === 1 ? "vote" : "votes"} on your ballot
          {remaining > 0 && (
            <span className="text-content-secondary"> · {remaining} left</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {allocated > 0 && !pending && (
            <Button variant="ghost" onClick={onClear}>
              Clear
            </Button>
          )}
          <Button disabled={allocated === 0 || pending} onClick={onSubmit}>
            {pending ? (
              <span className="flex items-center gap-2">
                <Spinner size="1rem" /> Signing
              </span>
            ) : (
              "Submit votes"
            )}
          </Button>
        </div>
      </div>
      {error && <p className="pt-2 text-sm text-semantic-negative">{error}</p>}
    </div>
  );
}
