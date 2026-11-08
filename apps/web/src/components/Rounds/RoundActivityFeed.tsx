import { Link } from "react-router-dom";
import { Flag, Plus, Trophy, Vote } from "lucide-react";
import { Round, RoundActivityEvent } from "@/data/rounds/types";
import { formatTimeSinceNow } from "@/utils/format";
import RoundIdentity from "./RoundIdentity";
import { toRoundActor } from "./utils";

const MILESTONES: Record<string, { icon: typeof Flag; label: string }> = {
  "round-started": { icon: Flag, label: "Round started" },
  "voting-started": { icon: Vote, label: "Voting started" },
  "round-ended": { icon: Trophy, label: "Round ended" },
};

/** Proposals, votes and the round's own milestones, newest first. */
export default function RoundActivityFeed({
  round,
  events,
}: {
  round: Round;
  events: RoundActivityEvent[];
}) {
  if (events.length === 0) {
    return <p className="text-sm text-content-secondary">Nothing has happened yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y">
      {events.map((event) => {
        const milestone = MILESTONES[event.kind];
        const when = formatTimeSinceNow(Math.floor(new Date(event.timestamp).getTime() / 1000));

        if (milestone) {
          const Icon = milestone.icon;
          return (
            <li key={event.id} className="flex items-center gap-2 py-2 text-sm">
              <Icon className="size-4 shrink-0 text-content-secondary" />
              <span className="font-medium">{milestone.label}</span>
              <span className="ml-auto shrink-0 text-content-secondary">{when}</span>
            </li>
          );
        }

        return (
          <li key={event.id} className="flex items-center gap-2 py-2 text-sm">
            {event.kind === "vote" ? (
              <span className="shrink-0 font-bold text-semantic-accent">+{event.weight}</span>
            ) : (
              <Plus className="size-4 shrink-0 text-content-secondary" />
            )}
            <RoundIdentity
              actor={toRoundActor(event.actor, event.actorName, event.actorImage)}
              avatarSize={18}
              className="min-w-0 text-sm"
            />
            {event.kind === "vote" ? (
              <Link
                to={`/rounds/${round.handle}/proposals/${event.proposalId}`}
                className="min-w-0 truncate text-content-secondary hover:text-content-primary"
              >
                {event.proposalTitle}
              </Link>
            ) : (
              <span className="text-content-secondary">created a proposal</span>
            )}
            <span className="ml-auto shrink-0 text-content-secondary">{when}</span>
          </li>
        );
      })}
    </ul>
  );
}
