"use client";
import AutoresizingTextArea from "@/components/AutoresizingTextarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import clsx from "clsx";
import { useCreateVoteContext } from "./CreateVoteProvider";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "../../ui/drawer";
import { useCastRefundableVote } from "@/hooks/transactions/useCastRefundableVote";
import TransactionButton from "@/components/TransactionButton";
import { DetailedProposal, ProposalVote } from "@/data/goldsky/governance/common";
import { TransactionState } from "@/hooks/transactions/types";
import { EnsAvatar } from "@/components/EnsAvatar";
import { EnsName } from "@/components/EnsName";
import { getAddress, zeroAddress } from "viem";
import { X } from "lucide-react";
import { VoteValue } from "@/data/generated/ponder/graphql";
import { HTMLAttributes, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useReadNounsNftTokenGetPriorVotes } from "@/data/generated/wagmi";
import { useScreenSize } from "@/hooks/useScreenSize";

const formSchema = z.object({
  reason: z.string().optional(),
  vote: z.string().optional(), // Make vote optional to allow commenting without voting
  replies: z.array(z.string().nonempty("Reply cannot be empty.")),
});

function encodeRevote(vote: ProposalVote): string {
  if (!vote.reason) {
    return "";
  } else {
    return `\n\n+1\n\n${vote.reason.replace(/^/gm, "> ")}\n\n`;
  }
}

function encodeReply(vote: ProposalVote, reply: string): string {
  // Use full address for deterministic linking in the subgraph
  return `\n\n@${vote.voterAddress}\n\n${reply}\n${(vote.reason ?? "").replace(/^/gm, "> ")}\n\n`;
}

export function CreateVote({ proposal }: { proposal: DetailedProposal }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      vote: "",
      replies: [],
    },
  });

  const { replies: replyVotes, revotes } = useCreateVoteContext();
  const {
    castRefundableVote,
    error,
    state,
    reset: txnReset,
  } = useCastRefundableVote();
  const screenSize = useScreenSize();

  function onSubmit({ vote, reason, replies }: z.infer<typeof formSchema>) {
    const encodedRevotes = revotes.map(encodeRevote).join("\n");
    const encodedReplies = replyVotes
      .map((vote, i) => encodeReply(vote, replies[i]))
      .join("\n");

    const encodedReason = encodedRevotes + encodedReplies + (reason || "");
    // Default to abstain if no vote selected (allows commenting without explicit vote preference)
    const voteValue = vote || "abstain";
    castRefundableVote(proposal.id, voteValue as any, encodedReason);
  }

  useEffect(() => {
    const shouldOpen =
      (replyVotes.length > 0 || revotes.length > 0) && screenSize === "sm";
    if (shouldOpen) {
      setDrawerOpen(true);
    }
  }, [revotes, replyVotes, screenSize]);

  return (
    <>
      {/* Desktop */}
      <div className="sticky bottom-0 z-10 hidden w-full max-w-[780px] flex-col items-center gap-2 rounded-t-[20px] bg-background-primary pb-8 lg:flex">
        <CreateVoteForm
          proposal={proposal}
          form={form}
          onSubmit={onSubmit}
          txnState={state}
          txnErrorMsg={error?.message}
          txnReset={txnReset}
        />
        <VotingAs />
      </div>

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
              Vote
            </Button>
          </DrawerTrigger>
          <DrawerContent className="flex-col gap-6 p-6 shadow-fixed-bottom">
            <DrawerTitle className="heading-4">Vote</DrawerTitle>
            <div className="flex flex-col gap-2">
              <CreateVoteForm
                proposal={proposal}
                form={form}
                onSubmit={onSubmit}
                txnState={state}
                txnErrorMsg={error?.message}
                txnReset={txnReset}
              />
              <VotingAs />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}

function VotingAs() {
  const { address } = useAccount();
  return (
    <div className="flex w-full items-center justify-center gap-1 text-content-secondary paragraph-sm">
      {address ? (
        <>
          Voting as <EnsName address={address} />
        </>
      ) : (
        "Connect wallet to vote"
      )}
    </div>
  );
}

function CreateVoteForm({
  proposal,
  form,
  onSubmit,
  txnState,
  txnErrorMsg,
  txnReset,
}: {
  proposal: DetailedProposal;
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
  onSubmit: (params: z.infer<typeof formSchema>) => void;
  txnState: TransactionState;
  txnErrorMsg?: string;
  txnReset: () => void;
}) {
  const {
    replies,
    revotes,
    removeRevote,
    removeReply,
    clearReplies,
    clearRevotes,
  } = useCreateVoteContext();

  function handleRemoveReply(
    reply: NonNullable<(typeof replies)[0]>,
    index: number,
  ) {
    removeReply(reply);

    // Update form state to match the new replies array
    const currentReplies = form.getValues("replies");
    currentReplies.splice(index, 1);
    form.setValue("replies", currentReplies);
    form.trigger("replies");
  }

  // Add entry to replies array and trigger validation
  useEffect(() => {
    const currentReplies = form.getValues("replies");

    if (replies.length > currentReplies.length) {
      const newReplies = replies.slice(currentReplies.length).map(() => "");
      form.setValue("replies", [...currentReplies, ...newReplies]);
    }
    form.trigger("replies");
  }, [replies, form]);

  const { address } = useAccount();
  const { data: voteWeight } = useReadNounsNftTokenGetPriorVotes({
    args: [address ?? zeroAddress, BigInt(proposal.creationBlock)],
  });

  // Disable during submission
  const disabled = useMemo(() => {
    return txnState === "pending-signature" || txnState === "pending-txn";
  }, [txnState]);

  // Reset things on success
  useEffect(() => {
    if (txnState == "success") {
      txnReset();
      clearReplies();
      clearRevotes();
      form.reset({
        reason: "",
        vote: undefined,
        replies: [],
      });
    }
  }, [txnState, clearReplies, clearRevotes, form, txnReset]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={clsx(
          "flex w-full flex-col overflow-hidden rounded-[20px] bg-background-secondary ring-border-primary focus-within:ring-2",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <fieldset disabled={disabled} style={{ all: "unset" }}>
          <div className="flex w-full flex-col gap-2">
            <div className="flex max-h-[30dvh] w-full flex-col gap-2 overflow-y-auto overflow-x-hidden px-4 pt-4">
              {revotes.map((revote, i) => (
                <RevoteCard
                  revote={revote}
                  key={i}
                  onClick={() => removeRevote(revote)}
                />
              ))}

              {replies.map((reply, i) => (
                <div className="flex min-w-0 flex-col" key={i}>
                  <RevoteCard
                    revote={reply}
                    key={i}
                    onClick={() => handleRemoveReply(reply, i)}
                  />
                  <div className="flex gap-2">
                    <div className="relative w-[20px] shrink-0">
                      <div className="absolute right-0 top-0 h-[19px] w-[7px] rounded-bl-[12px] border-b border-l" />
                    </div>
                    <FormField
                      key={i}
                      control={form.control}
                      name={`replies.${i}`}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <div className="relative">
                              <AutoresizingTextArea
                                placeholder={`Reply...`}
                                className="pt-2"
                                {...field}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AutoresizingTextArea
                        placeholder="I believe that .... (optional)"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col items-end gap-1 px-4 pb-4">
              <div className="flex items-center justify-end gap-4">
                <FormField
                  control={form.control}
                  name="vote"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                        >
                          <SelectTrigger
                            className={clsx(
                              "h-8 w-[150px] rounded-full border",
                              {
                                "border-semantic-positive bg-semantic-positive fill-white text-white":
                                  field.value == "for",
                                "border-semantic-negative bg-semantic-negative fill-white text-white":
                                  field.value == "against",
                              },
                            )}
                          >
                            <SelectValue placeholder="Select vote" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={"abstain"}>
                              Abstain
                              {address &&
                                voteWeight != undefined &&
                                ` (${voteWeight})`}
                            </SelectItem>
                            <SelectItem value={"for"}>
                              For
                              {address &&
                                voteWeight != undefined &&
                                ` (${voteWeight})`}
                            </SelectItem>
                            <SelectItem value={"against"}>
                              Against
                              {address &&
                                voteWeight != undefined &&
                                ` (${voteWeight})`}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <TransactionButton
                  type="submit"
                  className="h-8 w-fit rounded-full px-5 py-1.5"
                  disabled={!form.formState.isValid || !form.watch("vote")}
                  txnState={txnState}
                >
                  {form.watch("vote") ? "Vote" : "Select vote"}
                </TransactionButton>
              </div>

              {txnErrorMsg && (
                <div className="max-h-[50px] w-full overflow-y-auto text-center text-semantic-negative paragraph-sm">
                  {txnErrorMsg}
                </div>
              )}
            </div>
          </div>
        </fieldset>
      </form>
    </Form>
  );
}

function RevoteCard({
  revote,
  ...props
}: { revote: ProposalVote } & HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex w-full items-center justify-between gap-1 rounded-[12px] bg-background-primary px-3 py-2 transition-colors label-sm hover:bg-background-primary/70"
      {...props}
    >
      <div className="flex min-w-0 items-center gap-1">
        <EnsAvatar address={getAddress(revote.voterAddress)} size={20} />
        <EnsName address={getAddress(revote.voterAddress)} />
        <div
          className={clsx({
            "text-semantic-positive": revote.supportDetailed === 1,
            "text-semantic-negative": revote.supportDetailed === 0,
          })}
        >
          ({revote.supportDetailed === 1 ? 'for' : revote.supportDetailed === 0 ? 'against' : 'abstain'})
        </div>
        <div className="overflow-hidden text-ellipsis whitespace-nowrap paragraph-sm">
          {revote.reason ?? ""}
        </div>
      </div>
      <X
        size={20}
        className="shrink-0 self-end justify-self-end stroke-content-secondary"
      />
    </button>
  );
}
