"use client";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { VrgdaFilterTraitItem } from "./VrgdaFilterTraitItem";
import { VrgdaTrait, VrgdaTraitType } from "@/data/vrgda/vrgdaTraits";
import { capitalizeFirstLetterOfEveryWord } from "@/utils/format";
import { useMemo, useState } from "react";

const MIN_TRAITS_FOR_SEARCH = 5;

interface VrgdaFilterSectionProps {
  traitType: VrgdaTraitType;
  traits: VrgdaTrait[];
  activeFilters: number[];
  onFiltersChange: (traitType: VrgdaTraitType, selectedTraits: number[]) => void;
}

export function VrgdaFilterSection({ 
  traitType, 
  traits, 
  activeFilters,
  onFiltersChange 
}: VrgdaFilterSectionProps) {
  const [searchFilter, setSearchFilter] = useState<string>("");

  const filteredTraits = useMemo(() => {
    return traits.filter((trait) =>
      trait.name.toLowerCase().includes(searchFilter.toLowerCase()),
    );
  }, [traits, searchFilter]);

  return (
    <AccordionItem value={traitType}>
      <AccordionTrigger className="heading-6">
        {capitalizeFirstLetterOfEveryWord(traitType)}
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-2">
        {traits.length > MIN_TRAITS_FOR_SEARCH && (
          <Input
            placeholder="Search"
            value={searchFilter}
            onChange={(event) => setSearchFilter(event.target.value)}
            className="focus-visible:ring-0"
          />
        )}
        <div className="flex max-h-[500px] flex-col gap-2 overflow-y-auto">
          {filteredTraits.length > 0 ? (
            filteredTraits.map((trait) => (
              <VrgdaFilterTraitItem
                key={`${traitType}-${trait.seed}`}
                traitType={traitType}
                trait={trait}
                isChecked={activeFilters.includes(trait.seed)}
                onToggle={(checked) => {
                  const newFilters = checked 
                    ? [...activeFilters, trait.seed]
                    : activeFilters.filter(f => f !== trait.seed);
                  onFiltersChange(traitType, newFilters);
                }}
              />
            ))
          ) : (
            <div className="flex w-full items-center justify-center text-content-secondary">
              No results.
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}