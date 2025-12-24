// Simple in-memory cache replacement for unstable_cache in Vite environment
const cache = new Map<string, { data: any; timestamp: number; revalidate: number }>();

export function unstable_cache<T extends (...args: any[]) => any>(
  fn: T,
  keyParts: string[],
  options: { revalidate?: number; tags?: string[] } = {}
): T {
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify([...keyParts, ...args]);
    const cached = cache.get(key);
    const now = Date.now();
    
    // Check if cached data is still valid
    if (cached && (now - cached.timestamp) < (cached.revalidate * 1000)) {
      return cached.data;
    }
    
    // Execute function and cache result
    const result = fn(...args);
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then((data) => {
        cache.set(key, {
          data,
          timestamp: now,
          revalidate: options.revalidate || 3600 // Default 1 hour
        });
        return data;
      });
    }
    
    // Handle synchronous results
    cache.set(key, {
      data: result,
      timestamp: now,
      revalidate: options.revalidate || 3600 // Default 1 hour
    });
    
    return result;
  }) as T;
}

// No-op replacements for Next.js specific functions
export function revalidateTag(_tag: string) {
  // No-op in Vite environment
}
