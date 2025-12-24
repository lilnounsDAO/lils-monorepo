"use client";
import { CHAIN_CONFIG } from "@/config";
import { FeedbackPost } from "@/data/goldsky/governance/ideaTypes";
import { EnsAvatar } from "../EnsAvatar";
import { EnsName } from "../EnsName";
import clsx from "clsx";
import { getAddress } from "viem";
import { LinkExternal } from "../ui/link";
import MarkdownRenderer from "../MarkdownRenderer";
import { formatTimeLeft } from "@/utils/format";
import { useCandidateFeedbackContext } from "./CandidateFeedbackProvider";
import ExpandableContent from "../ExpandableContent";

interface CandidateFeedbackItemProps {
  feedback: FeedbackPost;
  candidateCanceled: boolean;
  isRevote?: boolean;
}

export default function CandidateFeedbackItem({
  feedback,
  candidateCanceled,
  isRevote = false,
}: CandidateFeedbackItemProps) {
  const timestamp = Math.floor(Date.now() / 1000);
  const timeDelta = Math.max(timestamp - feedback.createdTimestamp, 0);

  const { addReply, addRevote } = useCandidateFeedbackContext();

  const getSupportLabel = () => {
    switch (feedback.support) {
      case 0: return "Against";
      case 1: return "For";
      case 2: return "Comment";
      default: return "";
    }
  };

  const getSupportColor = () => {
    switch (feedback.support) {
      case 0: return "text-semantic-negative";
      case 1: return "text-semantic-positive";
      case 2: return "text-content-secondary";
      default: return "text-content-secondary";
    }
  };

  return (
    <div className="flex gap-4">
      <EnsAvatar
        address={getAddress(feedback.voterAddress)}
        size={40}
        className="mt-1"
      />

      <div className="flex w-full min-w-0 flex-col justify-center gap-1 paragraph-sm">
        <div className="flex w-full items-center gap-2">
          <div className={clsx("inline whitespace-pre-wrap label-md", getSupportColor())}>
            <LinkExternal
              href={
                CHAIN_CONFIG.publicClient.chain?.blockExplorers?.default.url +
                "/address/" +
                feedback.voterAddress
              }
              className="inline *:inline hover:underline"
            >
              <EnsName
                address={getAddress(feedback.voterAddress)}
                className="inline text-content-primary *:inline"
              />
            </LinkExternal>{" "}
            {isRevote 
              ? `voted ${getSupportLabel().toLowerCase()} (${feedback.votes})`
              : feedback.support === 2 
              ? `commented (${feedback.votes} votes)`
              : `commented ${getSupportLabel().toLowerCase()} (${feedback.votes} votes)`}
          </div>
        </div>

        {feedback.voteReplies?.map(({ replyVote, reply }, i) =>
          replyVote ? (
            <ReplyDisplay
              voterAddress={replyVote.voter.id}
              reason={replyVote.reason ?? ""}
              support={replyVote.support ?? feedback.support}
              reply={reply}
              key={i}
            />
          ) : null,
        )}

        <ExpandableContent maxCollapsedHeight={80}>
          <MarkdownRenderer>{feedback.reason ?? ""}</MarkdownRenderer>
        </ExpandableContent>

        <div className="flex items-center gap-6 paragraph-sm">
          <span className="text-content-secondary">
            {formatTimeLeft(timeDelta, true)}
          </span>
          <div
            className={clsx(
              "flex items-center gap-6",
              (!feedback.reason ||
                feedback.reason == "" ||
                candidateCanceled) &&
                "hidden",
            )}
          >
            <button onClick={() => addReply(feedback)} className="hover:underline">
              Reply
            </button>
            <button onClick={() => addRevote(feedback)} className="hover:underline">
              Revote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function ReplyDisplay({
  voterAddress,
  reason,
  support,
  reply,
}: {
  voterAddress: string;
  reason: string;
  support: number;
  reply: string;
}) {
  const getSupportLabel = () => {
    switch (support) {
      case 0: return "against";
      case 1: return "for";
      case 2: return "";
      default: return "";
    }
  };

  const getSupportColor = () => {
    switch (support) {
      case 0: return "text-semantic-negative";
      case 1: return "text-semantic-positive";
      case 2: return "text-content-secondary";
      default: return "text-content-secondary";
    }
  };

  return (
    <div className="flex gap-4 mt-3">
      {/* Indentation line */}
      <div className="relative w-[20px] shrink-0">
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-border-primary"></div>
      </div>
      
      <div className="flex gap-4 flex-1">
        <EnsAvatar
          address={getAddress(voterAddress)}
          size={40}
          className="mt-1"
        />

        <div className="flex w-full min-w-0 flex-col justify-center gap-1 paragraph-sm">
          <div className="flex w-full items-center gap-2">
            <div className={clsx("inline whitespace-pre-wrap label-md", getSupportColor())}>
              <LinkExternal
                href={
                  CHAIN_CONFIG.publicClient.chain?.blockExplorers?.default.url +
                  "/address/" +
                  voterAddress
                }
                className="inline *:inline hover:underline"
              >
                <EnsName
                  address={getAddress(voterAddress)}
                  className="inline text-content-primary *:inline"
                />
              </LinkExternal>{" "}
              {support !== 2 && (
                <>
                  ({getSupportLabel()})
                </>
              )}
            </div>
          </div>

          {reason && (
            <div className="flex w-full min-w-0 flex-col gap-1 overflow-hidden rounded-[12px] border px-3 py-2 mt-1">
              <ExpandableContent maxCollapsedHeight={40}>
                <MarkdownRenderer>{reason}</MarkdownRenderer>
              </ExpandableContent>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <div className="relative w-[20px] shrink-0">
              <div className="absolute right-0 top-0 h-[19px] w-[7px] rounded-bl-[12px] border-b border-l border-border-primary"></div>
            </div>
            <div className="pt-2 flex-1">
              <ExpandableContent maxCollapsedHeight={40}>
                <MarkdownRenderer>{reply}</MarkdownRenderer>
              </ExpandableContent>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

