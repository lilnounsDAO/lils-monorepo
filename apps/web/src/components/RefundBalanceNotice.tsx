"use client";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { CHAIN_CONFIG } from "@/config";
import { Button } from "@/components/ui/button";
import {
  REFUND_REFILL_AMOUNT_ETH,
  useRefundBalance,
} from "@/hooks/useRefundBalance";
import {
  EditorDraftContentType,
  newEditorDraftId,
  upsertEditorDraft,
} from "@/utils/editorDrafts";

const REFILL_TITLE = "Refill vote gas refunds";

function refillBody(currentBalance: string | undefined) {
  return `## Summary

Send ${REFUND_REFILL_AMOUNT_ETH} ETH from the treasury to the Lil Nouns DAO governor (${CHAIN_CONFIG.addresses.nounsDaoProxy}) so voters keep getting their gas refunded.

## Why

Refundable votes (\`castRefundableVote\`) pay voters back from the governor's own ETH balance. The balance is currently ${currentBalance ?? "low"} ETH. When it runs out, votes still work but voters pay their own gas, which discourages participation.

## Transactions

1. Transfer ${REFUND_REFILL_AMOUNT_ETH} ETH from the treasury to the governor.`;
}

export function RefundBalanceNotice({
  showWhenHealthy = false,
  compact = false,
  className,
}: {
  showWhenHealthy?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const { formatted, isLow, isEmpty, isLoading } = useRefundBalance();

  if (isLoading || formatted === undefined) return null;
  if (!isLow && !showWhenHealthy) return null;

  function draftRefill(contentType: EditorDraftContentType) {
    const now = Date.now();
    const id = newEditorDraftId();
    upsertEditorDraft({
      id,
      title: REFILL_TITLE,
      bodyMarkdown: refillBody(formatted),
      actions: [
        {
          type: "one-time-payment",
          target: CHAIN_CONFIG.addresses.nounsDaoProxy,
          amount: REFUND_REFILL_AMOUNT_ETH,
          currency: "eth",
        },
      ],
      contentType,
      createdAt: now,
      updatedAt: now,
    });
    navigate(`/new/${id}`);
  }

  const message = !isLow
    ? `Vote gas refunds are funded: ${formatted} ETH left in the governor.`
    : isEmpty
      ? "Vote gas refunds are empty. Votes still go through, but voters pay their own gas."
      : `Vote gas refunds are running low: ${formatted} ETH left in the governor.`;

  return (
    <div
      className={clsx(
        "flex flex-col gap-2 rounded-[12px] border px-4 py-3 text-sm",
        isLow
          ? "border-yellow-300 bg-yellow-50 text-yellow-900"
          : "border-gray-200 bg-background-secondary text-content-secondary",
        className,
      )}
    >
      <p>
        <span className="font-bold">FYI:</span> {message}
      </p>
      {isLow && !compact && (
        <div className="flex flex-wrap gap-2">
          <Button className="px-4 py-2" onClick={() => draftRefill("proposal")}>
            Draft refill proposal
          </Button>
          <Button
            className="px-4 py-2"
            variant="secondary"
            onClick={() => draftRefill("candidate")}
          >
            Draft as candidate
          </Button>
        </div>
      )}
    </div>
  );
}
