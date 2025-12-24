"use client";
import { ButtonHTMLAttributes, useCallback } from "react";
import { ONLY_TREASURY_NOUNS_FILTER_KEY } from "./TreasuryNounFilter";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/utils/shadcn";
import { scrollToNounExplorer } from "@/utils/scroll";
import { BUY_NOW_FILTER_KEY } from "./BuyNowFilter";

export function ClearAllFiltersButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(ONLY_TREASURY_NOUNS_FILTER_KEY);
    params.delete(BUY_NOW_FILTER_KEY);
    // Remove new format
    params.delete("background");
    params.delete("head");
    params.delete("glasses");
    params.delete("accessory");
    params.delete("body");
    // Remove old format (for migration)
    params.delete("background[]");
    params.delete("head[]");
    params.delete("glasses[]");
    params.delete("accessory[]");
    params.delete("body[]");
    setSearchParams(params, { replace: false });
    scrollToNounExplorer();
  }, [searchParams, setSearchParams]);

  return <button onClick={() => clearAllFilters()} className={cn("hover:brightness-75", className)} {...props} />;
}
