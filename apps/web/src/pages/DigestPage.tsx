import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import SearchProvider, { SearchInput, useSearchContext } from "@/components/Search";
import {
  DigestFeedFilter,
  eventMatchesFilter,
  getDigestFeed,
} from "@/data/goldsky/governance/getDigestFeed";
import DigestFeedItem, {
  DigestFeedSkeleton,
} from "@/components/Digest/DigestFeedItem";
import DigestSidebar, { DigestTab } from "@/components/Digest/DigestSidebar";
import { isDaoVersion5 } from "@/utils/daoVersion";

const FILTERS: { id: DigestFeedFilter; label: string }[] = [
  { id: "all", label: "Show everything" },
  { id: "proposals", label: "Proposals" },
  { id: "candidates", label: "Candidates" },
  { id: "topics", label: "Topics" },
  { id: "market", label: "Sales & transfers" },
  { id: "delegates", label: "Delegates" },
];

function DigestFeed({
  filter,
}: {
  filter: DigestFeedFilter;
}) {
  const { debouncedSearchValue } = useSearchContext();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["digest-feed"],
    queryFn: () => getDigestFeed(80),
    staleTime: 20_000,
  });

  const visible = useMemo(() => {
    const search = debouncedSearchValue.trim().toLowerCase();
    return events.filter((event) => {
      if (!eventMatchesFilter(event, filter)) return false;
      if (!search) return true;
      const haystack = [
        event.actor,
        event.counterpart,
        event.proposalTitle,
        event.candidateTitle,
        event.topicTitle,
        event.proposalId,
        ...(event.nounIds ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [events, filter, debouncedSearchValue]);

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 10 }).map((_, i) => (
          <DigestFeedSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <p className="py-6 text-sm text-content-secondary">
        {debouncedSearchValue
          ? "No activity matching this search."
          : "No activity for this filter yet."}
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {visible.map((event) => (
        <DigestFeedItem key={event.id} event={event} />
      ))}
    </div>
  );
}

export default function DigestPage() {
  const [filter, setFilter] = useState<DigestFeedFilter>("all");
  const [tab, setTab] = useState<DigestTab>("digest");
  const showV5 = isDaoVersion5();
  const filters = FILTERS.filter(
    (item) =>
      showV5 || (item.id !== "candidates" && item.id !== "topics"),
  );

  return (
    <>
      <Helmet>
        <title>Digest | Lil Nouns DAO</title>
        <meta
          name="description"
          content="Follow Lil Nouns sales, transfers, votes, proposals, candidates, and topics in one feed."
        />
        <link rel="canonical" href="https://www.lilnouns.wtf/digest" />
        <meta property="og:title" content="Digest | Lil Nouns DAO" />
        <meta
          property="og:description"
          content="Follow Lil Nouns sales, transfers, votes, proposals, candidates, and topics in one feed."
        />
      </Helmet>

      <SearchProvider>
        <div className="flex w-full max-w-[1400px] flex-col gap-12 p-6 pb-20 md:p-10 md:pb-20 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-start gap-3">
                <SearchInput
                  placeholder="Search activity"
                  className="w-full"
                />
                <Select
                  value={filter}
                  onValueChange={(value) =>
                    setFilter(value as DigestFeedFilter)
                  }
                >
                  <SelectTrigger className="h-11 w-fit rounded-full border border-gray-300 px-4 text-sm font-medium">
                    {filters.find((item) => item.id === filter)?.label}
                  </SelectTrigger>
                  <SelectContent>
                    {filters.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DigestFeed filter={filter} />
          </div>

          <DigestSidebar tab={tab} onTabChange={setTab} />
        </div>
      </SearchProvider>
    </>
  );
}
