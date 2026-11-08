import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import RoundForm from "@/components/Rounds/RoundForm";
import { hasRoundsApi } from "@/data/rounds/client";
import { useScrollToTop } from "@/hooks/rounds/useScrollToTop";

export default function RoundCreatePage() {
  useScrollToTop();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Open a round | Lil Nouns Rounds</title>
      </Helmet>

      <div className="flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <Link
          to="/rounds"
          className="flex items-center gap-1 text-sm text-content-secondary hover:text-content-primary"
        >
          <ArrowLeft className="size-4" /> All rounds
        </Link>

        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Open a round</h1>
          <p className="text-content-secondary">
            Set the prizes and the schedule, and the round runs itself: proposing opens, voting
            opens on a snapshot of Lil Nouns votes, and the leading proposals take the awards when
            it ends.
          </p>
        </header>

        {hasRoundsApi() ? (
          <RoundForm onDone={(handle) => navigate(`/rounds/${handle}`)} />
        ) : (
          <p className="rounded-[16px] border p-6 text-content-secondary">
            Rounds are not available in this environment. Set{" "}
            <span className="font-mono">VITE_ROUNDS_API_URL</span> to the rounds service to turn
            them on.
          </p>
        )}
      </div>
    </>
  );
}
