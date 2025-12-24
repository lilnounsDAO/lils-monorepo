import { unstable_cache } from "@/utils/viteCache";

export async function safeFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    console.log("safeFetch: Starting fetch to", url);
    console.log("safeFetch: Options", options);
    
    const response = await fetch(url, options);
    
    console.log("safeFetch: Response status", response.status);
    console.log("safeFetch: Response statusText", response.statusText);
    console.log("safeFetch: Response headers", Object.fromEntries(response.headers.entries()));

    // Check if the response status is OK (status code 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      console.error("safeFetch: HTTP error response body", errorText);
      throw Error(
        `Http error: ${url} - ${response.status}, ${response.statusText}`,
      );
    }

    // Parse the response as JSON
    const data: T = await response.json();
    console.log("safeFetch: Parsed JSON data", data);
    return data;
  } catch (error) {
    // Catch any network errors or exceptions thrown by fetch
    // throw Error(`Network error: ${url} - ${error}`);
    console.error("safeFetch: Fetch error:", url, options, error);
    console.error("safeFetch: Error type:", typeof error);
    console.error("safeFetch: Error message:", error instanceof Error ? error.message : String(error));
    console.error("safeFetch: Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
}

type Callback = (...args: any[]) => Promise<any>;
export function safeUnstableCache<T extends Callback>(
  cb: T,
  keyParts?: string[],
  options?: {
    revalidate?: number | false;
    tags?: string[];
  },
) {
  return async function (...args: Parameters<T>) {
    try {
      return await unstable_cache(cb, keyParts, options)(...args);
    } catch (e) {
      console.error(`safeUnstableCache error ${e}`);
      return null;
    }
  } as (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | null>;
}
