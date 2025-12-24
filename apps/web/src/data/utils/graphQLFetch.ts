import { GraphQLError, print } from "graphql";
import { TypedDocumentString as SubgraphTypedDocumentString } from "../generated/gql/graphql";
import { TypedDocumentString as PonderTypedDocumentString } from "../generated/ponder/graphql";
import { TypedDocumentString as CmsTypedDocumentString } from "../generated/cms/graphql";
import { safeFetch } from "@/utils/safeFetch";

type GraphQLResponse<Data> = { data: Data } | { errors: GraphQLError[] };

export interface CacheConfig {
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

export async function graphQLFetch<Result, Variables>(
  url: string,
  query:
    | SubgraphTypedDocumentString<Result, Variables>
    | PonderTypedDocumentString<Result, Variables>
    | CmsTypedDocumentString<Result, Variables>
    | any, // Also accept DocumentNode from CMS graphql()
  variables?: Variables,
  cacheConfig?: CacheConfig,
): Promise<Result | null> {
  // Handle both TypedDocumentString (has toString()) and DocumentNode (needs print())
  let queryString = "";
  if (query) {
    // Check if it's a DocumentNode (has 'kind' property) - used by CMS
    if (typeof query === 'object' && 'kind' in query) {
      queryString = print(query);
    } else if (typeof query.toString === 'function') {
      // TypedDocumentString has toString() method
      queryString = query.toString();
    } else {
      console.error("graphQLFetch: Unknown query type", query);
      queryString = "";
    }
  }
  
  console.log("graphQLFetch: URL", url);
  console.log("graphQLFetch: Query string", queryString);
  console.log("graphQLFetch: Variables", variables);
  console.log("graphQLFetch: Cache config", cacheConfig);
  
  const requestBody = JSON.stringify({
    query: queryString,
    variables,
  });
  
  console.log("graphQLFetch: Request body", requestBody);
  
  const result = await safeFetch<GraphQLResponse<Result>>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: requestBody,
    cache: cacheConfig?.cache,
    next: cacheConfig?.next,
  });
  
  console.log("graphQLFetch: Result", result);
  console.log("graphQLFetch: Result type", typeof result);
  console.log("graphQLFetch: Result keys", result ? Object.keys(result) : 'null');

  if (!result) {
    console.log("graphQLFetch: Result is null, returning null");
    return null;
  }

  // Handle array responses (error format from some endpoints)
  if (Array.isArray(result)) {
    console.error(
      "GraphQL Error (array format):",
      `${url} - ${result[0]?.message || JSON.stringify(result)} - ${query} - ${JSON.stringify(variables)}`,
    );
    return null;
  }

  if ("errors" in result) {
    console.error(
      "GraphQL Error:",
      `${url} - ${result.errors[0].message} - ${query} - ${JSON.stringify(variables)}`,
    );
    return null;
  }

  console.log("graphQLFetch: Returning data", result.data);
  return result.data;
}

export async function graphQLFetchWithFallback<Result, Variables>(
  url: { primary: string; fallback: string },
  query:
    | SubgraphTypedDocumentString<Result, Variables>
    | PonderTypedDocumentString<Result, Variables>,
  variables?: Variables,
  cacheConfig?: CacheConfig,
): Promise<Result | null> {
  let result = await graphQLFetch(url.primary, query, variables, cacheConfig);

  if (!result) {
    console.log("Graphql primary failed, trying fallback...");
    result = await graphQLFetch(url.fallback, query, variables, cacheConfig);
  }

  return result;
}
