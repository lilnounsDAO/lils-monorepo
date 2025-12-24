import { ReactNode } from "react";

export function CurrentAuctionPrefetchWrapper({
  children,
}: {
  children: ReactNode;
}) {
  // In a client-side environment, we don't need prefetching
  // React Query will handle data fetching on demand
  return <>{children}</>;
}
