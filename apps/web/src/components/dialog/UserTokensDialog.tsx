"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { getNounsForAddress, getNounsDelegatedTo } from "@/data/ponder/nouns";
import { transformPonderNounToNoun } from "@/data/noun/helpers";
import { Noun } from "@/data/noun/types";
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
} from "../ui/DrawerDialog";
import NounExplorer from "../NounExplorer";
import { FilterEngineProvider } from "@/contexts/FilterEngineContext";
import { Skeleton } from "../ui/skeleton";
import AnimationGird from "../NounExplorer/NounGrid/AnimationGrid";
import { EnsName } from "../EnsName";
import { Separator } from "../ui/separator";
import { useNounFilters } from "@/hooks/useNounFilters";
import clsx from "clsx";

interface UserTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: Address;
  showDelegated?: boolean;
}

type SortOrder = "newest" | "oldest";

function UserTokensExplorer({ 
  address, 
  showDelegated = false,
  onSortChange
}: { 
  address: Address; 
  showDelegated: boolean;
  onSortChange?: (sortOrder: SortOrder) => void;
}) {
  const filters = useNounFilters();
  const [allNouns, setAllNouns] = useState<Noun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const BATCH_SIZE = 100;

  // Fetch owned nouns
  const { data: ownedData, isLoading: isLoadingOwned } = useQuery({
    queryKey: ['nouns-owned-dialog', address],
    queryFn: async () => {
      const result = await getNounsForAddress(address, BATCH_SIZE, 0);
      return {
        nouns: result.nouns.map(transformPonderNounToNoun),
        hasMore: result.hasMore,
      };
    },
    enabled: !!address,
    staleTime: 60000,
  });

  // Fetch delegated nouns if needed
  const { data: delegatedData, isLoading: isLoadingDelegated } = useQuery({
    queryKey: ['nouns-delegated-dialog', address],
    queryFn: async () => {
      const result = await getNounsDelegatedTo(address, BATCH_SIZE, 0);
      return {
        nouns: result.nouns.map(transformPonderNounToNoun),
        hasMore: result.hasMore,
      };
    },
    enabled: !!address && showDelegated,
    staleTime: 60000,
  });

  // Combine, filter, and sort nouns
  const filteredNouns = useMemo(() => {
    const owned = ownedData?.nouns || [];
    const delegated = showDelegated ? (delegatedData?.nouns || []) : [];
    
    // Combine and deduplicate
    const combined = [...owned, ...delegated];
    const uniqueNouns = combined.filter((noun, index, self) =>
      index === self.findIndex((n) => n.id === noun.id)
    );

    // Apply trait filters
    const filtered = uniqueNouns.filter((noun) => {
      const backgroundMatch = filters.background.length === 0 || 
        filters.background.includes(noun.traits.background.seed.toString());
      const headMatch = filters.head.length === 0 || 
        filters.head.includes(noun.traits.head.seed.toString());
      const glassesMatch = filters.glasses.length === 0 || 
        filters.glasses.includes(noun.traits.glasses.seed.toString());
      const bodyMatch = filters.body.length === 0 || 
        filters.body.includes(noun.traits.body.seed.toString());
      const accessoryMatch = filters.accessory.length === 0 || 
        filters.accessory.includes(noun.traits.accessory.seed.toString());

      return backgroundMatch && headMatch && glassesMatch && bodyMatch && accessoryMatch;
    });

    // Sort by ID
    return filtered.sort((a, b) => {
      const numA = parseInt(a.id);
      const numB = parseInt(b.id);
      return sortOrder === "newest" ? numB - numA : numA - numB;
    });
  }, [ownedData, delegatedData, showDelegated, filters, sortOrder]);

  useEffect(() => {
    if (isLoadingOwned || (showDelegated && isLoadingDelegated)) {
      setIsLoading(true);
      return;
    }

    setAllNouns(filteredNouns);
    setHasMore((ownedData?.hasMore || false) || (showDelegated && (delegatedData?.hasMore || false)));
    setIsLoading(false);
  }, [filteredNouns, ownedData, delegatedData, isLoadingOwned, isLoadingDelegated, showDelegated]);

  const handleSortChange = (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
    onSortChange?.(newSortOrder);
  };

  // Load more function
  const loadMore = async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    const newOffset = offset + BATCH_SIZE;

    try {
      const [ownedResult, delegatedResult] = await Promise.all([
        getNounsForAddress(address, BATCH_SIZE, newOffset),
        showDelegated ? getNounsDelegatedTo(address, BATCH_SIZE, newOffset) : Promise.resolve({ nouns: [], hasMore: false }),
      ]);

      const owned = ownedResult.nouns.map(transformPonderNounToNoun);
      const delegated = delegatedResult.nouns.map(transformPonderNounToNoun);
      const combined = [...owned, ...delegated];
      
      // Deduplicate
      const uniqueNouns = combined.filter((noun, index, self) =>
        index === self.findIndex((n) => n.id === noun.id)
      );

      setAllNouns(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNouns = uniqueNouns.filter(n => !existingIds.has(n.id));
        return [...prev, ...newNouns];
      });

      setHasMore(ownedResult.hasMore || (showDelegated && delegatedResult.hasMore));
      setOffset(newOffset);
    } catch (error) {
      console.error("Failed to load more nouns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && allNouns.length === 0) {
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
    );
  }

  return (
    <NounExplorer
      nouns={allNouns}
      onSortChange={handleSortChange}
      loadMore={hasMore ? loadMore : undefined}
      hasMore={hasMore}
      isLoadingMore={isLoading && allNouns.length > 0}
    />
  );
}

export default function UserTokensDialog({
  open,
  onOpenChange,
  address,
  showDelegated = false,
}: UserTokensDialogProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  return (
    <DrawerDialog open={open} onOpenChange={onOpenChange}>
      <DrawerDialogContent
        className={clsx(
          "md:aspect-[100/85] md:max-w-[min(95vw,1600px)] md:h-[90vh]",
          "bg-white"
        )}
      >
        <DrawerDialogTitle className="sr-only">
          Tokens owned by <EnsName address={address} />
        </DrawerDialogTitle>
        <DrawerDialogContentInner className={clsx("p-0 flex flex-col h-full")}>
          {/* Header */}
          <div className="flex flex-col gap-4 px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="heading-2">
                  Tokens
                </h2>
                <p className="text-content-secondary">
                  Owned by <EnsName address={address} />
                </p>
              </div>
            </div>
            <Separator className="h-[2px]" />
          </div>

          {/* Content with filters */}
          <div className="flex-1 overflow-hidden">
            <FilterEngineProvider>
              <div className="h-full overflow-y-auto">
                <UserTokensExplorer
                  address={address}
                  showDelegated={showDelegated}
                  onSortChange={setSortOrder}
                />
              </div>
            </FilterEngineProvider>
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  );
}

