"use client";
import NounCard from "../../NounCard";
import { Noun } from "@/data/noun/types";
import AnimationGird from "./AnimationGrid";
import { VirtuosoGrid } from "react-virtuoso";
import React, { forwardRef, useEffect, useMemo, useState } from "react";
import { LinkShallow } from "../../ui/link";
import { ClearAllFiltersButton } from "../NounFilter/ClearAllFiltersButton";

interface NounGridInterface {
  nouns: Noun[];
  onEndReached?: () => void;
  hasMore?: boolean;
}

export default function NounGrid({ nouns, onEndReached, hasMore }: NounGridInterface) {
  // Once virtualization is enabled (>= threshold), keep it on to avoid component swap flicker
  const VIRTUALIZE_THRESHOLD = 300;
  const [virtualize, setVirtualize] = useState(nouns.length >= VIRTUALIZE_THRESHOLD);
  useEffect(() => {
    if (nouns.length >= VIRTUALIZE_THRESHOLD && !virtualize) setVirtualize(true);
  }, [nouns.length, virtualize]);
  // Map nouns to card items - nouns array now has stable object identity from hook
  const nounCards = useMemo(() => {
    console.log('🔄 NounGrid: Generating cards for', nouns.length, 'nouns');
    
    return nouns.map((noun) => ({
      element: (
        <LinkShallow
          searchParam={{ name: "lilnounId", value: noun.id }}
          key={noun.id}
          className="block aspect-square h-full w-full"
        >
          <NounCard
            noun={noun}
            enableHover
            lazyLoad={false}
            animationDelay={0}
            key={noun.id}
          />
        </LinkShallow>
      ) as React.ReactNode,
      id: Number(noun.id),
    }));
  }, [nouns]);

  return (
    <div className="relative w-full pb-24 pt-[8px] md:pt-0 h-full">
      {nounCards.length === 0 ? (
        <div className="flex h-fit grow flex-col items-center justify-center gap-2 rounded-3xl border-4 border-gray-200 px-4 py-24 text-center">
          <h4>No Nouns found.</h4>
          <ClearAllFiltersButton className="text-semantic-accent heading-6 clickable-active">
            Clear all filters
          </ClearAllFiltersButton>
        </div>
      ) : !virtualize ? (
        // Small/medium lists: use animated grid
        <AnimationGird items={nounCards} />
      ) : (
        // Large lists: virtualized grid to reduce memory and re-render cost
        <VirtuosoGrid
          // Use window scrolling to avoid double-scroll issues
          useWindowScroll
          style={{ width: "100%" }}
          totalCount={nounCards.length}
          overscan={200}
          components={{
            List: GridListContainer as any,
            Item: GridItemContainer as any,
          }}
          itemKey={(index) => String(nounCards[index]?.id ?? index)}
          endReached={() => {
            // Guard against accidental clears; only call when we actually have more
            if (hasMore && onEndReached) onEndReached();
          }}
          itemContent={(index) => nounCards[index]?.element}
        />
      )}
    </div>
  );
}

// Virtuoso Grid containers
const GridListContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ style, className, children, ...props }, ref) => (
    <div
      ref={ref}
      style={style}
      className={
        "grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4 items-stretch justify-stretch " +
        (className ?? "")
      }
      {...props}
    >
      {children}
    </div>
  )
);

const GridItemContainer = (
  props: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
) => (
  <div {...props} className={"flex aspect-square w-full p-0 m-0"} />
);
