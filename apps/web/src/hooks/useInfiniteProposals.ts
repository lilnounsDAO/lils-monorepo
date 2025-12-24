"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ProposalOverview } from "@/data/goldsky/governance/common";
import { getProposalOverviewsPaginated } from "@/data/goldsky/governance/getProposalOverviewsVersioned";
import { DaoType } from "@/data/goldsky/governance/getProposalOverviews";

interface UseInfiniteProposalsParams {
  pageSize?: number;
  enabled?: boolean;
  daoType?: DaoType;
}

interface InfiniteProposalsPage {
  proposals: ProposalOverview[];
  hasMore: boolean;
  page: number;
}

async function fetchProposalPage(pageParam: number, pageSize: number, daoType: DaoType): Promise<InfiniteProposalsPage> {
  try {
    const data = await getProposalOverviewsPaginated(pageParam, pageSize, daoType);
    return {
      ...data,
      page: pageParam,
    };
  } catch (error) {
    console.error('Failed to fetch proposals:', error);
    throw new Error('Failed to fetch proposals');
  }
}

export function useInfiniteProposals({ 
  pageSize = 100, 
  enabled = true,
  daoType = 'lilnouns'
}: UseInfiniteProposalsParams = {}) {
  return useInfiniteQuery({
    queryKey: ["infinite-proposals", pageSize, daoType],
    queryFn: ({ pageParam }) => fetchProposalPage(pageParam, pageSize, daoType),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}