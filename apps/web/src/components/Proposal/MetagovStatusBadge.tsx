import { ProposalOverview } from "@/data/goldsky/governance/common";
import Icon from "../ui/Icon";
import { ReactNode } from "react";

interface MetagovStatusBadgeProps {
  state: ProposalOverview['state'];
  label?: string;
}

const metagovStateTag: Record<ProposalOverview['state'], ReactNode> = {
  metagov_active: <span className="text-semantic-accent">Active</span>,
  metagov_closed: <span className="text-content-secondary">Awaiting Nouns Vote</span>,
  metagov_pending: <span className="text-content-secondary">Pending</span>,
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
};

export function MetagovStatusBadge({ state, label }: MetagovStatusBadgeProps) {
  return (
    <div className="flex w-fit items-center justify-center gap-1 text-content-secondary label-sm">
      {metagovStateTag[state]}
    </div>
  );
}

