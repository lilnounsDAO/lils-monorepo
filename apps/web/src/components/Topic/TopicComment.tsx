import { FeedbackPost } from "@/data/goldsky/governance/ideaTypes";
import { EnsAvatar } from "../EnsAvatar";
import { EnsName } from "../EnsName";
import { getAddress } from "viem";
import { formatTimeLeft } from "@/utils/format";
import clsx from "clsx";
import { CHAIN_CONFIG } from "@/config";
import { LinkExternal } from "@/components/ui/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ExpandableContent from "@/components/ExpandableContent";

interface CandidateCommentProps {
  comment: FeedbackPost;
}

export default function CandidateComment({ comment }: CandidateCommentProps) {
  const timestamp = Math.floor(Date.now() / 1000);
  const timeDelta = Math.max(timestamp - comment.createdTimestamp, 0);
  const timeAgo = formatTimeLeft(timeDelta, true);

  const getSupportLabel = () => {
    switch (comment.support) {
      case 0: return "Against";
      case 1: return "For";
      case 2: return "Abstain";
      default: return "";
    }
  };

  const getSupportColor = () => {
    switch (comment.support) {
      case 0: return "text-semantic-negative";
      case 1: return "text-semantic-positive";
      case 2: return "text-content-secondary";
      default: return "text-content-secondary";
    }
  };

  return (
    <div className="flex gap-4">
      <EnsAvatar
        address={getAddress(comment.voterAddress)}
        size={40}
        className="mt-1"
      />

      <div className="flex w-full min-w-0 flex-col justify-center gap-1 paragraph-sm">
        <div className="flex w-full items-center gap-2">
          <div className={clsx("inline whitespace-pre-wrap label-md", getSupportColor())}>
            <span className="font-medium">
              <LinkExternal
                href={
                  CHAIN_CONFIG.publicClient.chain?.blockExplorers?.default.url +
                  "/address/" +
                  comment.voterAddress
                }
                className="inline *:inline hover:underline"
              >
                <EnsName
                  address={getAddress(comment.voterAddress)}
                  className="inline text-content-primary *:inline"
                />
              </LinkExternal>
            </span>{" "}
            commented{" "}
            <span className={clsx("font-medium", getSupportColor())}>
              {getSupportLabel()}
            </span>
            {comment.votes > 0 && (
              <span className="text-content-secondary">
                {" "}({comment.votes} votes)
              </span>
            )}
          </div>
        </div>

        <ExpandableContent maxCollapsedHeight={80}>
          <MarkdownRenderer>{comment.reason ?? ""}</MarkdownRenderer>
        </ExpandableContent>

        <div className="flex items-center gap-6 paragraph-sm">
          <span className="text-content-secondary">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

