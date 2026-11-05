import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus } from "lucide-react";
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import SearchProvider, { SearchInput, useSearchContext } from "@/components/Search";
import {
  DigestFeedFilter,
  DigestPage as DigestFeedPage,
  eventMatchesFilter,
  getDigestFeed,
  getDigestPage,
  hasDigestApi,
} from "@/data/goldsky/governance/getDigestFeed";
import DigestFeedItem, {
  DigestFeedSkeleton,
} from "@/components/Digest/DigestFeedItem";
import DigestFeedFade from "@/components/Digest/DigestFeedFade";
import CreateTypeDialog from "@/components/CreateTypeDialog";
import DigestSidebar, { DigestTab } from "@/components/Digest/DigestSidebar";
import { isDaoVersion5 } from "@/utils/daoVersion";

const FILTERS: { id: DigestFeedFilter; label: string }[] = [
  { id: "all", label: "Show everything" },
  { id: "proposals", label: "Proposals" },
  { id: "votes", label: "Votes" },
  { id: "candidates", label: "Candidates" },
  { id: "topics", label: "Topics" },
  { id: "market", label: "Sales & transfers" },
  { id: "delegates", label: "Delegates" },
];

// Matches the indexer's fast poll for votes and proposal state.
const POLL_MS = 30_000;
const SNAPSHOT_PREFIX = "digest-feed:v1:";

type FeedData = InfiniteData<DigestFeedPage, string | null>;

// Last first page per filter, so a reload paints instantly and then refreshes.
function readSnapshot(filter: DigestFeedFilter): FeedData | undefined {
  try {
    const raw = localStorage.getItem(SNAPSHOT_PREFIX + filter);
    if (!raw) return undefined;
    return { pages: [JSON.parse(raw) as DigestFeedPage], pageParams: [null] };
  } catch {
    return undefined;
  }
}

function writeSnapshot(filter: DigestFeedFilter, page: DigestFeedPage) {
  try {
    localStorage.setItem(SNAPSHOT_PREFIX + filter, JSON.stringify(page));
  } catch {
    // Storage full or blocked; the feed still works without it.
  }
}

function DigestFeed({
  filter,
}: {
  filter: DigestFeedFilter;
}) {
  const { debouncedSearchValue } = useSearchContext();
  const search = debouncedSearchValue.trim();
  const useApi = hasDigestApi();
  const queryClient = useQueryClient();
  const queryKey = useApi
    ? ["digest-feed", filter, search]
    : ["digest-feed", "subgraph"];

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      useApi
        ? getDigestPage({ filter, search, cursor: pageParam })
        : getDigestFeed(80).then((events) => ({ events, nextCursor: null })),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    initialData: () => (useApi && !search ? readSnapshot(filter) : undefined),
    // Snapshot is shown immediately but always treated as stale.
    initialDataUpdatedAt: 0,
    staleTime: 20_000,
    gcTime: 30 * 60_000,
    // Polling below refreshes only the newest page; this covers the fallback.
    refetchInterval: useApi ? false : POLL_MS,
  });

  // Poll just the newest page and splice it in, so scrolled pages stay put.
  const { data: freshPage } = useQuery({
    queryKey: [...queryKey, "head"],
    queryFn: () => getDigestPage({ filter, search }),
    enabled: useApi && !isLoading,
    refetchInterval: POLL_MS,
    staleTime: POLL_MS,
  });

  useEffect(() => {
    if (!freshPage) return;
    queryClient.setQueryData<FeedData>(queryKey, (old) =>
      old ? { ...old, pages: [freshPage, ...old.pages.slice(1)] } : old,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshPage]);

  const firstPage = data?.pages[0];
  useEffect(() => {
    if (useApi && !search && firstPage) writeSnapshot(filter, firstPage);
  }, [useApi, search, filter, firstPage]);

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const visible = useMemo(() => {
    const seen = new Set<string>();
    const events = (data?.pages ?? [])
      .flatMap((page) => page.events)
      .filter((event) => !seen.has(event.id) && Boolean(seen.add(event.id)));
    // The API filters and searches server-side; the subgraph fallback can't.
    if (useApi) return events;
    const needle = search.toLowerCase();
    return events.filter((event) => {
      if (!eventMatchesFilter(event, filter)) return false;
      if (!needle) return true;
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
      return haystack.includes(needle);
    });
  }, [data, filter, search, useApi]);

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
        {search
          ? "No activity matching this search."
          : "No activity for this filter yet."}
      </p>
    );
  }

  return (
    <div className="relative flex flex-col">
      {visible.map((event) => (
        <DigestFeedItem key={event.id} event={event} />
      ))}
      {isFetchingNextPage &&
        Array.from({ length: 4 }).map((_, i) => <DigestFeedSkeleton key={i} />)}
      <div ref={sentinel} aria-hidden className="h-px" />
      {hasNextPage && <DigestFeedFade />}
    </div>
  );
}

export default function DigestPage() {
  const [filter, setFilter] = useState<DigestFeedFilter>("all");
  const [tab, setTab] = useState<DigestTab>("digest");
  const [createOpen, setCreateOpen] = useState(false);
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
              <div className="flex items-center gap-3">
                <SearchInput
                  placeholder="Search activity"
                  className="min-w-0 flex-1"
                />
                <Select
                  value={filter}
                  onValueChange={(value) =>
                    setFilter(value as DigestFeedFilter)
                  }
                >
                  <SelectTrigger className="h-11 w-fit shrink-0 whitespace-nowrap rounded-full border border-gray-300 px-4 text-sm font-medium">
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
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                  create
                </button>
              </div>
            </div>

            <DigestFeed filter={filter} />
          </div>

          <DigestSidebar tab={tab} onTabChange={setTab} />
        </div>

        <CreateTypeDialog
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          daoType="lilnouns"
        />
      </SearchProvider>
    </>
  );
}
