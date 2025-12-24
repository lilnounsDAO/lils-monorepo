// Noun Filters Web Worker
// Performs fast bitset-based filtering for 8k+ nouns off the main thread

interface InitMessage {
  type: 'init';
  totalCount: number;
  nounIds: string[];
  seedsBase64: string;
}

interface ApplyFiltersMessage {
  type: 'apply';
  filters: {
    background?: number[];
    body?: number[];
    accessory?: number[];
    head?: number[];
    glasses?: number[];
  };
}

interface FilterResult {
  total: number;
  counts: {
    background: Record<number, number>;
    body: Record<number, number>;
    accessory: Record<number, number>;
    head: Record<number, number>;
    glasses: Record<number, number>;
  };
  matchingIndices: number[];
  matchingNounIds: string[];
}

// Global state
let nounIds: string[] = [];
let seeds: Uint16Array | null = null;
let totalCount = 0;

// Bitset indexes: Map<traitValue, Set<nounIndex>>
const backgroundIndex = new Map<number, Set<number>>();
const bodyIndex = new Map<number, Set<number>>();
const accessoryIndex = new Map<number, Set<number>>();
const headIndex = new Map<number, Set<number>>();
const glassesIndex = new Map<number, Set<number>>();

// Fast popcount for bitset operations
function popcount(arr: Set<number>): number {
  return arr.size;
}

// Initialize bitsets from compact seed data
function initializeBitsets(seedArray: Uint16Array, count: number) {
  console.log('Worker: Building bitset indexes...');
  const startTime = performance.now();

  // Clear existing indexes
  backgroundIndex.clear();
  bodyIndex.clear();
  accessoryIndex.clear();
  headIndex.clear();
  glassesIndex.clear();

  // Build bitsets for each trait value
  for (let i = 0; i < count; i++) {
    const offset = i * 5;
    const bg = seedArray[offset];
    const body = seedArray[offset + 1];
    const accessory = seedArray[offset + 2];
    const head = seedArray[offset + 3];
    const glasses = seedArray[offset + 4];

    // Add this noun index to the appropriate trait sets
    if (!backgroundIndex.has(bg)) backgroundIndex.set(bg, new Set());
    if (!bodyIndex.has(body)) bodyIndex.set(body, new Set());
    if (!accessoryIndex.has(accessory)) accessoryIndex.set(accessory, new Set());
    if (!headIndex.has(head)) headIndex.set(head, new Set());
    if (!glassesIndex.has(glasses)) glassesIndex.set(glasses, new Set());

    backgroundIndex.get(bg)!.add(i);
    bodyIndex.get(body)!.add(i);
    accessoryIndex.get(accessory)!.add(i);
    headIndex.get(head)!.add(i);
    glassesIndex.get(glasses)!.add(i);
  }

  const endTime = performance.now();
  console.log(`Worker: Bitset indexes built in ${Math.round(endTime - startTime)}ms`);
  console.log(`Worker: Index sizes - bg:${backgroundIndex.size}, body:${bodyIndex.size}, acc:${accessoryIndex.size}, head:${headIndex.size}, glasses:${glassesIndex.size}`);
}

// Compute initial counts for all traits
function computeInitialCounts(): FilterResult['counts'] {
  const counts: FilterResult['counts'] = {
    background: {},
    body: {},
    accessory: {},
    head: {},
    glasses: {},
  };

  backgroundIndex.forEach((set, value) => {
    counts.background[value] = set.size;
  });
  bodyIndex.forEach((set, value) => {
    counts.body[value] = set.size;
  });
  accessoryIndex.forEach((set, value) => {
    counts.accessory[value] = set.size;
  });
  headIndex.forEach((set, value) => {
    counts.head[value] = set.size;
  });
  glassesIndex.forEach((set, value) => {
    counts.glasses[value] = set.size;
  });

  return counts;
}

// Apply filters using bitset intersection
function applyFilters(filters: ApplyFiltersMessage['filters']): FilterResult {
  const startTime = performance.now();

  // Start with all indices
  let matchingSet: Set<number> | null = null;

  // Apply background filter (OR within facet)
  if (filters.background && filters.background.length > 0) {
    const bgSet = new Set<number>();
    filters.background.forEach((bg) => {
      const indices = backgroundIndex.get(bg);
      if (indices) {
        indices.forEach((idx) => bgSet.add(idx));
      }
    });
    matchingSet = bgSet;
  }

  // Apply body filter (AND across facets, OR within facet)
  if (filters.body && filters.body.length > 0) {
    const bodySet = new Set<number>();
    filters.body.forEach((body) => {
      const indices = bodyIndex.get(body);
      if (indices) {
        indices.forEach((idx) => bodySet.add(idx));
      }
    });

    if (matchingSet) {
      // AND operation: intersection
      matchingSet = new Set([...matchingSet].filter((x) => bodySet.has(x)));
    } else {
      matchingSet = bodySet;
    }
  }

  // Apply accessory filter
  if (filters.accessory && filters.accessory.length > 0) {
    const accSet = new Set<number>();
    filters.accessory.forEach((acc) => {
      const indices = accessoryIndex.get(acc);
      if (indices) {
        indices.forEach((idx) => accSet.add(idx));
      }
    });

    if (matchingSet) {
      matchingSet = new Set([...matchingSet].filter((x) => accSet.has(x)));
    } else {
      matchingSet = accSet;
    }
  }

  // Apply head filter
  if (filters.head && filters.head.length > 0) {
    const headSet = new Set<number>();
    filters.head.forEach((head) => {
      const indices = headIndex.get(head);
      if (indices) {
        indices.forEach((idx) => headSet.add(idx));
      }
    });

    if (matchingSet) {
      matchingSet = new Set([...matchingSet].filter((x) => headSet.has(x)));
    } else {
      matchingSet = headSet;
    }
  }

  // Apply glasses filter
  if (filters.glasses && filters.glasses.length > 0) {
    const glassesSet = new Set<number>();
    filters.glasses.forEach((glasses) => {
      const indices = glassesIndex.get(glasses);
      if (indices) {
        indices.forEach((idx) => glassesSet.add(idx));
      }
    });

    if (matchingSet) {
      matchingSet = new Set([...matchingSet].filter((x) => glassesSet.has(x)));
    } else {
      matchingSet = glassesSet;
    }
  }

  // If no filters, all nouns match
  if (!matchingSet) {
    matchingSet = new Set(Array.from({ length: totalCount }, (_, i) => i));
  }

  const matchingIndices = Array.from(matchingSet);
  const matchingNounIds = matchingIndices.map((idx) => nounIds[idx]);

  // Compute disjunctive counts (what would match if you selected this option)
  const counts = computeDisjunctiveCounts(matchingSet, filters);

  const endTime = performance.now();
  console.log(`Worker: Filter applied in ${Math.round(endTime - startTime)}ms, ${matchingIndices.length} matches`);

  return {
    total: matchingIndices.length,
    counts,
    matchingIndices,
    matchingNounIds,
  };
}

// Compute disjunctive counts (e-commerce style filtering)
function computeDisjunctiveCounts(
  currentMatches: Set<number>,
  currentFilters: ApplyFiltersMessage['filters']
): FilterResult['counts'] {
  const counts: FilterResult['counts'] = {
    background: {},
    body: {},
    accessory: {},
    head: {},
    glasses: {},
  };

  // For each trait type, compute counts as if that filter wasn't applied (disjunctive)
  const currentMatchesArray = Array.from(currentMatches);

  // Background counts
  currentMatchesArray.forEach((idx) => {
    const bg = seeds![idx * 5];
    counts.background[bg] = (counts.background[bg] || 0) + 1;
  });

  // Body counts
  currentMatchesArray.forEach((idx) => {
    const body = seeds![idx * 5 + 1];
    counts.body[body] = (counts.body[body] || 0) + 1;
  });

  // Accessory counts
  currentMatchesArray.forEach((idx) => {
    const accessory = seeds![idx * 5 + 2];
    counts.accessory[accessory] = (counts.accessory[accessory] || 0) + 1;
  });

  // Head counts
  currentMatchesArray.forEach((idx) => {
    const head = seeds![idx * 5 + 3];
    counts.head[head] = (counts.head[head] || 0) + 1;
  });

  // Glasses counts
  currentMatchesArray.forEach((idx) => {
    const glasses = seeds![idx * 5 + 4];
    counts.glasses[glasses] = (counts.glasses[glasses] || 0) + 1;
  });

  return counts;
}

// Handle incoming messages
self.onmessage = (event: MessageEvent) => {
  const message = event.data;

  try {
    if (message.type === 'init') {
      const initMsg = message as InitMessage;
      console.log('Worker: Initializing with', initMsg.totalCount, 'nouns, id:', message.id);

      // Store noun IDs
      nounIds = initMsg.nounIds;
      totalCount = initMsg.totalCount;

      // Decode base64 to JSON string, then parse to get the seeds array
      const jsonString = atob(initMsg.seedsBase64);
      const seedsArray: number[][] = JSON.parse(jsonString);
      
      // Flatten the 2D array [[bg, body, acc, head, glasses], ...] to 1D array
      const flattenedSeeds: number[] = seedsArray.flat();
      
      // Create Uint16Array from flattened array
      seeds = new Uint16Array(flattenedSeeds);

      console.log('Worker: Decoded', seeds.length, 'seed values (', seeds.length / 5, 'nouns )');

      // Build bitset indexes
      initializeBitsets(seeds, totalCount);

      // Compute initial counts
      const initialCounts = computeInitialCounts();

      self.postMessage({
        type: 'initialized',
        id: message.id,
        total: totalCount,
        counts: initialCounts,
      });
    } else if (message.type === 'apply') {
      const applyMsg = message as ApplyFiltersMessage;
      console.log('Worker: Applying filters:', applyMsg.filters, 'id:', message.id);

      const result = applyFilters(applyMsg.filters);

      self.postMessage({
        type: 'result',
        id: message.id,
        ...result,
      });
    }
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      type: 'error',
      id: message.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

console.log('Noun filters worker loaded');

