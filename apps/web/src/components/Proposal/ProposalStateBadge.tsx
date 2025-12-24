import { ProposalState } from "@/data/goldsky/governance/common";
import Icon from "../ui/Icon";
import { ReactNode } from "react";
import { useBlockNumber } from "wagmi";

interface ProposalBadgeProps {
  state: ProposalState;
  objectionPeriodEndBlock?: number;
}

const propStateTag: Record<ProposalState, ReactNode> = {
  pending: <>Pending</>,
  active: <span className="text-semantic-accent">Active</span>,
  successful: (
    <>
      <Icon icon="circleCheck" size={14} className="fill-semantic-positive" />
      <span className="text-semantic-positive">Succeeded</span>
    </>
  ),
  failed: (
    <>
      <Icon icon="circleX" size={14} className="fill-semantic-negative" />
      <span className="text-semantic-negative">Defeated</span>
    </>
  ),
  queued: (
    <>
      <Icon icon="circleCheck" size={14} className="fill-semantic-positive" />
      <span className="text-semantic-positive">Succeeded</span>
    </>
  ),
  executed: (
    <>
      <Icon icon="circleCheck" size={14} className="fill-semantic-positive" />
      <span className="text-semantic-positive">Executed</span>
    </>
  ),
  cancelled: (
    <>
      <span className="text-semantic-negative">Cancelled</span>
    </>
  ),
  expired: (
    <>
      <span className="text-semantic-negative">Expired</span>
    </>
  ),
  vetoed: (
    <>
      <Icon icon="caution" size={14} className="fill-semantic-warning" />
      <span className="text-semantic-warning">Vetoed</span>
    </>
  ),
  updatable: (
    <>
      <span className="text-semantic-accent">Updatable</span>
    </>
  ),
};

// Calculate time remaining from blocks (assuming ~12s per block)
function getTimeRemaining(blocksRemaining: number): string {
  const secondsRemaining = blocksRemaining * 12;
  const minutesRemaining = Math.floor(secondsRemaining / 60);
  const hoursRemaining = Math.floor(minutesRemaining / 60);
  const daysRemaining = Math.floor(hoursRemaining / 24);

  if (daysRemaining > 0) {
    return `${daysRemaining}d`;
  } else if (hoursRemaining > 0) {
    return `${hoursRemaining}h`;
  } else if (minutesRemaining > 0) {
    return `${minutesRemaining}m`;
  } else {
    return `${secondsRemaining}s`;
  }
}

export function ProposalStateBadge({ state, objectionPeriodEndBlock }: ProposalBadgeProps) {
  const { data: currentBlockNumber } = useBlockNumber();
  
  // Check if proposal is in objection period
  const isInObjectionPeriod = 
    state === "successful" && 
    objectionPeriodEndBlock && 
    currentBlockNumber && 
    currentBlockNumber <= objectionPeriodEndBlock;
  
  const blocksRemaining = isInObjectionPeriod && currentBlockNumber && objectionPeriodEndBlock
    ? objectionPeriodEndBlock - Number(currentBlockNumber)
    : 0;
  
  const timeRemaining = blocksRemaining > 0 ? getTimeRemaining(blocksRemaining) : null;

  return (
    <div className="flex w-fit items-center justify-center gap-1 text-content-secondary label-sm">
      {propStateTag[state]}
      {isInObjectionPeriod && timeRemaining && (
        <span className="text-content-secondary text-xs">
          (in objection period, {timeRemaining} left)
        </span>
      )}
    </div>
  );
}
