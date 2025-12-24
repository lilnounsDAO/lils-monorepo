"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { getPartNameForTrait } from '@/utils/nounImages/traitNames';

interface TraitFilter {
  background?: number[];
  body?: number[];
  accessory?: number[];
  head?: number[];
  glasses?: number[];
}

interface VrgdaFilterSidebarProps {
  availableTraits: {
    background: number[];
    body: number[];
    accessory: number[];
    head: number[];
    glasses: number[];
  };
  activeFilters: TraitFilter;
  onFiltersChange: (filters: TraitFilter) => void;
  onOpenComboBuilder: () => void;
  onClearFilters: () => void;
  onClose?: () => void;
}

// Sidebar toggle icon component
const SidebarIcon = ({ isOpen }: { isOpen: boolean }) => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="text-gray-600"
    animate={{ rotate: isOpen ? 0 : 180 }}
    transition={{ duration: 0.2 }}
  >
    <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h8v2H2v-2z" />
  </motion.svg>
);

export const VrgdaFilterSidebar: React.FC<VrgdaFilterSidebarProps> = ({
  availableTraits,
  activeFilters,
  onFiltersChange,
  onOpenComboBuilder,
  onClearFilters,
  onClose
}) => {
  // Sidebar is always "open" when visible since it's controlled externally

  const handleTraitToggle = (category: keyof TraitFilter, value: number) => {
    const currentValues = activeFilters[category] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...activeFilters,
      [category]: newValues.length > 0 ? newValues : undefined
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) => {
      return count + (values?.length || 0);
    }, 0);
  };

  // Sidebar is always fully visible when rendered

  const filterCount = getActiveFilterCount();

  return (
    <div className="w-64 h-full border-r border-gray-200 bg-gray-50 flex flex-col relative">
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              {filterCount > 0 && (
                <motion.span
                  className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {filterCount}
                </motion.span>
              )}
            </div>

            {/* Build a Noun Button */}
            <Button 
              onClick={onOpenComboBuilder}
              variant="outline" 
              className="w-full mb-4 text-sm"
              size="sm"
            >
              🔧 Build a Noun
            </Button>

            {/* Individual Trait Filters - Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {Object.entries(availableTraits).map(([category, values]) => (
                <motion.div 
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * Object.keys(availableTraits).indexOf(category) }}
                >
                  <h4 className="font-medium mb-2 capitalize text-gray-700 text-sm">{category}</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {values.map(value => {
                      const isActive = activeFilters[category as keyof TraitFilter]?.includes(value) || false;
                      return (
                        <motion.label 
                          key={value}
                          className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleTraitToggle(category as keyof TraitFilter, value)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
                          />
                          <span className={isActive ? 'text-blue-700 font-medium' : 'text-gray-600'}>
                            {getPartNameForTrait(category, value)}
                          </span>
                        </motion.label>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Clear Filters Button */}
            <AnimatePresence>
              {filterCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    onClick={onClearFilters}
                    variant="outline" 
                    size="sm"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    Clear All Filters
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
    </div>
  );
};