// Simple GraphQL function for Goldsky queries
// This is a minimal setup until proper codegen is configured

export function graphql(source: string) {
  return {
    kind: "Document" as const,
    definitions: [],
    loc: { start: 0, end: source.length }
  };
}