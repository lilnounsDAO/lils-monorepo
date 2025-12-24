"use client";
import { NounTrait, NounTraitType } from "@/data/noun/types";
import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo, useRef } from "react";
import { FilterItemButton } from "./FilterItemButton";
import { scrollToNounExplorer } from "@/utils/scroll";
import Image from "@/components/OptimizedImage";
import { buildNounTraitImage } from "@/utils/nounImages/nounImage";
import { useInView } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilterEngine } from "@/contexts/FilterEngineContext";
import { traitNameToSlug } from "@/utils/traitUrlHelpers";

export interface FilterTraitItemProps {
  traitType: NounTraitType;
  trait: NounTrait;
}

// Helper to truncate name if too long
function truncateName(name: string, maxLength: number = 22

): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 1) + "…";
}

export function FilterTraitItem({ traitType, trait }: FilterTraitItemProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filterCounts } = useFilterEngine();

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref as any, { margin: "500px 0px" });

  // Use trait name slug instead of seed number in URL
  const traitSlug = useMemo(() => traitNameToSlug(trait.name), [trait.name]);
  const filterKey = useMemo(() => traitType, [traitType]); // No [] suffix

  const isChecked = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    // Check if this trait slug is set (single value format: head=cat)
    return params.get(filterKey) === traitSlug;
  }, [searchParams, filterKey, traitSlug]);

  const handleCheckChange = useCallback(
    (checked: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      
      // Remove old format if present (for migration)
      params.delete(`${filterKey}[]`);
      
      if (checked) {
        // Set single value: head=cat (replaces any existing value)
        params.set(filterKey, traitSlug);
      } else {
        // Remove the filter if unchecking
        params.delete(filterKey);
      }

      setSearchParams(params, { replace: false });
      scrollToNounExplorer();
    },
    [searchParams, setSearchParams, filterKey, traitSlug],
  );

  const traitImg = buildNounTraitImage(traitType, trait.seed);

  // Get count for this trait from filter engine
  const traitCount = useMemo(() => {
    if (!filterCounts) return null;
    return filterCounts[traitType]?.[trait.seed] || 0;
  }, [filterCounts, traitType, trait.seed]);

  // Truncate trait name if too long
  const displayName = useMemo(() => truncateName(trait.name, 15), [trait.name]);

  return (
    <FilterItemButton
      isChecked={isChecked}
      onClick={() => handleCheckChange(!isChecked)}
    >
      <div className="flex items-center gap-3" ref={ref}>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/5">
          {isInView ? (
          
          traitType === "glasses" ? (

            <Image
              src={traitImg}
              width={24}
              height={24}
              alt={trait.name}
              className="h-12 w-12 object-fill"
            />

          ) : (
            <Image
            src={traitImg}
            width={36}
            height={36}
            alt={trait.name}
            // className="object-contain"
            className="h-12 w-12 rounded-lg"
          />
          )

          ) : (
            <Skeleton className="h-9 w-9 rounded-md" />
          )}
        </div>
        <span className="overflow-hidden overflow-ellipsis whitespace-nowrap pr-2 flex flex-col items-start justify-center">
          <span className="overflow-hidden overflow-ellipsis whitespace-nowrap">
            {displayName}
          </span>
          {traitCount !== null && (
            <span className="text-xs text-gray-500 mt-0.5">
              {traitCount}
            </span>
          )}
        </span>
      </div>
    </FilterItemButton>
  );
}
