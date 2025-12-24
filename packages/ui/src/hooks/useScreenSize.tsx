"use client";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

export type ScreenSize = "sm" | "md" | "lg" | undefined;

// Using standard Tailwind breakpoints
const BREAKPOINTS = {
  md: "768px",
  lg: "1024px",
} as const;

export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>(undefined);

  const md = useMediaQuery(`(min-width: ${BREAKPOINTS.md})`);
  const lg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg})`);

  useEffect(() => {
    setScreenSize(lg ? "lg" : md ? "md" : "sm");
  }, [md, lg]);

  return screenSize;
}
