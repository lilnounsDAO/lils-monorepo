import { ReactNode, useState } from "react";
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
  DrawerDialogTrigger,
} from "@/components/ui/DrawerDialog";
import Spinner from "@/components/ui/spinner";
import { useRoundProposalVotes } from "@/hooks/rounds/useRounds";
import { formatNumber } from "@/utils/format";
import RoundIdentity from "./RoundIdentity";
import { toRoundActor } from "./utils";

/**
 * Who voted for one proposal. The votes are fetched when the dialog opens, not
 * with the round, since a round page shows dozens of proposals and almost none
 * of them get opened.
 */
export default function ProposalVotesDialog({
  proposalId,
  title,
  children,
}: {
  proposalId: number;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useRoundProposalVotes(proposalId, open);
  const votes = data?.votes ?? [];

  return (
    <DrawerDialog open={open} onOpenChange={setOpen}>
      <DrawerDialogTrigger className="text-content-secondary underline clickable-active hover:brightness-75">
        {children}
      </DrawerDialogTrigger>
      <DrawerDialogContent className="md:max-h-[80vh] md:max-w-[min(480px,95vw)]">
        <DrawerDialogContentInner className="p-0">
          <DrawerDialogTitle className="shadow-bottom-only flex w-full flex-col gap-1 p-6 pb-3 text-left heading-5">
            {title}
            <span className="text-sm font-normal text-content-secondary">
              {data
                ? `${formatNumber({ input: Number(data.proposal.voteCount) })} ${
                    data.proposal.voteCount === "1" ? "vote" : "votes"
                  } from ${votes.length} ${votes.length === 1 ? "ballot" : "ballots"}`
                : "Votes"}
            </span>
          </DrawerDialogTitle>

          <div className="flex w-full flex-col overflow-y-auto">
            {isLoading && (
              <div className="flex justify-center p-8">
                <Spinner size="1.5rem" />
              </div>
            )}
            {!isLoading && votes.length === 0 && (
              <p className="p-6 text-center text-content-secondary">
                No votes were cast for this proposal.
              </p>
            )}
            {votes.map((vote) => (
              <div
                key={vote.id}
                className="flex w-full min-w-0 items-center justify-between gap-3 px-6 py-3 hover:bg-background-secondary"
              >
                <RoundIdentity
                  actor={toRoundActor(vote.voter, vote.voterName, vote.voterImage)}
                  avatarSize={24}
                  className="min-w-0"
                />
                <div className="flex shrink-0 flex-col items-end">
                  <span className="font-bold">
                    {formatNumber({ input: Number(vote.weight) })}
                  </span>
                  <span className="text-xs text-content-secondary">
                    {Intl.DateTimeFormat("en", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(vote.timestamp))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  );
}
