export interface PonderNoun {
  id: string;
  owner: string;
  delegate?: string;
  background: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
  createdAt?: string; // BigInt timestamp
  updatedAt?: string; // BigInt timestamp
}

export interface NounsPaginatedResult {
  nouns: PonderNoun[];
  hasMore: boolean;
  total?: number;
}

export interface NounFilters {
  owner?: string;
  owners?: string[];
  delegate?: string;
  delegates?: string[];
  background?: number;
  backgrounds?: number[];
  body?: number;
  bodies?: number[];
  accessory?: number;
  accessories?: number[];
  head?: number;
  heads?: number[];
  glasses?: number;
  glassesOptions?: number[];
}

export type NounSortField = 'id' | 'owner' | 'background' | 'body' | 'accessory' | 'head' | 'glasses' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';