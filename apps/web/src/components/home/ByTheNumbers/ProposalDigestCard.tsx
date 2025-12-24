import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProposalOverviewsDigest } from "@/data/goldsky/governance/getProposalOverviews";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

type ProposalOverview = {
  id: number | string;
  title: string;
  state: string;
};

type ProposalDigestCardProps = {
  className?: string;
};

export const ProposalDigestCard: React.FC<ProposalDigestCardProps> = ({
  className = "",
}) => {
  const [isPaused, setIsPaused] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["proposal-overviews-digest", 10],
    queryFn: async () => getProposalOverviewsDigest(10),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Log error details for debugging
  if (isError && error) {
    console.error('ProposalDigestCard: Failed to load proposals from Goldsky', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`w-full h-full flex items-center justify-center rounded-[16px] bg-[#F3F4F6] ${className}`}>
        <span className="text-content-secondary">Loading proposals...</span>
      </div>
    );
  }

  // Show error state with more detail
  if (isError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center gap-2 rounded-[16px] bg-[#F3F4F6] ${className}`}>
        <span className="text-red-500 font-semibold">Failed to load proposals</span>
        {error instanceof Error && (
          <span className="text-xs text-content-secondary max-w-md text-center">
            {error.message}
          </span>
        )}
      </div>
    );
  }

  // Normalize proposals (mapping to the minimal ProposalOverview type if needed)
  const proposals =
    data?.map((p: any) => ({
      id: p.id,
      title: p.title,
      state: p.state ?? p.status ?? "",
    })) ?? [];

  function badgeClasses(state: ProposalOverview['state']) {
    if (state === 'active') return 'bg-green-500 text-white';
    if (state === 'executed' || state === 'successful') return 'bg-indigo-500 text-white';
    if (state === 'failed' || state === 'cancelled' || state === 'expired' || state === 'vetoed') return 'bg-rose-500 text-white';
    return 'bg-gray-300 text-gray-800';
  }

  // If proposals are empty, render a placeholder message inside the scroll container.
  if (!proposals || proposals.length === 0) {
    return (
      <div className={`w-full h-full rounded-[16px] bg-[#F3F4F6] px-6 pt-8 pb-0 ${className}`}>
        {/* Header */}
        <div className="mb-6">
          <h3 className="font-bold text-[22px] leading-tight text-[#1F2937] mb-1">Governance steers the ship</h3>
          <p className="text-[16px] leading-[1.6] text-[#68778D] mt-0">
            Only through a proposal, can someone receive funding from our treasury. Proposals are voted on using lil nouns tokens. Every member has a say in what gets funded. These are our most recent proposals!
          </p>
        </div>

        {/* Pink frame acting as scroll container */}
        <div className="rounded-[20px] bg-[#FB4694] sm:pt-3 sm:pr-3 sm:pl-3 sm:pb-0 pt-4 pr-4 pl-4 pb-0 h-[300px] overflow-hidden flex items-center justify-center">
          <span className="text-white text-center w-full opacity-80">
            No proposals found.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full rounded-[16px] bg-[#F1F4F9] px-6 pt-6 pb-0 flex flex-col ${className} overflow-hidden`}>

      {/* Header */}
      <div className="mb-3">
      <h3 className="font-bold text-[22px] leading-tight text-[#1F2937] mb-1">Governance steers the ship</h3>
        <p className="text-[16px] leading-[1.6] text-[#68778D] mt-0">
          Lil Nouns holders decide how it's spent through permissionless on-chain voting. 1 token = 1 vote. The treasury has funded everything from documentaries to skate teams.
        </p>
      </div>

      {/* Pink frame acting as scroll container */}
      <div
        className="rounded-tl-[20px] rounded-tr-[20px] rounded-bl-none rounded-br-none border-r border-t border-l border-black bg-[#FB4694] sm:pt-3 sm:pr-3 sm:pl-3 sm:pb-0 pt-0 pr-4 pl-4 pb-0 overflow-hidden flex-1 m-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="h-full w-full bg-transparent overflow-hidden"
          style={{ scrollbarWidth: 'none' as any }}
        >
          {/* hide scrollbar webkit */}
          <style>{`::-webkit-scrollbar{display:none}`}</style>
          <motion.ul
            className="flex flex-col gap-2 py-0 pt-4"
            animate={
              isPaused
                ? {}
                : {
                    y: -proposals.length * 60,
                  }
            }
            transition={{
              duration: proposals.length * 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...proposals, ...proposals].map((p, idx) => (
              <motion.li
                key={`${p.id}-${idx}`}
                className="flex items-center justify-between rounded-[16px] bg-white border border-black pl-4 pr-2 py-2 gap-8 cursor-pointer overflow-hidden"
              >
                <Link
                  to={`/vote/${p.id}`}
                  className="flex items-center justify-between w-full gap-8"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-[16px] font-extrabold text-[#8C8D92]">{p.id}</div>
                    <div className="truncate font-bold text-[16px] text-[#111827]">{p.title}</div>
                  </div>
                  <span
                    className={`rounded-[8px] px-2 py-0.5 text-[14px] font-semibold ${badgeClasses(p.state)}`}
                  >
                    {p.state === 'failed' ? 'Defeated' : p.state.charAt(0).toUpperCase() + p.state.slice(1)}
                  </span>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </div>
  );
};
