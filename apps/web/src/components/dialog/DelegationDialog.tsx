"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
  DrawerDialogDescription,
} from "../ui/DrawerDialog";
import { Separator } from "../ui/separator";
import { useAccount, useEnsAddress } from "wagmi";
import {
  useWriteNounsNftTokenDelegate,
  useReadNounsNftTokenBalanceOf,
  useReadNounsNftTokenGetCurrentVotes,
  useReadNounsNftTokenDelegates,
} from "@/data/generated/wagmi";
import { isAddress, getAddress } from "viem";
import { EnsAvatar } from "../EnsAvatar";
import { EnsName } from "../EnsName";
import clsx from "clsx";
import Icon from "../ui/Icon";
import { useQuery } from "@tanstack/react-query";
import { getProposalsVotedCount } from "@/data/goldsky/governance/getVotesByVoter";

interface DelegationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillAddress?: string;
}

export default function DelegationDialog({
  open,
  onOpenChange,
  prefillAddress,
}: DelegationDialogProps) {
  const { address: account } = useAccount();

  if (!account) {
    return null;
  }

  return (
    <DrawerDialog open={open} onOpenChange={onOpenChange}>
      <DrawerDialogContent className="md:max-w-[min(95vw,600px)]">
        <DrawerDialogTitle className="sr-only">
          Manage Delegation
        </DrawerDialogTitle>
        <DrawerDialogDescription className="sr-only">
          Delegate your voting power to another address or manage your current delegation.
        </DrawerDialogDescription>
        <DrawerDialogContentInner className="p-0 md:flex-col">
          <div className="flex w-full flex-auto flex-col gap-6 overflow-visible px-6 pb-6 scrollbar-track-transparent md:h-full md:overflow-y-auto md:px-8 md:pt-12">
            <div className="flex flex-col gap-2">
              <h2 className="heading-1">Manage Delegation</h2>
              <p className="paragraph-lg text-content-secondary">
                Delegate your voting power to someone else so they can vote on proposals on your behalf. You can change or revoke delegation anytime.
              </p>
            </div>

            <Separator className="h-[2px]" />

            {/* Current Delegate Section */}
            <CurrentDelegateSection account={account} />

            <Separator className="h-[2px]" />

            {/* Change Delegate Section */}
            <ChangeDelegateSection account={account} prefillAddress={prefillAddress} />
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  );
}

function CurrentDelegateSection({ account }: { account: `0x${string}` }) {
  // Get current delegate
  const { data: currentDelegate } = useReadNounsNftTokenDelegates({
    args: [account],
    query: { enabled: !!account },
  });

  // Get user's token balance
  const { data: tokenBalance } = useReadNounsNftTokenBalanceOf({
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  });

  const availableVotes = tokenBalance ? Number(tokenBalance) : 0;

  // Get delegatee's current votes if delegated
  const { data: delegateeVotes } = useReadNounsNftTokenGetCurrentVotes({
    args: currentDelegate ? [currentDelegate] : undefined,
    query: { enabled: !!currentDelegate && currentDelegate !== account },
  });

  const delegatedVotes = delegateeVotes ? Number(delegateeVotes) : 0;
  const isSelfDelegated = currentDelegate?.toLowerCase() === account.toLowerCase();

  if (!currentDelegate || isSelfDelegated) {
    return (
      <div className="flex flex-col gap-3">
        <h5>Current Delegate</h5>
        <div className="rounded-xl bg-gray-50 border-2 border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200">
              <Icon icon="layers" size={24} className="fill-gray-400" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="label-md font-semibold">Not Delegated</span>
              <span className="text-content-secondary paragraph-sm">
                Your voting power is not currently delegated. You can vote directly on proposals.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h5>Current Delegate</h5>
      <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 p-4">
        <div className="flex items-center gap-3">
          <EnsAvatar address={currentDelegate} size={48} />
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <EnsName address={currentDelegate} className="label-md font-semibold" />
            </div>
            <span className="text-content-secondary paragraph-sm">
              Currently receiving {availableVotes} {availableVotes === 1 ? "vote" : "votes"} from you
            </span>
            {delegatedVotes > 0 && (
              <span className="text-content-secondary paragraph-xs">
                Total voting power: {delegatedVotes} {delegatedVotes === 1 ? "vote" : "votes"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeDelegateSection({ account, prefillAddress }: { account: `0x${string}`; prefillAddress?: string }) {
  const [delegateInput, setDelegateInput] = useState(prefillAddress || "");
  const [resolvedAddress, setResolvedAddress] = useState<`0x${string}` | null>(null);
  
  // Set prefill address when it changes
  useEffect(() => {
    if (prefillAddress) {
      setDelegateInput(prefillAddress);
    }
  }, [prefillAddress]);

  // Check if input is ENS name
  const isEnsName = delegateInput.includes(".") && !isAddress(delegateInput);

  // Resolve ENS name to address
  const { data: ensAddress, isLoading: isResolvingEns } = useEnsAddress({
    name: isEnsName ? delegateInput : undefined,
    query: { enabled: isEnsName && delegateInput.length > 0 },
  });

  // Get resolved address (either direct address or ENS resolved)
  const delegateAddress = useMemo(() => {
    if (isAddress(delegateInput)) {
      return getAddress(delegateInput) as `0x${string}`;
    }
    if (ensAddress) {
      return ensAddress;
    }
    return null;
  }, [delegateInput, ensAddress]);

  // Update resolved address when ENS resolves
  useEffect(() => {
    if (delegateAddress) {
      setResolvedAddress(delegateAddress);
    } else {
      setResolvedAddress(null);
    }
  }, [delegateAddress]);

  // Get user's token balance
  const { data: tokenBalance } = useReadNounsNftTokenBalanceOf({
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  });

  const availableVotes = tokenBalance ? Number(tokenBalance) : 0;

  // Get delegatee's current votes
  const { data: delegateeVotes } = useReadNounsNftTokenGetCurrentVotes({
    args: resolvedAddress ? [resolvedAddress] : undefined,
    query: { enabled: !!resolvedAddress },
  });

  const currentVotes = delegateeVotes ? Number(delegateeVotes) : 0;

  // Get number of proposals voted on (with weight > 0)
  const { data: proposalsVotedCount } = useQuery({
    queryKey: ["proposals-voted-count", resolvedAddress],
    queryFn: async () => {
      if (!resolvedAddress) return 0;
      return await getProposalsVotedCount(resolvedAddress);
    },
    enabled: !!resolvedAddress,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Delegation write hook
  const {
    writeContractAsync,
    isPending,
    isSuccess,
    isError,
    error,
  } = useWriteNounsNftTokenDelegate();

  const handleDelegate = async () => {
    if (!resolvedAddress || !account) return;

    try {
      await writeContractAsync({
        args: [resolvedAddress],
      });
      // Reset input on success
      if (isSuccess) {
        setDelegateInput("");
        setResolvedAddress(null);
      }
    } catch (err) {
      console.error("Delegation error:", err);
    }
  };

  const isValidAddress = resolvedAddress !== null;
  const isSameAsAccount =
    resolvedAddress?.toLowerCase() === account.toLowerCase();
  const canDelegate =
    isValidAddress &&
    !isSameAsAccount &&
    availableVotes > 0 &&
    !isPending &&
    !isSuccess;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h5>Change Delegate</h5>
        <p className="text-content-secondary paragraph-sm">
          Enter an Ethereum address or ENS name to delegate your voting power.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className="label-sm text-content-secondary">
            Delegate to (address or ENS)
          </label>
          <div className="relative">
            <input
              type="text"
              value={delegateInput}
              onChange={(e) => setDelegateInput(e.target.value)}
              placeholder="0x... or vitalik.eth"
              className={clsx(
                "w-full rounded-lg border-2 px-4 py-3 label-md transition-all",
                isResolvingEns && "border-blue-300",
                isValidAddress && !isSameAsAccount && "border-green-300",
                delegateInput.length > 0 && !isValidAddress && "border-red-300",
                isSameAsAccount && "border-yellow-300",
                !delegateInput && "border-gray-200"
              )}
            />
            {isResolvingEns && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            )}
          </div>
          {delegateInput.length > 0 && !isResolvingEns && (
            <div className="text-xs text-content-secondary">
              {!isValidAddress && "Invalid address or ENS name"}
              {isSameAsAccount && "You're already delegating to yourself"}
              {isValidAddress && !isSameAsAccount && resolvedAddress && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <EnsAvatar address={resolvedAddress} size={16} />
                    <EnsName address={resolvedAddress} />
                    <span className="text-content-secondary">
                      {currentVotes > 0
                        ? `Already has ${currentVotes} vote${currentVotes !== 1 ? "s" : ""}`
                        : "Has 0 votes"}
                    </span>
                  </div>
                  {proposalsVotedCount !== undefined && proposalsVotedCount > 0 && (
                    <span className="text-content-secondary text-xs ml-7">
                      Voted on {proposalsVotedCount} proposal{proposalsVotedCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {availableVotes > 0 && (
          <Button
            onClick={handleDelegate}
            disabled={!canDelegate}
            variant={canDelegate ? "primary" : "ghost"}
            className="w-full"
          >
            {isPending && "Delegating..."}
            {isSuccess && "✓ Delegated!"}
            {isError && "Delegation Failed"}
            {!isPending && !isSuccess && !isError && (
              <>Delegate {availableVotes} {availableVotes === 1 ? "Vote" : "Votes"}</>
            )}
          </Button>
        )}

        {availableVotes === 0 && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-xs text-yellow-800">
              You don't have any tokens to delegate. Once you own a Lil Noun, you
              can delegate your voting power.
            </p>
          </div>
        )}

        {isSuccess && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3">
            <p className="text-xs text-green-800">
              ✓ Successfully delegated {availableVotes}{" "}
              {availableVotes === 1 ? "vote" : "votes"}!
            </p>
          </div>
        )}

        {isError && error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-xs text-red-800">
              Delegation failed: {error.message || "Unknown error"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

