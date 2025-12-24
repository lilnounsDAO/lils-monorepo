import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
import { CHAIN_CONFIG } from '@/config';

export const CLEAN_GRAPHQL_ENDPOINT = CHAIN_CONFIG.indexerUrl;

export interface GraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: Array<string | number>;
  }>;
}

export async function cleanGraphQLFetch<TResult, TVariables>(
  document: DocumentTypeDecoration<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never>
    ? []
    : [variables: TVariables]
): Promise<TResult> {
  const response = await fetch(CLEAN_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: document.toString(),
      variables: variables ?? {},
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}: ${response.statusText}`);
  }

  const result: GraphQLResponse<TResult> = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL query');
  }

  return result.data;
}
