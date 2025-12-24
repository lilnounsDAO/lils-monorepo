"use client";
import React from 'react';
import { Button } from '@/components/ui/button';

interface TraitFilter {
  background?: number[];
  body?: number[];
  accessory?: number[];
  head?: number[];
  glasses?: number[];
}

interface VrgdaTraitFilterProps {
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
}

export const VrgdaTraitFilter: React.FC<VrgdaTraitFilterProps> = ({
  availableTraits,
  activeFilters,
  onFiltersChange,
  onOpenComboBuilder,
  onClearFilters
}) => {
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

  return (
    <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filters</h3>
        {getActiveFilterCount() > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {getActiveFilterCount()}
          </span>
        )}
      </div>

      {/* Build a Noun Button */}
      <Button 
        onClick={onOpenComboBuilder}
        variant="outline" 
        className="w-full mb-4"
      >
        🔧 Build a Noun
      </Button>

      {/* Individual Trait Filters */}
      <div className="space-y-4">
        {Object.entries(availableTraits).map(([category, values]) => (
          <div key={category}>
            <h4 className="font-medium mb-2 capitalize">{category}</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {values.map(value => (
                <label 
                  key={value}
                  className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters[category as keyof TraitFilter]?.includes(value) || false}
                    onChange={() => handleTraitToggle(category as keyof TraitFilter, value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{category} {value}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Clear Filters */}
      {getActiveFilterCount() > 0 && (
        <Button 
          onClick={onClearFilters}
          variant="outline" 
          size="sm"
          className="w-full mt-4"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );
};
