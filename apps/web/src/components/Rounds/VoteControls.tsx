"use client";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Votes a wallet is about to put on one proposal. Nothing is signed here: the
 * ballot is signed once, from BallotBar, so spreading votes over several
 * proposals is a single wallet prompt.
 */
export default function VoteControls({
  votes,
  remaining,
  disabled,
  onChange,
}: {
  votes: number;
  /** Votes still unallocated across the whole ballot. */
  remaining: number;
  disabled?: boolean;
  onChange: (votes: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="icon-slim"
        aria-label="Remove a vote"
        disabled={disabled || votes === 0}
        onClick={() => onChange(votes - 1)}
      >
        <Minus className="size-4" />
      </Button>
      <span className="min-w-6 text-center font-bold tabular-nums">{votes}</span>
      <Button
        variant="secondary"
        size="icon-slim"
        aria-label="Add a vote"
        disabled={disabled || remaining === 0}
        onClick={() => onChange(votes + 1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
