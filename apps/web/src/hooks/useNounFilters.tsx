"use client";
import { BUY_NOW_FILTER_KEY } from "@/components/NounExplorer/NounFilter/BuyNowFilter";
import { ONLY_TREASURY_NOUNS_FILTER_KEY } from "@/components/NounExplorer/NounFilter/TreasuryNounFilter";
import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { slugToSeed } from "@/utils/traitUrlHelpers";
import { NounTraitType } from "@/data/noun/types";

interface NounFilters {
  background: string[];
  head: string[];
  glasses: string[];
  body: string[];
  accessory: string[];
  heldByTreasury: boolean;
  buyNow: boolean;
  totalCount: number;
}

/**
 * Parse URL params - supports both old format (background[]=0) and new format (background=cool)
 * Converts trait name slugs to seed numbers for internal use
 */
function parseTraitParams(
  searchParams: URLSearchParams,
  traitType: NounTraitType
): string[] {
  // Try new format first (head=cat) - single value format
  const newFormat = searchParams.get(traitType);
  if (newFormat) {
    // Convert slug to seed
    const seed = slugToSeed(newFormat, traitType);
    return seed !== null ? [String(seed)] : [];
  }
  
  // Fallback to old format (head[]=36) for backward compatibility
  const oldFormat = searchParams.getAll(`${traitType}[]`);
  return oldFormat;
}

export function useNounFilters(): NounFilters {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    if (!searchParams) {
      return {
        background: [],
        head: [],
        glasses: [],
        body: [],
        accessory: [],
        heldByTreasury: false,
        buyNow: false,
        totalCount: 0,
      };
    }
    
    const background = parseTraitParams(searchParams, "background");
    const head = parseTraitParams(searchParams, "head");
    const glasses = parseTraitParams(searchParams, "glasses");
    const body = parseTraitParams(searchParams, "body");
    const accessory = parseTraitParams(searchParams, "accessory");
    const heldByTreasury = searchParams.get(ONLY_TREASURY_NOUNS_FILTER_KEY) != null;
    const buyNow = searchParams.get(BUY_NOW_FILTER_KEY) != null;

    const totalCount =
      background.length +
      head.length +
      glasses.length +
      body.length +
      accessory.length +
      (heldByTreasury ? 1 : 0) +
      (buyNow ? 1 : 0);

    return {
      background,
      head,
      glasses,
      body,
      accessory,
      heldByTreasury,
      buyNow,
      totalCount,
    };
  }, [searchParams]);
}
