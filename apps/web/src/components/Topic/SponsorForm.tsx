"use client";
import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSponsorCandidate } from "@/hooks/transactions/useSponsorCandidate";
import { ProposalIdea } from "@/data/goldsky/governance/ideaTypes";
import TransactionButton from "@/components/TransactionButton";
import { EnsName } from "../EnsName";
import { useReadContract } from "wagmi";
import { nounsNftTokenConfig, nounsDaoLogicConfig } from "@/data/generated/wagmi";
import { CHAIN_CONFIG } from "@/config";
import { getAddress } from "viem";
import clsx from "clsx";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface SponsorFormProps {
  candidate: ProposalIdea;
  onSuccess?: () => void;
}

export function SponsorForm({ candidate, onSuccess }: SponsorFormProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { address } = useAccount();
  const [reason, setReason] = useState("");
  const [expirationDays, setExpirationDays] = useState(30); // Default 30 days

  const {
    sponsorCandidate,
    error,
    state,
    reset: txnReset,
  } = useSponsorCandidate();

  // Get current voting power (signer's)
  const { data: voteWeight } = useReadContract({
    address: CHAIN_CONFIG.addresses.nounsToken,
    abi: nounsNftTokenConfig.abi,
    functionName: "getCurrentVotes",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get proposal threshold
  const { data: proposalThreshold } = useReadContract({
    address: CHAIN_CONFIG.addresses.nounsDaoProxy,
    abi: nounsDaoLogicConfig.abi,
    functionName: "proposalThreshold",
  });

  // Get proposer's voting power
  const { data: proposerVoteWeight } = useReadContract({
    address: CHAIN_CONFIG.addresses.nounsToken,
    abi: nounsNftTokenConfig.abi,
    functionName: "getCurrentVotes",
    args: candidate.proposerAddress ? [getAddress(candidate.proposerAddress)] : undefined,
    query: {
      enabled: !!candidate.proposerAddress,
    },
  });

  // Check if proposer meets threshold
  const proposerMeetsThreshold = useMemo(() => {
    if (!proposalThreshold || !proposerVoteWeight) return false;
    return proposerVoteWeight >= proposalThreshold;
  }, [proposalThreshold, proposerVoteWeight]);

  // Check if connected wallet is the proposer
  const isProposer = useMemo(() => {
    return address?.toLowerCase() === candidate.proposerAddress.toLowerCase();
  }, [address, candidate.proposerAddress]);

  // Calculate expiration timestamp
  const expirationTimestamp = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return now + expirationDays * 24 * 60 * 60;
  }, [expirationDays]);

  const disabled = useMemo(() => {
    return state === "pending-signature" || state === "pending-txn";
  }, [state]);

  const handleSponsor = async () => {
    if (!address) return;
    
    try {
      await sponsorCandidate(candidate, expirationTimestamp, reason);
    } catch (error) {
      console.error("Failed to sponsor:", error);
    }
  };

  // Reset form on success
  useEffect(() => {
    if (state === "success") {
      txnReset();
      setReason("");
      setExpirationDays(30);
      setDrawerOpen(false);
      onSuccess?.();
    }
  }, [state, txnReset, onSuccess]);

  // Hide sponsor form if candidate has been promoted to a proposal
  const proposalId = candidate.latestVersion.proposalId;
  if (proposalId) {
    return null;
  }

  const formContent = (
    <div className="flex w-full flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <h3 className="heading-6">Sponsor This Candidate</h3>
      </div>

      {!address ? (
        <div className="flex flex-col gap-3 rounded-[12px] border border-semantic-warning bg-yellow-50 p-4">
          <p className="text-sm text-content-secondary">
            Connect your wallet to sponsor this candidate
          </p>
        </div>
      ) : (
        <>
          {/* Threshold Status */}
          {proposerMeetsThreshold && (
            <div className="flex flex-col gap-2 rounded-[12px] border border-semantic-positive bg-green-50 p-4">
              <p className="text-sm font-medium text-content-secondary">
                No sponsored votes needed because {isProposer ? "you have" : "proposer has"} {proposerVoteWeight?.toString() || "0"} votes
              </p>
              <p className="text-xs text-content-secondary">
                This candidate has met the required threshold, but voters can still add support until it's put onchain.
              </p>
            </div>
          )}

          {/* Expiration Days */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="expiration-days">Signature Expiration (days)</Label>
            <Input
              id="expiration-days"
              type="number"
              min="1"
              max="365"
              value={expirationDays}
              onChange={(e) => setExpirationDays(parseInt(e.target.value) || 30)}
              disabled={disabled}
              className="w-full"
            />
            <p className="text-content-secondary paragraph-xs">
              Your signature will expire in {expirationDays} days
            </p>
          </div>

          {/* Reason */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Share why you're sponsoring this candidate..."
              rows={4}
              disabled={disabled}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <TransactionButton
            onClick={handleSponsor}
            disabled={disabled || !voteWeight || voteWeight === 0n}
            className="w-full"
            txnState={state}
          >
            {state === "pending-signature" 
              ? "Signing..." 
              : state === "pending-txn"
              ? "Submitting..."
              : voteWeight && voteWeight > 0n
              ? `Sponsor with ${voteWeight.toString()} token${voteWeight === 1n ? '' : 's'}`
              : "Sign to Sponsor"}
          </TransactionButton>

          {error && (
            <div className="max-h-[50px] w-full overflow-y-auto text-center text-semantic-negative paragraph-sm">
              {error.message}
            </div>
          )}

          {(!voteWeight || voteWeight === 0n) && address && (
            <p className="text-content-secondary paragraph-xs text-center">
              You need voting power to sponsor candidates
            </p>
          )}

          <p className="text-content-secondary paragraph-xs text-center">
            Once a signed proposal is onchain, signers will need to wait until the proposal is queued or defeated before putting another proposal onchain.
          </p>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop - Sticky bottom form */}
      <div className="sticky bottom-0 z-10 hidden w-full max-w-[780px] flex-col items-center gap-2 rounded-t-[20px] bg-background-primary pb-8 pt-4 lg:flex">
        <div className={clsx(
          "flex w-full flex-col overflow-hidden rounded-[20px] bg-background-secondary ring-border-primary ring-2",
          disabled && "pointer-events-none opacity-50",
        )}>
          {formContent}
        </div>
        <div className="flex w-full items-center justify-center gap-1 px-4 text-content-secondary paragraph-sm">
          {address ? (
            <>
              Sponsoring as <EnsName address={address} />
            </>
          ) : (
            "Connect wallet to sponsor"
          )}
        </div>
      </div>

      {/* Mobile - Drawer */}
      <div className="sticky bottom-[84px] z-[2] flex items-center justify-center lg:hidden pwa:bottom-[104px]">
        <Drawer
          repositionInputs={false}
          modal={false}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        >
          <DrawerTrigger asChild>
            <Button
              className="h-[48px] w-fit rounded-full"
              onClick={() => setDrawerOpen(true)}
            >
              Sponsor
            </Button>
          </DrawerTrigger>
          <DrawerContent className="flex-col gap-6 p-6 shadow-fixed-bottom">
            <DrawerTitle className="heading-4">Sponsor Candidate</DrawerTitle>
            {formContent}
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}

