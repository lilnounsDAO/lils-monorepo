import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { print } from "graphql";
import { CHAIN_CONFIG } from "@/config";

/**
 * Goldsky GraphQL fetch utility for querying the Lil Nouns DAO subgraph
 * This replaces Ponder for governance, auction, and account data (excluding financial data)
 */
export const goldskyFetch = async <T>(
  query: TypedDocumentNode<T>,
  variables?: any,
  chainId = 1,
): Promise<T> => {
  // CHAIN_CONFIG is already chain-aware via detectChainFromHostname() in config.ts
  // It automatically selects the correct config (mainnet or sepolia) based on the hostname
  // Both mainnet and sepolia have their own goldskyUrl configurations
  // The chainId parameter is accepted for future use if explicit chain selection is needed
  const config = CHAIN_CONFIG;
  const url = config.goldskyUrl.primary;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: print(query),
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error("Goldsky GraphQL errors:", result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  } catch (error) {
    console.error("Goldsky fetch error:", error);
    
    // Fallback to secondary URL
    try {
      const fallbackResponse = await fetch(config.goldskyUrl.fallback, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: print(query),
          variables,
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Fallback HTTP error! status: ${fallbackResponse.status}`);
      }

      const fallbackResult = await fallbackResponse.json();
      
      if (fallbackResult.errors) {
        throw new Error(`Fallback GraphQL errors: ${JSON.stringify(fallbackResult.errors)}`);
      }

      return fallbackResult.data;
    } catch (fallbackError) {
      console.error("Goldsky fallback fetch error:", fallbackError);
      throw new Error(`Both Goldsky primary and fallback requests failed: ${error}, ${fallbackError}`);
    }
  }
};