"use client";

import { useInfiniteProposals } from "@/hooks/useInfiniteProposals";
import { useSnapshotMetagov } from "@/hooks/useSnapshotMetagov";
import { useEffect, useRef, useState, useMemo } from "react";
import { ProposalOverview } from "@/data/goldsky/governance/common";
import { DaoType } from "@/data/goldsky/governance/getProposalOverviews";
import FilteredProposalOverviews from "./FilteredProposalOverviews";
import LoadingSpinner from "../LoadingSpinner";
import LoadingSkeletons from "../LoadingSkeletons";

// Custom hook for intersection observer
function useInView() {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "100px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

interface InfiniteProposalOverviewsProps {
  initialProposals?: ProposalOverview[];
  dummyProposals?: ProposalOverview[];
  pageSize?: number;
  daoType?: DaoType;
}

export default function InfiniteProposalOverviews({ 
  initialProposals = [],
  dummyProposals = [],
  pageSize = 100,
  daoType = 'lilnouns'
}: InfiniteProposalOverviewsProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteProposals({ pageSize, daoType });

  const { ref, inView } = useInView();

  // Use metagov hook only for Nouns DAO proposals
  const enableMetagov = daoType === 'nouns';
  const { metagovProposals, isLoading: isLoadingMetagov } = useSnapshotMetagov(
    initialProposals,
    enableMetagov
  );

  // Automatically fetch next page when loading area comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all proposals from pages and merge with dummy proposals
  const allProposals = useMemo(() => {
    let proposals: ProposalOverview[] = [];
    
    if (data?.pages && data.pages.length > 0) {
      proposals = data.pages.flatMap(page => page.proposals);
    } else {
      proposals = initialProposals;
    }
    
    // Merge dummy proposals, avoiding duplicates by ID
    const proposalIds = new Set(proposals.map(p => p.id));
    const newDummyProposals = dummyProposals.filter(d => !proposalIds.has(d.id));
    
    return [...proposals, ...newDummyProposals];
  }, [data?.pages, initialProposals, dummyProposals]);

  // Use metagov proposals if enabled
  // IMPORTANT: Always use DAO proposal state for filtering/categorization
  // Metagov state is only for display badges, not for filtering
  const proposalsToDisplay = enableMetagov ? metagovProposals.map(mp => mp.daoProposal) : allProposals;
  const metagovMap = new Map(metagovProposals.map(mp => [mp.daoProposal.id, mp]));

  // Categorize proposals - use metagov state for Nouns DAO to prioritize Snapshot voting
  const { activeProposals, upcomingProposals, pastProposals } = useMemo(() => {
    // For Nouns DAO: Use metagov state to determine Active (Snapshot vote is what matters for metagov)
    // For Lil Nouns: Use DAO state as normal
    const active = proposalsToDisplay.filter((p) => {
      const daoState = p.state;

      // For Nouns DAO, check if Snapshot vote is active
      if (enableMetagov) {
        const metagov = metagovMap.get(p.id);
        if (metagov?.combinedState === "metagov_active") {
          return true; // Snapshot vote is active, show in Active section
        }
      }

      return daoState === "active";
    });
    const upcoming = proposalsToDisplay.filter((p) => {
      const daoState = p.state;

      // For Nouns DAO, don't show as upcoming if Snapshot is active
      if (enableMetagov) {
        const metagov = metagovMap.get(p.id);
        if (metagov?.combinedState === "metagov_active") {
          return false; // Already shown in Active section
        }
      }

      return daoState === "pending" || daoState === "updatable";
    });
    const past = proposalsToDisplay.filter((p) => {
      const daoState = p.state;
      return daoState === "successful" ||
        daoState === "failed" ||
        daoState === "executed" ||
        daoState === "cancelled" ||
        daoState === "vetoed" ||
        daoState === "expired" ||
        daoState === "queued";
    });

    // Debug logging to see what states we're getting
    console.log('📊 Proposal categorization:', {
      total: allProposals.length,
      active: active.length,
      upcoming: upcoming.length,
      past: past.length,
      '🟢 Active proposals': active.map(p => ({
        id: p.id,
        state: p.state,
        title: p.title.substring(0, 30),
        endBlock: p.votingEndBlock
      })),
      '⏰ All states sample (first 10)': allProposals.slice(0, 10).map(p => ({
        id: p.id,
        state: p.state,
        endBlock: p.votingEndBlock
      }))
    });

    return {
      activeProposals: active,
      upcomingProposals: upcoming,
      pastProposals: past
    };
  }, [proposalsToDisplay]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-content-secondary">Failed to load proposals</p>
        <p className="text-sm text-content-tertiary">
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </p>
      </div>
    );
  }

  if (isLoading && allProposals.length === 0) {
    return (
      <div className="flex flex-col gap-14">
        <div className="flex flex-col gap-4">
          <h2 className="heading-6">Active</h2>
          <LoadingSkeletons
            count={3}
            className="h-[85px] w-full rounded-[16px]"
          />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="heading-6">Upcoming</h2>
          <LoadingSkeletons
            count={3}
            className="h-[85px] w-full rounded-[16px]"
          />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="heading-6">Past</h2>
          <LoadingSkeletons
            count={20}
            className="h-[85px] w-full rounded-[16px]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-4">
        <h2 className="heading-6">Active</h2>
        <FilteredProposalOverviews 
          overviews={activeProposals} 
          type="active" 
          metagovMap={enableMetagov ? metagovMap : undefined}
          isNounsDao={enableMetagov}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="heading-6">Upcoming</h2>
        <FilteredProposalOverviews 
          overviews={upcomingProposals} 
          type="upcoming" 
          metagovMap={enableMetagov ? metagovMap : undefined}
          isNounsDao={enableMetagov}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="heading-6">Past</h2>
        <FilteredProposalOverviews 
          overviews={pastProposals} 
          type="past" 
          metagovMap={enableMetagov ? metagovMap : undefined}
          isNounsDao={enableMetagov}
        />
      </div>

      {/* Infinite scroll trigger and loading indicator */}
      {(hasNextPage || isFetchingNextPage) && (
        <div ref={ref} className="flex justify-center py-4">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size={20} />
              <span className="text-sm text-content-secondary">Loading more proposals...</span>
            </div>
          ) : (
            <div className="h-4" />
          )}
        </div>
      )}

      {/* {!hasNextPage && allProposals.length > 0 && (
        <div className="flex justify-center py-4">
          <span className="text-sm text-content-tertiary">No more proposals</span>
        </div>
      )} */}
    </div>
  );
}