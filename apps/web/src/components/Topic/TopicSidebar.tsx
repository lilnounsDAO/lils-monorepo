import { ProposalIdea } from "@/data/goldsky/governance/ideaTypes";
import { useAccount } from "wagmi";
import TransactionButton from "@/components/TransactionButton";
import { TransactionState } from "@/hooks/transactions/types";

interface TopicSidebarProps {
  topic: ProposalIdea;
  onCancel?: () => void;
  cancelState?: TransactionState;
  cancelError?: Error | null;
}

export default function TopicSidebar({
  topic,
  onCancel,
  cancelState = "idle",
  cancelError,
}: TopicSidebarProps) {
  const { address } = useAccount();
  const normalizedProposer = topic.proposerAddress.toLowerCase();
  const isProposer = address?.toLowerCase() === normalizedProposer;

  return (
    <div className="flex flex-col gap-6">
      {topic.canceledTimestamp && (
        <div className="flex flex-col gap-2 rounded-[12px] border border-semantic-secondary bg-gray-50 p-4">
        <p className="text-sm font-medium text-content-secondary">
          This topic is closed
        </p>
      </div>
      )}

      {!topic.canceledTimestamp && (
        <div className="flex flex-col gap-3">
          <div className="rounded-[12px] border border-border-primary bg-background-secondary p-4 text-sm text-content-secondary">
            Topics are for discussion only and cannot be promoted onchain.
          </div>

          {isProposer && !topic.latestVersion.proposalId && onCancel && (
            <TransactionButton
              variant="negative"
              className="w-full"
              onClick={onCancel}
              txnState={cancelState}
            >
              {cancelState === "pending-txn" ? "Closing..." : "Close Topic"}
            </TransactionButton>
          )}
          {cancelError && (
            <div className="max-h-[50px] w-full overflow-y-auto text-center text-semantic-negative paragraph-sm">
              {cancelError.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
