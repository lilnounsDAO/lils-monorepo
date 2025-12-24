"use client";
import { ScreenSize, useScreenSize } from "@/hooks/useScreenSize";
import { ReactNode } from "react";

interface ResponseContentProps {
  children: ReactNode;
  screenSizes: ScreenSize[];
}

export function ResponsiveContent({
  children,
  screenSizes,
}: ResponseContentProps) {
  const actualScreenSize = useScreenSize();
  // Return null instead of undefined for consistency
  // Also handle initial undefined state - assume lg if screenSizes includes lg
  if (actualScreenSize === undefined && screenSizes.includes("lg")) {
    // During SSR/hydration, assume lg breakpoint if it's in the allowed sizes
    // This prevents hydration mismatches
    return <>{children}</>;
  }
  if (screenSizes.includes(actualScreenSize)) {
    return <>{children}</>;
  }
  return null;
}
