// NounFilterEngine - Wrapper class for noun-filters-worker
// Provides typed API for instant client-side filtering

import NounFilterWorker from '../workers/noun-filters-worker?worker';

export interface NounFilters {
  background?: number[];
  body?: number[];
  accessory?: number[];
  head?: number[];
  glasses?: number[];
}

export interface FilterCounts {
  background: Record<number, number>;
  body: Record<number, number>;
  accessory: Record<number, number>;
  head: Record<number, number>;
  glasses: Record<number, number>;
}

export interface FilterResult {
  total: number;
  counts: FilterCounts;
  matchingIndices: number[];
  matchingNounIds: string[];
}

export interface CompactIndexData {
  version: string;
  totalCount: number;
  nounIds: string[];
  seedsBase64: string;
}

export class NounFilterEngine {
  private worker: Worker;
  private messageId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor() {
    console.log('Creating NounFilterEngine worker...');
    this.worker = new NounFilterWorker();
    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, id, ...data } = event.data;

    console.log('Worker message received:', type, 'id:', id);

    // Handle responses based on type and message ID
    if (type === 'initialized') {
      // Initialization complete
      const request = this.pendingRequests.get(id ?? 0);
      if (request) {
        request.resolve({
          total: data.total,
          counts: data.counts,
        });
        this.pendingRequests.delete(id ?? 0);
      }
    } else if (type === 'result') {
      // Filter result
      const request = this.pendingRequests.get(id ?? 1);
      if (request) {
        console.log('✅ Resolving filter request', id, 'with', data.total, 'matches');
        request.resolve(data);
        this.pendingRequests.delete(id ?? 1);
      } else {
        console.warn('⚠️ No pending request found for id:', id);
      }
    } else if (type === 'error') {
      // Error occurred
      const request = this.pendingRequests.get(id);
      if (request) {
        request.reject(new Error(data.error));
        this.pendingRequests.delete(id);
      }
    }
  }

  private handleError(error: ErrorEvent) {
    console.error('Worker error:', error);
    const requests = Array.from(this.pendingRequests.values());
    requests.forEach((request) => {
      request.reject(new Error(error.message));
    });
    this.pendingRequests.clear();
  }

  async init(data: CompactIndexData): Promise<{ total: number; counts: FilterCounts }> {
    const id = this.messageId++;
    console.log('Initializing NounFilterEngine with', data.totalCount, 'nouns, id:', id);

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.worker.postMessage({
        type: 'init',
        id,
        totalCount: data.totalCount,
        nounIds: data.nounIds,
        seedsBase64: data.seedsBase64,
      });
    });
  }

  async applyFilters(filters: NounFilters): Promise<FilterResult> {
    const id = this.messageId++;
    console.log('Applying filters:', filters, 'id:', id);

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.worker.postMessage({
        type: 'apply',
        id,
        filters,
      });
    });
  }

  destroy() {
    console.log('Destroying NounFilterEngine worker');
    this.worker.terminate();
    this.pendingRequests.clear();
  }
}

