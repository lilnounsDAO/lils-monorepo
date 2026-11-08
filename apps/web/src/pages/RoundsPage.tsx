import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import LoadingSkeletons from "@/components/LoadingSkeletons";
import SearchProvider, { SearchInput, useSearchContext } from "@/components/Search";
import RoundCard from "@/components/Rounds/RoundCard";
import { hasRoundsApi } from "@/data/rounds/client";
import { useRoundHouse, useRoundsList } from "@/hooks/rounds/useRounds";
import { formatNumber } from "@/utils/format";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "ended", label: "Ended" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

function RoundsFeed({ filter }: { filter: Filter }) {
  const { debouncedSearchValue } = useSearchContext();
  const search = debouncedSearchValue.trim();
  const { data, isLoading } = useRoundsList({
    state: filter === "all" ? undefined : filter,
    search: search || undefined,
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <LoadingSkeletons count={6} className="h-[180px] w-full rounded-[16px]" />
      </div>
    );
  }

  const rounds = data?.rounds ?? [];
  if (rounds.length === 0) {
    return (
      <p className="py-12 text-center text-content-secondary">
        {search
          ? `No rounds match “${search}”.`
          : filter === "open"
            ? "No rounds are open right now."
            : "No rounds yet."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {rounds.map((round) => (
        <RoundCard key={round.id} round={round} />
      ))}
    </div>
  );
}

export default function RoundsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data: house } = useRoundHouse();
  const totals = house?.totals;

  return (
    <>
      <Helmet>
        <title>Rounds | Lil Nouns DAO</title>
        <meta
          name="description"
          content="Funded rounds for Lil Nouns. Anyone can propose, and every Lil Noun votes."
        />
      </Helmet>

      <div className="flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Rounds</h1>
          <p className="max-w-2xl text-content-secondary">
            Lil Nouns funds work through open rounds. Anyone can propose, Lil Nouns holders vote
            with the votes delegated to them, and the proposals with the most votes get funded.
          </p>

          {totals && (
            <dl className="flex flex-wrap gap-x-8 gap-y-2">
              {[
                { label: "Rounds", value: totals.rounds },
                { label: "Proposals", value: totals.proposals },
                { label: "Voters", value: totals.voters },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <dd className="text-2xl font-bold">
                    {formatNumber({ input: stat.value, compact: true })}
                  </dd>
                  <dt className="text-sm text-content-secondary">{stat.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </header>

        {!hasRoundsApi() ? (
          <p className="rounded-[16px] border p-6 text-content-secondary">
            Rounds are not available in this environment. Set{" "}
            <span className="font-mono">VITE_ROUNDS_API_URL</span> to the rounds service to turn
            them on.
          </p>
        ) : (
          <SearchProvider>
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  {FILTERS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFilter(option.id)}
                      className={clsx(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        filter === option.id
                          ? "bg-content-primary text-white"
                          : "bg-background-secondary text-content-secondary hover:text-content-primary",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <SearchInput className="w-full md:w-56" placeholder="Search rounds" />
                  {/* Opening a round is off for now; the page and the write
                      path still work at /rounds/new. A disabled button fires no
                      pointer events, so the trigger wraps it. */}
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button disabled>
                          <Plus className="mr-1 size-4" /> New round
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Creating rounds isn't live yet
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <RoundsFeed filter={filter} />
            </div>
          </SearchProvider>
        )}
      </div>
    </>
  );
}
