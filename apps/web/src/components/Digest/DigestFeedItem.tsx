import { Link } from "react-router-dom";
import { Address, formatEther } from "viem";
import { truncate } from "lodash";
import { EnsAvatar } from "@/components/EnsAvatar";
import { EnsName } from "@/components/EnsName";
import { NounImage } from "@/components/NounImage";
import { formatTimeLeft } from "@/utils/format";
import { DigestEvent, DigestEventKind } from "@/data/goldsky/governance/getDigestFeed";

type EventFamily = "event-action" | "individual-action" | "event-update";

function familyOf(kind: DigestEventKind): EventFamily {
  switch (kind) {
    case "voting-started":
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

function conclusionCopy(event: DigestEvent): { label: string; className: string } {
  switch (event.conclusion) {
    case "defeated":
      return { label: "defeated", className: "text-semantic-negative" };
    case "canceled":
      return { label: "canceled", className: "text-semantic-negative" };
    case "vetoed":
      return { label: "vetoed", className: "text-semantic-warning" };
    case "executed":
      return { label: "executed", className: "text-semantic-positive" };
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
          Voting for Proposal {event.proposalId}: <Title event={event} /> started
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
      return (
        <>
          {event.actor && <Person address={event.actor} />}{" "}
          <span className={support.className}>
            voted {support.label}
            {event.voteWeight ? ` (${event.voteWeight})` : ""}
          </span>{" "}
          Proposal {event.proposalId}: <Title event={event} />
        </>
      );
    }
    case "proposal-feedback": {
      const support = supportCopy(event.support);
      return (
        <>
          {event.actor && <Person address={event.actor} />} commented{" "}
          <span className={support.className}>{support.label}</span> on Proposal{" "}
          {event.proposalId}: <Title event={event} />
        </>
      );
    }
    case "candidate-feedback": {
      const support = supportCopy(event.support);
      return (
        <>
          {event.actor && <Person address={event.actor} />} commented{" "}
          <span className={support.className}>{support.label}</span> on Candidate{" "}
          <Title event={event} />
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
          {event.counterpart ? "sold" : "bought"} <NounChip ids={event.nounIds} />
          {event.counterpart && (
            <>
              {" "}
              to <PersonWithAvatar address={event.counterpart} />
            </>
          )}
          {event.amountWei ? ` for ${formatEth(event.amountWei)}` : ""}
        </>
      );
    case "transfer":
      return (
        <>
          {event.actor && <Person address={event.actor} />} transferred{" "}
          <NounChip ids={event.nounIds} />
          {event.counterpart && (
            <>
              {" "}
              to <PersonWithAvatar address={event.counterpart} />
            </>
          )}
        </>
      );
    case "delegate":
      return (
        <>
          {event.actor && <Person address={event.actor} />} delegated{" "}
          <NounChip ids={event.nounIds} />
          {event.counterpart && (
            <>
              {" "}
              to <PersonWithAvatar address={event.counterpart} />
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

export default function DigestFeedItem({ event }: { event: DigestEvent }) {
  return (
    <Link
      to={event.href}
      className="flex w-full items-start gap-2.5 py-2 text-[15px] leading-[22px] text-content-primary transition-opacity hover:opacity-70"
    >
      <span className="flex h-[22px] w-[18px] shrink-0 items-center justify-center">
        <Lead event={event} />
      </span>
      <p className="min-w-0 flex-1">
        <EventSentence event={event} />
        <span className="text-content-secondary"> · {formatRelative(event.timestamp)}</span>
      </p>
    </Link>
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
