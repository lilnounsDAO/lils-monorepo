// Test script for NounFilterEngine performance and accuracy
// Run this in browser console to verify filtering is working correctly

import { NounFilterEngine, CompactIndexData } from './NounFilterEngine';

export async function testFilterEngine() {
  console.log('🧪 Starting Filter Engine Performance Test...\n');

  try {
    // 1. Load compact index
    console.log('📥 Step 1: Building compact index from GraphQL...');
    const startLoad = performance.now();
    
    // Build compact index directly from GraphQL (same as FilterEngineContext)
    // This is a simplified version - in production, use the FilterEngineContext
    throw new Error('testFilterEngine: Please use FilterEngineContext instead. This function needs to be updated to build the index from GraphQL.');
    
    const loadTime = performance.now() - startLoad;
    console.log(`✅ Loaded in ${Math.round(loadTime)}ms`);
    console.log(`   Total nouns: ${compactIndex.totalCount}`);
    console.log(`   Version: ${compactIndex.version}`);
    console.log(`   Seeds base64 length: ${compactIndex.seedsBase64.length}`);
    console.log(`   Payload size: ${Math.round(JSON.stringify(compactIndex).length / 1024)}KB\n`);

    // 2. Initialize worker
    console.log('🔧 Step 2: Initializing worker...');
    const startInit = performance.now();
    
    const engine = new NounFilterEngine();
    const initialResult = await engine.init(compactIndex);
    
    const initTime = performance.now() - startInit;
    console.log(`✅ Initialized in ${Math.round(initTime)}ms`);
    console.log(`   Total nouns: ${initialResult.total}`);
    console.log(`   Background traits: ${Object.keys(initialResult.counts.background).length}`);
    console.log(`   Body traits: ${Object.keys(initialResult.counts.body).length}`);
    console.log(`   Accessory traits: ${Object.keys(initialResult.counts.accessory).length}`);
    console.log(`   Head traits: ${Object.keys(initialResult.counts.head).length}`);
    console.log(`   Glasses traits: ${Object.keys(initialResult.counts.glasses).length}\n`);

    // 3. Test simple filter
    console.log('🔍 Step 3: Testing simple filter (background=0)...');
    const startFilter1 = performance.now();
    
    const result1 = await engine.applyFilters({ background: [0] });
    
    const filter1Time = performance.now() - startFilter1;
    console.log(`✅ Filtered in ${Math.round(filter1Time)}ms`);
    console.log(`   Matching nouns: ${result1.total}`);
    console.log(`   First 10 IDs: ${result1.matchingNounIds.slice(0, 10).join(', ')}\n`);

    // 4. Test complex filter
    console.log('🔍 Step 4: Testing complex filter (background=0 AND body=1)...');
    const startFilter2 = performance.now();
    
    const result2 = await engine.applyFilters({ background: [0], body: [1] });
    
    const filter2Time = performance.now() - startFilter2;
    console.log(`✅ Filtered in ${Math.round(filter2Time)}ms`);
    console.log(`   Matching nouns: ${result2.total}`);
    console.log(`   First 10 IDs: ${result2.matchingNounIds.slice(0, 10).join(', ')}\n`);

    // 5. Test multi-select within facet
    console.log('🔍 Step 5: Testing multi-select (background=0 OR background=1)...');
    const startFilter3 = performance.now();
    
    const result3 = await engine.applyFilters({ background: [0, 1] });
    
    const filter3Time = performance.now() - startFilter3;
    console.log(`✅ Filtered in ${Math.round(filter3Time)}ms`);
    console.log(`   Matching nouns: ${result3.total}`);
    console.log(`   Should equal all nouns: ${result3.total === compactIndex.totalCount ? '✅ YES' : '❌ NO'}\n`);

    // 6. Test empty filter
    console.log('🔍 Step 6: Testing empty filter (all nouns)...');
    const startFilter4 = performance.now();
    
    const result4 = await engine.applyFilters({});
    
    const filter4Time = performance.now() - startFilter4;
    console.log(`✅ Filtered in ${Math.round(filter4Time)}ms`);
    console.log(`   Matching nouns: ${result4.total}`);
    console.log(`   Equals total: ${result4.total === compactIndex.totalCount ? '✅ YES' : '❌ NO'}\n`);

    // 7. Summary
    console.log('📊 Performance Summary:');
    console.log(`   Initial load: ${Math.round(loadTime)}ms`);
    console.log(`   Worker init: ${Math.round(initTime)}ms`);
    console.log(`   Simple filter: ${Math.round(filter1Time)}ms`);
    console.log(`   Complex filter: ${Math.round(filter2Time)}ms`);
    console.log(`   Multi-select: ${Math.round(filter3Time)}ms`);
    console.log(`   Empty filter: ${Math.round(filter4Time)}ms`);
    console.log(`   Average filter time: ${Math.round((filter1Time + filter2Time + filter3Time + filter4Time) / 4)}ms`);
    console.log('\n✅ All tests passed!');

    // Cleanup
    engine.destroy();

    return {
      success: true,
      metrics: {
        loadTime: Math.round(loadTime),
        initTime: Math.round(initTime),
        avgFilterTime: Math.round((filter1Time + filter2Time + filter3Time + filter4Time) / 4),
        payloadSize: Math.round(JSON.stringify(compactIndex).length / 1024),
        totalNouns: compactIndex.totalCount,
      },
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error,
    };
  }
}

// Export for console usage
if (typeof window !== 'undefined') {
  (window as any).testFilterEngine = testFilterEngine;
  console.log('💡 Run window.testFilterEngine() in console to test filtering');
}

