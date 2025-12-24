import { Suspense, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import NounExplorer from '@/components/NounExplorer'
import AnimationGird from '@/components/NounExplorer/NounGrid/AnimationGrid'
import { FilterEngineProvider } from '@/contexts/FilterEngineContext'
import { useSmartNounRendering } from '@/hooks/useSmartNounRendering'

export type SortOrder = "newest" | "oldest";

function NounExplorerWrapper() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  
  // Simplified hook - just fetches first 100
  const {
    nouns,
    isLoading,
    totalMatching,
    loadMore,
    hasMore,
  } = useSmartNounRendering(sortOrder);

  if (isLoading && nouns.length === 0) {
    return (
      <div className="w-full">
        <AnimationGird
          items={Array(40)
            .fill(0)
            .map((_, i) => ({
              element: (
                <Skeleton className="relative flex aspect-square h-full w-full rounded-2xl bg-background-secondary" />
              ),
              id: i,
            }))}
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      <NounExplorer 
        nouns={nouns} 
        onSortChange={setSortOrder}
        loadMore={loadMore}
        hasMore={hasMore}
        isLoadingMore={isLoading && nouns.length > 0}
      />
    </div>
  );
}

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const nounId = searchParams.get("lilnounId");
  
  const baseUrl = import.meta.env.VITE_URL || "https://www.lilnouns.wtf";
  const ogImageUrl = nounId 
    ? `${baseUrl}/api/og/noun/${nounId}`
    : "https://lilnouns.wtf/api/og/collection";

  return (
    <>
      <Helmet>
        <title>
          {nounId 
            ? `Lil Noun #${nounId} | Lil Nouns DAO`
            : "Explore Lil Nouns"}
        </title>
        <meta 
          name="description" 
          content={nounId
            ? `View Lil Noun #${nounId} - A unique generative avatar NFT from Lil Nouns DAO`
            : "Browse all Lil Noun tokens"}
        />
        <meta property="fc:frame" content="vNext" />
        <meta
          property="fc:frame:image"
          content="https://lilnouns.wtf/api/og/collection"
        />
        <meta
          property="fc:frame:post_url"
          content="https://lilnouns.wtf/api/frame/collection"
        />
        <meta property="fc:frame:button:1" content="View Collection" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://lilnouns.wtf" />
        
        {/* Open Graph - must come after other og tags to override */}
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:url" content={ogImageUrl} />
        <meta property="og:image:secure_url" content={ogImageUrl} />
        <meta property="og:title" content={nounId ? `Lil Noun #${nounId}` : "Explore Lil Nouns"} />
        <meta property="og:description" content={nounId
          ? `View Lil Noun #${nounId} - A unique generative avatar NFT from Lil Nouns DAO`
          : "Browse all Lil Noun tokens"} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:image:src" content={ogImageUrl} />
        <meta name="twitter:title" content={nounId ? `Lil Noun #${nounId}` : "Explore Lil Nouns"} />
        <meta name="twitter:description" content={nounId
          ? `View Lil Noun #${nounId} - A unique generative avatar NFT from Lil Nouns DAO`
          : "Browse all Lil Noun tokens"} />
      </Helmet>

      <div className="flex w-full flex-col gap-8 p-6 md:gap-12 md:p-10">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3>Explore</h3>
            <p className="text-content-secondary">
              Browse all Lil Noun tokens
            </p>
          </div>
        </div>

        <FilterEngineProvider>
          <Suspense
            fallback={
              <div className="w-full">
                <AnimationGird
                  items={Array(40)
                    .fill(0)
                    .map((_, i) => ({
                      element: (
                        <Skeleton className="relative flex aspect-square h-full w-full rounded-2xl bg-background-secondary" />
                      ),
                      id: i,
                    }))}
                />
              </div>
            }
          >
            <NounExplorerWrapper />
          </Suspense>
        </FilterEngineProvider>
      </div>
    </>
  )
}

