import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SomethingWentWrong } from "@/components/SomethingWentWrong";
import RoundProposalForm from "@/components/Rounds/RoundProposalForm";
import { isArchivedRound } from "@/components/Rounds/utils";
import { useRound } from "@/hooks/rounds/useRounds";

export default function RoundProposePage() {
  const { handle } = useParams<{ handle: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useRound(handle);

  const editId = Number(params.get("edit"));
  const editing = data?.proposals.find((proposal) => proposal.id === editId);

  if (isLoading) {
    return (
      <div className="flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-96 w-full rounded-[16px]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <SomethingWentWrong
        message={error?.message ?? "That round could not be loaded."}
        returnHref="/rounds"
      />
    );
  }

  const { round } = data;
  const closed = round.state !== "proposing" || isArchivedRound(round);

  return (
    <>
      <Helmet>
        <title>Propose to {round.name} | Lil Nouns Rounds</title>
      </Helmet>

      <div className="flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <Link
          to={`/rounds/${round.handle}`}
          className="flex items-center gap-1 text-sm text-content-secondary hover:text-content-primary"
        >
          <ArrowLeft className="size-4" /> {round.name}
        </Link>

        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">
            {editing ? "Edit your proposal" : "Propose to this round"}
          </h1>
          <p className="text-content-secondary">{round.proposeStrategyDescription}.</p>
        </header>

        {closed ? (
          <p className="rounded-[16px] border p-6 text-content-secondary">
            {isArchivedRound(round)
              ? "This round ran on another platform and is here as history, so it cannot be proposed to."
              : round.state === "pending"
                ? "This round has not opened yet."
                : "Proposing has closed for this round."}
          </p>
        ) : (
          <RoundProposalForm
            round={round}
            proposal={editing}
            onDone={(id) => navigate(`/rounds/${round.handle}/proposals/${id}`)}
          />
        )}
      </div>
    </>
  );
}
