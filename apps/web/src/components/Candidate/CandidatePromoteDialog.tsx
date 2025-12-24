import { ReactNode, useEffect, useState } from "react";
import TransactionButton from "@/components/TransactionButton";
import { TransactionState } from "@/hooks/transactions/types";
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
} from "@/components/ui/DrawerDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/shadcn";
import { BadgeCheck, ShieldCheck } from "lucide-react";

type PromoteMode = "signatures" | "tokens";

interface PromoteOption {
  type: PromoteMode;
  title: string;
  description: string;
  icon: ReactNode;
  statLabel: string;
  current: number;
  threshold: number;
  canUse: boolean;
  unavailableMessage: string;
}

interface CandidatePromoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalThreshold: number;
  signatureVotesTotal: number;
  proposerVotingPower: number;
  canPromoteWithSignatures: boolean;
  canPromoteWithTokens: boolean;
  onPromote: (mode: PromoteMode) => void;
  promoteState?: TransactionState;
  promoteError?: Error | null;
}

export function CandidatePromoteDialog({
  open,
  onOpenChange,
  proposalThreshold,
  signatureVotesTotal,
  proposerVotingPower,
  canPromoteWithSignatures,
  canPromoteWithTokens,
  onPromote,
  promoteState = "idle",
  promoteError,
}: CandidatePromoteDialogProps) {
  const [selection, setSelection] = useState<PromoteMode>("signatures");

  useEffect(() => {
    if (!open) return;
    // Default to the first available option when opening
    if (canPromoteWithSignatures) {
      setSelection("signatures");
      return;
    }
    if (canPromoteWithTokens) {
      setSelection("tokens");
      return;
    }
    setSelection("signatures");
  }, [open, canPromoteWithSignatures, canPromoteWithTokens]);

  const options: PromoteOption[] = [
    {
      type: "signatures",
      title: "Promote with signatures",
      description: "Uses collected signer votes. Requires meeting the threshold.",
      icon: <BadgeCheck className="h-8 w-8" />,
      statLabel: "Signatures voting power",
      current: signatureVotesTotal,
      threshold: proposalThreshold,
      canUse: canPromoteWithSignatures,
      unavailableMessage: `Need ${Math.max(0, proposalThreshold - signatureVotesTotal)} more signature vote${
        Math.max(0, proposalThreshold - signatureVotesTotal) === 1 ? "" : "s"
      } to enable this.`,
    },
    {
      type: "tokens",
      title: "Promote with your tokens",
      description: "Skip signatures and use your voting power directly.",
      icon: <ShieldCheck className="h-8 w-8" />,
      statLabel: "Your voting power",
      current: proposerVotingPower,
      threshold: proposalThreshold,
      canUse: canPromoteWithTokens,
      unavailableMessage: `Need ${Math.max(0, proposalThreshold - proposerVotingPower)} more vote${
        Math.max(0, proposalThreshold - proposerVotingPower) === 1 ? "" : "s"
      } to self-promote.`,
    },
  ];

  const selectedOption = options.find((option) => option.type === selection) ?? options[0];
  const isSelectedAvailable = selectedOption?.canUse ?? false;
  const isSubmitting = promoteState === "pending-txn";

  const handleContinue = () => {
    if (!selectedOption) return;
    if (!selectedOption.canUse || isSubmitting) return;
    onPromote(selectedOption.type);
    onOpenChange(false);
  };

  return (
    <DrawerDialog open={open} onOpenChange={onOpenChange}>
      <DrawerDialogContent className="md:max-w-[600px]">
        <DrawerDialogTitle className="sr-only">Choose how to promote</DrawerDialogTitle>
        <DrawerDialogContentInner className="flex flex-col gap-6">
          <div className="w-full">
            <h2 className="heading-5">Choose how to promote</h2>
            <p className="text-content-secondary paragraph-sm">
              Use signatures or your own voting power to put this candidate onchain.
            </p>
          </div>

          <div className="w-full flex flex-col gap-4">
            {options.map((option) => {
              const isActive = selection === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setSelection(option.type)}
                  disabled={!option.canUse && !isActive}
                  className={cn(
                    "flex items-start gap-4 rounded-[16px] border-2 p-6 text-left transition-all group",
                    isActive ? "border-blue-400 bg-blue-50/30" : "border-border-primary hover:border-blue-400 hover:bg-blue-50/30",
                    !option.canUse && !isActive ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-[12px] transition-colors shrink-0",
                      isActive ? "bg-blue-100" : "bg-background-secondary group-hover:bg-blue-100"
                    )}
                  >
                    <div
                      className={cn(
                        "transition-colors",
                        isActive ? "text-blue-600" : "text-content-primary group-hover:text-blue-600"
                      )}
                    >
                      {option.icon}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pt-1 flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="heading-6">{option.title}</span>
                      <span className="text-sm text-content-secondary">{option.description}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-content-secondary">
                      <span>{option.statLabel}</span>
                      <span className="font-semibold text-content-primary">
                        {option.current}/{option.threshold}
                      </span>
                    </div>
                    {!option.canUse && (
                      <p className="text-xs text-content-secondary">{option.unavailableMessage}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {promoteError && (
            <div className="text-semantic-negative text-sm rounded-[12px] border border-semantic-negative/40 bg-semantic-negative/5 p-3">
              {promoteError.message}
            </div>
          )}

          <div className="w-full flex justify-end gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <TransactionButton
              onClick={handleContinue}
              txnState={promoteState}
              disabled={!isSelectedAvailable || isSubmitting}
            >
              {isSubmitting
                ? "Promoting..."
                : selection === "signatures"
                ? "Promote via signatures"
                : "Promote with tokens"}
            </TransactionButton>
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  );
}
