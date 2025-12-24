/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
import { parse } from 'graphql';

export type Maybe<T> = T | null;
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: string;
};

// GraphQL function that parses query strings and returns typed document nodes
export const graphql = (source: string): DocumentNode<any, any> => {
  try {
    return parse(source) as DocumentNode<any, any>;
  } catch (error) {
    console.error('GraphQL parse error:', error);
    return { kind: 'Document', definitions: [] } as any;
  }
};
