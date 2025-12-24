"use client";
import { CHAIN_CONFIG } from "@/config";
import { VoteValue } from "@/data/generated/ponder/graphql";
import { ProposalVote as ProposalVoteType } from "@/data/goldsky/governance/common";
import { EnsAvatar } from "../EnsAvatar";
import { EnsName } from "../EnsName";
import clsx from "clsx";
import { getAddress } from "viem";
import { LinkExternal } from "../ui/link";
import MarkdownRenderer from "../MarkdownRenderer";
import { formatTimeLeft } from "@/utils/format";
import { useCreateVoteContext } from "./CreateVote/CreateVoteProvider";
import { ProposalState } from "@/data/goldsky/governance/common";
import ExpandableContent from "../ExpandableContent";
import { Ellipsis } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface ProposalVoteProps {
  vote: ProposalVoteType;
  proposalState: ProposalState;
}

export default function ProposalVote({
  vote,
  proposalState,
}: ProposalVoteProps) {
  const supportToValue = (support?: number | null): VoteValue => {
    if (support === 1) return VoteValue.For;
    if (support === 0) return VoteValue.Against;
    return VoteValue.Abstain;
  };

  const timestamp = Math.floor(Date.now() / 1000);
  const timeDelta = Math.max(timestamp - Number(vote.timestamp), 0);

  const { addReply, addRevote } = useCreateVoteContext();

  const voteValue = vote.supportDetailed === 0 ? VoteValue.Against : vote.supportDetailed === 1 ? VoteValue.For : VoteValue.Abstain;

  return (
    <div className="flex gap-4">
      <EnsAvatar
        address={getAddress(vote.voterAddress)}
        size={40}
        className="mt-1"
      />

      <div className="flex w-full min-w-0 flex-col justify-center gap-1 paragraph-sm">
        <div className="flex w-full items-center justify-between gap-2">
          <div
            className={clsx("inline whitespace-pre-wrap label-md", {
              "text-semantic-positive": voteValue === VoteValue.For,
              "text-semantic-negative": voteValue === VoteValue.Against,
              "text-content-secondary": voteValue === VoteValue.Abstain,
            })}
          >
            <LinkExternal
              href={
                CHAIN_CONFIG.publicClient.chain?.blockExplorers?.default.url +
                "/address/" +
                vote.voterAddress
              }
              className="inline *:inline hover:underline"
            >
              <EnsName
                address={getAddress(vote.voterAddress)}
                className="inline text-content-primary *:inline"
              />
            </LinkExternal>{" "}
            voted {voteValue.toLowerCase()} ({vote.weight})
          </div>
          <Popover>
            <PopoverTrigger className="flex h-full justify-start pt-0.5">
              <Ellipsis size={20} className="stroke-content-secondary" />
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="flex flex-col overflow-hidden bg-background-secondary p-0 text-content-primary"
            >
              <LinkExternal
                href={
                  CHAIN_CONFIG.publicClient.chain?.blockExplorers?.default.url +
                  "/tx/" +
                  vote.transactionHash
                }
                className="bg-background-secondary p-2 transition-all"
              >
                Etherscan
              </LinkExternal>
            </PopoverContent>
          </Popover>
        </div>

        {vote.voteRevotes?.map(({ revote }, i) =>
          revote ? (
            <Revote
              revoteVoterAddress={revote.voter.id}
              revoteReason={revote.reason ?? ""}
              revoteValue={supportToValue(revote.supportDetailed)}
              key={i}
            />
          ) : null,
        )}

        {vote.voteReplies?.map(({ replyVote, reply }, i) =>
          replyVote ? (
            <Reply
              voterAddress={replyVote.voter.id}
              reason={replyVote.reason ?? ""}
              value={supportToValue(replyVote.supportDetailed)}
              reply={reply}
              key={i}
            />
          ) : null,
        )}

        <ExpandableContent maxCollapsedHeight={80}>
          <MarkdownRenderer>{vote.reason ?? ""}</MarkdownRenderer>
        </ExpandableContent>

        <div className="flex items-center gap-6 paragraph-sm">
          <span className="text-content-secondary">
            {formatTimeLeft(timeDelta, true)}
          </span>
          <div
            className={clsx(
              "flex items-center gap-6",
              (!vote.reason ||
                vote.reason == "" ||
                proposalState != "active") &&
                "hidden",
            )}
          >
            <button onClick={() => addReply(vote)} className="hover:underline">
              Reply
            </button>
            <button onClick={() => addRevote(vote)} className="hover:underline">
              Revote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Revote({
  revoteVoterAddress,
  revoteReason,
  revoteValue,
}: {
  revoteVoterAddress: string;
  revoteReason: string;
  revoteValue: VoteValue;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1 overflow-hidden rounded-[12px] border px-3 py-2">
      <div className="flex gap-1">
        <EnsAvatar address={getAddress(revoteVoterAddress)} size={20} />
        <EnsName address={getAddress(revoteVoterAddress)} />
        <span
          className={clsx({
            "text-semantic-positive": revoteValue === VoteValue.For,
            "text-semantic-negative": revoteValue === VoteValue.Against,
            "text-content-secondary": revoteValue === VoteValue.Abstain,
          })}
        >
          ({revoteValue.toLowerCase()})
        </span>
      </div>

      <ExpandableContent maxCollapsedHeight={40}>
        <MarkdownRenderer>{revoteReason}</MarkdownRenderer>
      </ExpandableContent>
    </div>
  );
}

function Reply({
  voterAddress,
  reason,
  value,
  reply,
}: {
  voterAddress: string;
  reason: string;
  value: VoteValue;
  reply: string;
}) {
  return (
    <div>
      <Revote
        revoteVoterAddress={voterAddress}
        revoteReason={reason}
        revoteValue={value}
      />
      <div className="flex gap-2">
        <div className="relative w-[20px] shrink-0">
          <div className="absolute right-0 top-0 h-[19px] w-[7px] rounded-bl-[12px] border-b border-l"></div>
        </div>
        <div className="pt-2">
          <ExpandableContent maxCollapsedHeight={40}>
            <MarkdownRenderer>{reply}</MarkdownRenderer>
          </ExpandableContent>
        </div>
      </div>
    </div>
  );
}
