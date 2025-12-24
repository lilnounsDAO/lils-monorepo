"use client";
import { VrgdaTrait, VrgdaTraitType } from "@/data/vrgda/vrgdaTraits";
import { useCallback, useRef } from "react";
import { VrgdaFilterItemButton } from "./VrgdaFilterItemButton";
import Image from "@/components/OptimizedImage";
import { buildNounTraitImage } from "@/utils/nounImages/nounImage";
import { NounTraitType } from "@/data/noun/types";
import { useInView } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export interface VrgdaFilterTraitItemProps {
  traitType: VrgdaTraitType;
  trait: VrgdaTrait;
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
}

export function VrgdaFilterTraitItem({ 
  traitType, 
  trait, 
  isChecked, 
  onToggle 
}: VrgdaFilterTraitItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref as any, { margin: "500px 0px" });

  const handleCheckChange = useCallback(() => {
    onToggle(!isChecked);
  }, [isChecked, onToggle]);

  // Generate isolated trait image using the same function as the original explore page
  const traitImg = buildNounTraitImage(traitType as NounTraitType, trait.seed);

  return (
    <VrgdaFilterItemButton
      isChecked={isChecked}
      onClick={handleCheckChange}
    >
      <div className="flex items-center gap-2" ref={ref}>
        {isInView ? (
          <Image 
            src={traitImg} 
            width={traitType === 'glasses' ? 48 : 32} 
            height={32} 
            alt={trait.name}
            className={traitType === 'glasses' ? 'w-12 h-8' : 'w-8 h-8'}
          />
        ) : (
          <Skeleton className={traitType === 'glasses' ? 'h-8 w-12' : 'h-8 w-8'} />
        )}
        <span className="overflow-hidden overflow-ellipsis whitespace-nowrap pr-2">
          {trait.name}
        </span>
      </div>
    </VrgdaFilterItemButton>
  );
}