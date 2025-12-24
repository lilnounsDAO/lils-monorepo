"use client";
import { NounTrait, NounTraitType } from "@/data/noun/types";
import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { ONLY_TREASURY_NOUNS_FILTER_KEY } from "./TreasuryNounFilter";
import { X } from "lucide-react";
import { ACCESSORY_TRAITS, BACKGROUND_TRAITS, BODY_TRAITS, GLASSES_TRAITS, HEAD_TRAITS } from ".";
import { useNounFilters } from "@/hooks/useNounFilters";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { scrollToNounExplorer } from "@/utils/scroll";
import { BUY_NOW_FILTER_KEY } from "./BuyNowFilter";
import { traitNameToSlug, slugToSeed } from "@/utils/traitUrlHelpers";

export type SortOrder = "newest" | "oldest";

export function ActiveFilters({ numNouns, onSortChange }: { numNouns: number; onSortChange?: (sort: SortOrder) => void }) {
  const { background, head, glasses, body, accessory, heldByTreasury, buyNow, totalCount } =
    useNounFilters();

  return (
    <motion.div 
      layout
      className={clsx("flex items-center gap-2 bg-white md:py-4", totalCount > 0 ? "py-2" : "py-0")}
    >
      <h5 className="hidden md:flex">Filters</h5>
      <motion.div 
        layout
        className="bg-background-secondary text-content-secondary label-sm mr-2 hidden h-6 w-6 items-center justify-center rounded-[4px] md:flex"
      >
        <motion.span
          key={totalCount}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {totalCount}
        </motion.span>
      </motion.div>
      <div className="no-scrollbar flex w-full min-w-0 flex-row items-center gap-2 overflow-x-auto">
        <AnimatePresence mode="popLayout">
          {heldByTreasury && <ActiveFilterItem seed={"1"} type="heldByTreasury" key={"heldByTreasury"} />}
          {buyNow && <ActiveFilterItem seed={"1"} type="buyNow" key={"buyNow"} />}
          {background.map((seed) => (
            <ActiveFilterItem seed={seed} type="background" key={"background" + seed} />
          ))}
          {head.map((seed) => (
            <ActiveFilterItem seed={seed} type="head" key={"head" + seed} />
          ))}
          {glasses.map((seed) => (
            <ActiveFilterItem seed={seed} type="glasses" key={"glasses" + seed} />
          ))}
          {body.map((seed) => (
            <ActiveFilterItem seed={seed} type="body" key={"body" + seed} />
          ))}
          {accessory.map((seed) => (
            <ActiveFilterItem seed={seed} type="accessory" key={"accessory" + seed} />
          ))}
        </AnimatePresence>
      </div>
      <div className="hidden shrink-0 items-center gap-3 pl-4 md:flex">
        <motion.h6
          key={numNouns}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          title={`Showing ${numNouns} lil nouns matching current filters`}
        >
          {numNouns} lil nouns
        </motion.h6>
        <select 
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          onChange={(e) => onSortChange?.(e.target.value as SortOrder)}
          defaultValue="newest"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </motion.div>
  );
}

interface ActiveFilterItemInterface {
  type: NounTraitType | "heldByTreasury" | "buyNow";
  seed: string;
}

function ActiveFilterItem({ type, seed }: ActiveFilterItemInterface) {
  const [searchParams, setSearchParams] = useSearchParams();

  const removeFilter = useCallback(
    (type: ActiveFilterItemInterface["type"], seed: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (type == "heldByTreasury") {
        if (params.get(ONLY_TREASURY_NOUNS_FILTER_KEY) === "1") {
          params.delete(ONLY_TREASURY_NOUNS_FILTER_KEY);
          setSearchParams(params, { replace: false });
        }
      } else if (type == "buyNow") {
        if (params.get(BUY_NOW_FILTER_KEY) === "1") {
          params.delete(BUY_NOW_FILTER_KEY);
          setSearchParams(params, { replace: false });
        }
      } else {
        // Use new format: traitType=trait-slug (e.g., head=cool-cat)
        const filterKey = type;
        
        // Find the trait by seed and get its slug
        const trait = getTraitBySeed(type, seed);
        if (!trait) return;
        
        const traitSlug = traitNameToSlug(trait.name);
        
        // Remove old format if present (for migration)
        params.delete(`${filterKey}[]`);
        
        // Remove the filter (single value format)
        params.delete(filterKey);

        setSearchParams(params, { replace: false });
      }
      scrollToNounExplorer();
    },
    [searchParams, setSearchParams]
  );

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => removeFilter(type, seed)}
      className="bg-background-secondary text-content-secondary label-sm flex items-center justify-center whitespace-pre rounded-[9px] px-[10px] py-2 hover:brightness-95"
    >
      {type === "heldByTreasury" ? (
        <span className="text-content-primary">Treasury Lil Nouns</span>
      ) : type === "buyNow" ? (
        <span className="text-content-primary">Buy Now</span>
      ) : (
        <>
          <span>{type}: </span>
          <span className="text-content-primary">{getNameForTrait(type, seed)}</span>
        </>
      )}
      <X size={16} strokeWidth={3} className="stroke-content-secondary ml-2" />
    </motion.button>
  );
}

function getNameForTrait(traitType: NounTraitType, seed: string) {
  let traits: NounTrait[] = [];

  switch (traitType) {
    case "background":
      traits = BACKGROUND_TRAITS;
      break;
    case "head":
      traits = HEAD_TRAITS;
      break;
    case "glasses":
      traits = GLASSES_TRAITS;
      break;
    case "body":
      traits = BODY_TRAITS;
      break;
    case "accessory":
      traits = ACCESSORY_TRAITS;
      break;
  }

  return traits.find((trait) => trait.seed === parseInt(seed))?.name;
}

function getTraitBySeed(traitType: NounTraitType, seed: string): NounTrait | null {
  let traits: NounTrait[] = [];

  switch (traitType) {
    case "background":
      traits = BACKGROUND_TRAITS;
      break;
    case "head":
      traits = HEAD_TRAITS;
      break;
    case "glasses":
      traits = GLASSES_TRAITS;
      break;
    case "body":
      traits = BODY_TRAITS;
      break;
    case "accessory":
      traits = ACCESSORY_TRAITS;
      break;
  }

  return traits.find((trait) => trait.seed === parseInt(seed)) || null;
}
