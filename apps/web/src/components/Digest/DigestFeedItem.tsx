import { Link } from "react-router-dom";
import clsx from "clsx";
import { MessageCircle, Repeat2 } from "lucide-react";
import { Address, formatEther } from "viem";
import { truncate } from "lodash";
import { EnsAvatar } from "@/components/EnsAvatar";
import { EnsName } from "@/components/EnsName";
import { NounImage } from "@/components/NounImage";
import { formatTimeLeft } from "@/utils/format";
import {
  DigestEvent,
  DigestEventKind,
  DigestQuote,
} from "@/data/goldsky/governance/getDigestFeed";

type EventFamily = "event-action" | "individual-action" | "event-update";

function familyOf(kind: DigestEventKind): EventFamily {
  switch (kind) {
    case "voting-started":
    case "closing-soon":
    case "proposal-concluded":
      return "event-action";
    case "proposal-created":
    case "candidate-created":
    case "candidate-updated":
    case "topic-created":
      return "event-update";
    default:
      return "individual-action";
  }
}

function formatRelative(timestamp: number): string {
  const delta = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
  if (delta < 45) return "now";
  return formatTimeLeft(delta, true).trim();
}

function formatEth(amountWei: string): string {
  const value = Number(formatEther(BigInt(amountWei)));
  if (!Number.isFinite(value) || value === 0) return "0 ETH";
  if (value < 0.0001) {
    return `${value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "")} ETH`;
  }
  return `${value.toFixed(4).replace(/\.?0+$/, "")} ETH`;
}

function supportCopy(support?: number): { label: string; className: string } {
  if (support === 0) {
    return { label: "against", className: "text-semantic-negative" };
  }
  if (support === 2) {
    return { label: "abstain", className: "text-content-secondary" };
  }
  return { label: "for", className: "text-semantic-positive" };
}

function conclusionCopy(event: DigestEvent): {
  label: string;
  className: string;
} {
  switch (event.conclusion) {
    case "defeated":
      return { label: "defeated", className: "text-semantic-negative" };
    case "canceled":
      return { label: "canceled", className: "text-semantic-negative" };
    case "vetoed":
      return { label: "vetoed", className: "text-semantic-warning" };
    case "executed":
      return { label: "executed", className: "text-semantic-positive" };
    case "queued":
      return {
        label: "queued for execution",
        className: "text-semantic-positive",
      };
    default:
      return { label: "passed", className: "text-semantic-positive" };
  }
}

function Person({ address }: { address: Address }) {
  return <EnsName address={address} className="font-medium" />;
}

function PersonWithAvatar({ address }: { address: Address }) {
  return (
    <span className="inline-flex items-center gap-1 align-[-2px]">
      <EnsAvatar address={address} size={16} />
      <EnsName address={address} className="font-medium" />
    </span>
  );
}

function NounChip({ ids }: { ids?: string[] }) {
  if (!ids?.length) return <span>a lil noun</span>;
  if (ids.length > 1) return <span>{ids.length} lil nouns</span>;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap align-[-3px]">
      <NounImage
        nounId={ids[0]}
        width={18}
        height={18}
        className="h-[18px] w-[18px] rounded-[3px]"
      />
      <span>Lil Noun {ids[0]}</span>
    </span>
  );
}

function Recipients({ event }: { event: DigestEvent }) {
  const list = event.counterparts?.length
    ? event.counterparts
    : event.counterpart
      ? [event.counterpart]
      : [];
  if (!list.length) return null;
  const [first, second] = list;
  return (
    <>
      {" "}
      to <PersonWithAvatar address={first} />
      {list.length === 2 && second && (
        <>
          {" "}
          and <PersonWithAvatar address={second} />
        </>
      )}
      {list.length > 2 && <> and {list.length - 1} others</>}
    </>
  );
}

// A quoted earlier vote, nouns.camp style: who said it, how they voted, what.
function QuoteCard({ item }: { item: DigestQuote }) {
  const support =
    item.targetSupport !== undefined ? supportCopy(item.targetSupport) : null;
  return (
    <div className="mt-1.5 rounded-[10px] border border-gray-200 px-3 py-2 text-sm leading-5">
      <span className="inline-flex items-center gap-1 align-[-3px] font-bold">
        {item.target ? (
          <>
            <EnsAvatar address={item.target} size={16} />
            <EnsName address={item.target} />
          </>
        ) : (
          <span>{item.handle ?? "An earlier vote"}</span>
        )}
      </span>
      {support && (
        <span className={clsx("font-bold", support.className)}>
          {" "}
          ({support.label})
        </span>
      )}
      :{" "}
      <span className="whitespace-pre-line">
        {truncate(item.quote, { length: 280 })}
      </span>
    </div>
  );
}

function ReasonBody({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="mt-1 whitespace-pre-line break-words text-content-primary">
      {text}
    </p>
  );
}

// Body under a vote/feedback: the voter's own words, revotes and replies.
export function VoteBody({
  event,
}: {
  event: Pick<DigestEvent, "reason" | "replies" | "revotes">;
}) {
  return (
    <>
      {event.revotes?.map((item, i) => (
        <QuoteCard key={`revote-${i}`} item={item} />
      ))}
      {event.replies?.map((item, i) => (
        <div key={`reply-${i}`}>
          <ReasonBody text={item.body} />
          <QuoteCard item={item} />
        </div>
      ))}
      <ReasonBody text={event.reason} />
    </>
  );
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// Reply / revote open the proposal's vote form with this vote attached.
function VoteActions({ event }: { event: DigestEvent }) {
  if (event.kind !== "vote" || !event.proposalId || !event.reason) return null;
  const canRespond = event.votingOpen === true;
  const voteId = event.id.replace(/^vote-/, "");
  const base = `/vote/${event.proposalId}`;
  const counts = [
    event.repostCount ? plural(event.repostCount, "repost") : null,
    event.replyCount
      ? plural(event.replyCount, "reply").replace("replys", "replies")
      : null,
  ].filter(Boolean);
  if (!canRespond && counts.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {canRespond && (
        <div className="flex items-center gap-4 text-content-secondary">
          <Link
            to={`${base}?reply=${voteId}`}
            aria-label="Reply"
            className="hover:text-content-primary"
          >
            <MessageCircle size={18} />
          </Link>
          <Link
            to={`${base}?revote=${voteId}`}
            aria-label="Revote"
            className="hover:text-content-primary"
          >
            <Repeat2 size={18} />
          </Link>
        </div>
      )}
      {counts.length > 0 && (
        <p className="text-sm text-content-secondary">{counts.join(" · ")}</p>
      )}
    </div>
  );
}

function Title({ event }: { event: DigestEvent }) {
  return (
    <>
      {truncate(
        event.proposalTitle || event.candidateTitle || event.topicTitle || "",
        { length: 72 },
      )}
    </>
  );
}

function EventSentence({ event }: { event: DigestEvent }) {
  switch (event.kind) {
    case "voting-started":
      return (
        <>
          Voting for Proposal {event.proposalId}: <Title event={event} />{" "}
          started
        </>
      );
    case "closing-soon":
      return (
        <>
          Voting for Proposal {event.proposalId}: <Title event={event} /> closes
          soon
        </>
      );
    case "proposal-concluded": {
      const conclusion = conclusionCopy(event);
      return (
        <>
          Proposal {event.proposalId}: <Title event={event} />{" "}
          <span className={conclusion.className}>{conclusion.label}</span>
        </>
      );
    }
    case "proposal-created":
      return (
        <>
          Proposal {event.proposalId}: <Title event={event} /> created
          {event.actor && (
            <>
              {" "}
              by <Person address={event.actor} />
            </>
          )}
        </>
      );
    case "candidate-created":
      return (
        <>
          Candidate <Title event={event} /> created
          {event.actor && (
            <>
              {" "}
              by <Person address={event.actor} />
            </>
          )}
        </>
      );
    case "candidate-updated":
      return (
        <>
          Candidate <Title event={event} /> updated
          {event.actor && (
            <>
              {" "}
              by <Person address={event.actor} />
            </>
          )}
        </>
      );
    case "topic-created":
      return (
        <>
          Topic <Title event={event} /> created
          {event.actor && (
            <>
              {" "}
              by <Person address={event.actor} />
            </>
          )}
        </>
      );
    case "vote": {
      const support = supportCopy(event.support);
      const verb = event.support === 2 ? "abstained" : `voted ${support.label}`;
      return (
        <>
          {event.actor && <Person address={event.actor} />}{" "}
          <span className={clsx("font-bold", support.className)}>
            {verb}
            {event.voteWeight ? ` (${event.voteWeight})` : ""}
          </span>{" "}
          <span className="font-bold text-content-secondary">
            {event.proposalId}: <Title event={event} />
          </span>
        </>
      );
    }
    case "proposal-feedback": {
      const support = supportCopy(event.support);
      return (
        <>
          {event.actor && <Person address={event.actor} />}{" "}
          <span className="text-content-secondary">signaled</span>{" "}
          <span className={clsx("font-bold", support.className)}>
            {support.label}
          </span>{" "}
          <span className="font-bold text-content-secondary">
            {event.proposalId}: <Title event={event} />
          </span>
        </>
      );
    }
    case "candidate-feedback": {
      const support = supportCopy(event.support);
      return (
        <>
          {event.actor && <Person address={event.actor} />} commented{" "}
          <span className={support.className}>{support.label}</span> on
          Candidate <Title event={event} />
        </>
      );
    }
    case "topic-feedback": {
      const support = supportCopy(event.support);
      return (
        <>
          {event.actor && <Person address={event.actor} />} commented{" "}
          <span className={support.className}>{support.label}</span> on Topic{" "}
          <Title event={event} />
        </>
      );
    }
    case "sale":
      return (
        <>
          {event.actor && <Person address={event.actor} />}{" "}
          {event.counterpart ? "sold" : "bought"}{" "}
          <NounChip ids={event.nounIds} />
          <Recipients event={event} />
          {event.amountWei ? ` for ${formatEth(event.amountWei)}` : ""}
        </>
      );
    case "mint":
      return (
        <>
          <NounChip ids={event.nounIds} /> minted
          {event.actor && (
            <>
              {" "}
              to <PersonWithAvatar address={event.actor} />
            </>
          )}
        </>
      );
    case "transfer":
      return (
        <>
          {event.actor && <Person address={event.actor} />} transferred{" "}
          <NounChip ids={event.nounIds} />
          <Recipients event={event} />
        </>
      );
    case "delegate":
      return (
        <>
          {event.actor && <Person address={event.actor} />}{" "}
          {event.undelegated ? (
            <>
              stopped delegating <NounChip ids={event.nounIds} />
              <Recipients event={event} />
            </>
          ) : (
            <>
              delegated <NounChip ids={event.nounIds} />
              <Recipients event={event} />
            </>
          )}
        </>
      );
    default:
      return null;
  }
}

function Lead({ event }: { event: DigestEvent }) {
  const family = familyOf(event.kind);
  if (family === "individual-action" && event.actor) {
    return <EnsAvatar address={event.actor} size={18} />;
  }
  return (
    <span
      aria-hidden
      className="mt-[7px] block h-1.5 w-1.5 rounded-full bg-content-secondary"
    />
  );
}

const ONE_LINE_KINDS: DigestEventKind[] = ["vote", "proposal-feedback"];
const BODY_KINDS: DigestEventKind[] = [
  "vote",
  "proposal-feedback",
  "candidate-feedback",
  "topic-feedback",
];

export default function DigestFeedItem({ event }: { event: DigestEvent }) {
  const oneLine = ONE_LINE_KINDS.includes(event.kind);
  const time = (
    <span className="text-content-secondary">
      {" "}
      · {formatRelative(event.timestamp)}
    </span>
  );
  return (
    <div className="flex w-full items-start gap-2.5 py-2.5 text-[15px] leading-[22px] text-content-primary">
      <span className="flex h-[22px] w-[18px] shrink-0 items-center justify-center">
        <Lead event={event} />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          to={event.href}
          className="flex min-w-0 items-baseline transition-opacity hover:opacity-70"
        >
          {oneLine ? (
            <>
              <p className="min-w-0 truncate">
                <EventSentence event={event} />
              </p>
              <span className="shrink-0 whitespace-nowrap">{time}</span>
            </>
          ) : (
            <p>
              <EventSentence event={event} />
              {time}
            </p>
          )}
        </Link>
        {BODY_KINDS.includes(event.kind) && <VoteBody event={event} />}
        <VoteActions event={event} />
      </div>
    </div>
  );
}

export function DigestFeedSkeleton() {
  return (
    <div className="flex w-full items-start gap-2.5 py-2">
      <div className="mt-[5px] h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-gray-200" />
      <div className="h-4 flex-1 max-w-[520px] animate-pulse rounded bg-gray-100" />
    </div>
  );
}
