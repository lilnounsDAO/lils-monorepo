"use client";
import { Noun } from "@/data/noun/types";
import { useState } from "react";
import { motion } from "framer-motion";
import NounGrid from "./NounGrid/NounGrid";
import NounFilter from "./NounFilter";
import { ActiveFilters, SortOrder } from "./NounFilter/ActiveFilters";
import { useFilterEngine } from "@/contexts/FilterEngineContext";

interface NounExplorerProps {
  nouns: Noun[];
  onSortChange?: (sortOrder: SortOrder) => void;
}

export default function NounExplorer({
  nouns,
  onSortChange
}: NounExplorerProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const { filteredNounCount } = useFilterEngine();

  const handleSortChange = (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
    onSortChange?.(newSortOrder);
  };

  return (
    <motion.div
      layout
      className="flex w-full flex-col md:flex-row md:gap-8"
      id="explore-section"
    >
      {/* Filter Sidebar */}
      <motion.div layout className="shrink-0">
        <NounFilter />
      </motion.div>
      
      {/* Main Content Area */}
      <motion.div layout className="flex min-w-0 flex-[2] flex-col">
        <motion.div layout className="sticky top-[63px] z-[8]">
          <ActiveFilters 
            numNouns={filteredNounCount > 0 ? filteredNounCount : nouns.length} 
            onSortChange={handleSortChange} 
          />
        </motion.div>
        
        <div className="min-h-[calc(100dvh-108px)] md:min-h-[calc(100vh-64px)]">
          <NounGrid nouns={nouns} />
          
          {/* Simple status message */}
          {nouns.length > 0 && (
            <div className="flex justify-center items-center py-8 text-gray-500 text-sm">
              Showing {nouns.length} of {filteredNounCount} nouns
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

