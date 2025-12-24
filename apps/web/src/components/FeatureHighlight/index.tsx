"use client";

import { useSearchParams } from "react-router-dom";
import FeatureCard from "./FeatureCard";
import { useCallback } from "react";
import { ONLY_TREASURY_NOUNS_FILTER_KEY } from "../NounExplorer/NounFilter/TreasuryNounFilter";
import { scrollToNounExplorer } from "@/utils/scroll";

export default function FeatureHighlight() {
  const [searchParams] = useSearchParams();

  const handleTreasurySwapClick = useCallback(() => {
    const auctionId = searchParams.get("auctionId");
    const params = new URLSearchParams();

    // Clear all except auctionId
    params.set(ONLY_TREASURY_NOUNS_FILTER_KEY, "1");
    if (auctionId) {
      params.set("auctionId", auctionId);
    }

    // Add filter and scroll to explore
    window.history.pushState(null, "", `?${params.toString()}`);
    scrollToNounExplorer();
  }, [searchParams]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <FeatureCard
        title="Treasury Swaps"
        description="Trade your Noun for one in the treasury."
        cta="See Nouns"
        onCtaClick={() => handleTreasurySwapClick()}
        imgSrc="/feature/treasury-swap.png"
        className="bg-[#EDD4E4]"
      />
    </div>
  );
}
