"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils/shadcn';
import { VrgdaFilterSection } from './VrgdaFilterSection';
import {
  VRGDA_TRAITS_BY_TYPE,
  VrgdaTraitType,
  VRGDA_BACKGROUND_TRAITS,
  VRGDA_BODY_TRAITS,
  VRGDA_ACCESSORY_TRAITS,
  VRGDA_HEAD_TRAITS,
  VRGDA_GLASSES_TRAITS
} from '@/data/vrgda/vrgdaTraits';

interface VrgdaTraitFilter {
  background?: number[];
  body?: number[];
  accessory?: number[];
  head?: number[];
  glasses?: number[];
}

interface VrgdaFilterSidebarNewProps {
  activeFilters: VrgdaTraitFilter;
  onFiltersChange: (filters: VrgdaTraitFilter) => void;
  onClearFilters: () => void;
  onClose?: () => void;
}

export const VrgdaFilterSidebarNew: React.FC<VrgdaFilterSidebarNewProps> = ({
  activeFilters,
  onFiltersChange,
  onClearFilters,
  onClose
}) => {
  
  const handleTraitFilterChange = (traitType: VrgdaTraitType, selectedTraits: number[]) => {
    onFiltersChange({
      ...activeFilters,
      [traitType]: selectedTraits.length > 0 ? selectedTraits : undefined
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) => {
      return count + (values?.length || 0);
    }, 0);
  };


  const filterCount = getActiveFilterCount();

  return (
    <div className="w-64 h-full border-r border-gray-200 bg-white flex flex-col relative">
      {/* Toggle Button */}
      <div className="absolute -right-3 top-4 z-10">
        <motion.button
          onClick={() => onClose?.()}
          className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Close filters"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </div>

      {/* Sidebar Content */}
      <div className="p-4 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex w-full items-center justify-between bg-white mb-2">
          <h3 className="text-lg font-semibold">Filter</h3>
        </div>
        <Separator className="h-[2px] mb-4" />

        {/* Filter count indicator with X to clear */}
        {filterCount > 0 && (
          <motion.div
            className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-blue-100 transition-colors"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={onClearFilters}
          >
            <span className="text-sm font-medium text-blue-800">
              {filterCount} filter{filterCount !== 1 ? 's' : ''} active
            </span>
            <button 
              className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClearFilters();
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Trait Filters - Scrollable with Accordion */}
        <div className="flex-1 overflow-y-auto pr-2">
          <Accordion type="multiple">
            <VrgdaFilterSection 
              traitType="background" 
              traits={VRGDA_BACKGROUND_TRAITS}
              activeFilters={activeFilters.background || []}
              onFiltersChange={handleTraitFilterChange}
            />
            <VrgdaFilterSection 
              traitType="glasses" 
              traits={VRGDA_GLASSES_TRAITS}
              activeFilters={activeFilters.glasses || []}
              onFiltersChange={handleTraitFilterChange}
            />
            <VrgdaFilterSection 
              traitType="head" 
              traits={VRGDA_HEAD_TRAITS}
              activeFilters={activeFilters.head || []}
              onFiltersChange={handleTraitFilterChange}
            />
            <VrgdaFilterSection 
              traitType="body" 
              traits={VRGDA_BODY_TRAITS}
              activeFilters={activeFilters.body || []}
              onFiltersChange={handleTraitFilterChange}
            />
            <VrgdaFilterSection 
              traitType="accessory" 
              traits={VRGDA_ACCESSORY_TRAITS}
              activeFilters={activeFilters.accessory || []}
              onFiltersChange={handleTraitFilterChange}
            />
          </Accordion>
        </div>

      </div>
    </div>
  );
};