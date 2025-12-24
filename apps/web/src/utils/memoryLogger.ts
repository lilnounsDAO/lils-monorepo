export function logMemoryUsage(label: string) {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    console.log(`📊 Memory Usage - ${label}:`);
    console.log(`  RSS: ${Math.round(usage.rss / 1024 / 1024)}MB (Resident Set Size)`);
    console.log(`  Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
    console.log(`  Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)}MB`);
    console.log(`  External: ${Math.round(usage.external / 1024 / 1024)}MB`);
    console.log('');
  }
}

export function logBrowserMemory(label: string) {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
    const memory = (window.performance as any).memory;
    console.log(`🌐 Browser Memory - ${label}:`);
    console.log(`  Used: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
    console.log(`  Total: ${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`);
    console.log(`  Limit: ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`);
    console.log('');
  }
}