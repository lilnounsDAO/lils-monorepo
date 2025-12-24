"use client";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { logBrowserMemory } from "@/utils/memoryLogger";

export default function TanstackQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            staleTime: 1000 * 60, // 5 minutes
          },
        },
      })
  );

  useEffect(() => {
    logBrowserMemory("TanStack Query Provider Loaded");
    
    // Log memory every 30 seconds
    const interval = setInterval(() => {
      logBrowserMemory("TanStack Query - Periodic Check");
      
      // Log cache stats
      const cache = queryClient.getQueryCache();
      console.log(`🗄️ TanStack Query Cache: ${cache.getAll().length} queries cached`);
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
