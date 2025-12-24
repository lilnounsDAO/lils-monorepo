"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Grid } from 'react-window';
import { useMemo, useRef, useEffect, useState } from 'react';

interface AnimateGridProps {
  items: { element: React.ReactNode; id: number }[];
  disableAnimateIn?: boolean;
  disableAnimateOut?: boolean;
}

// NEW: Virtualized grid cell component
interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    items: { element: React.ReactNode; id: number }[];
    columnCount: number;
    itemWidth: number;
    itemHeight: number;
  };
}

function GridCell({ columnIndex, rowIndex, style, data }: GridCellProps) {
  const { items, columnCount } = data;
  const itemIndex = rowIndex * columnCount + columnIndex;

  console.log('GridCell rendering:', { columnIndex, rowIndex, itemIndex, itemsLength: items?.length, columnCount, data });

  if (!items || !Array.isArray(items) || itemIndex >= items.length) {
    console.warn('GridCell: Invalid items array or out of bounds:', { itemIndex, itemsLength: items?.length });
    return null;
  }

  const item = items[itemIndex];

  if (!item || typeof item !== 'object' || !item.element) {
    console.warn('GridCell: Missing item or element:', { itemIndex, item });
    return null;
  }

  return (
    <div style={style} className="flex aspect-square w-full p-1">
      {item.element}
    </div>
  );
}

// NEW: Responsive grid container that calculates dimensions
function ResponsiveVirtualizedGrid({
  items,
  disableAnimateIn,
  disableAnimateOut
}: AnimateGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [dimensions, setDimensions] = useState({
    columnCount: 8,
    itemWidth: 100,
    itemHeight: 100,
    gap: 16
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate responsive dimensions
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;

    const updateDimensions = () => {
      if (!containerRef.current) {
        console.log('containerRef.current is null, retrying...', retryCount);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateDimensions, 100);
        }
        return;
      }

      // Check if the element is actually visible in the DOM
      if (!document.contains(containerRef.current)) {
        console.log('Container not in DOM yet, retrying...', retryCount);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateDimensions, 100);
        }
        return;
      }

      // Force layout calculation
      containerRef.current.offsetWidth; // Force layout

      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width || containerRef.current.offsetWidth || containerRef.current.clientWidth || window.innerWidth || 800; // Multiple fallbacks

      console.log('updateDimensions called:', {
        width,
        rect,
        containerRef: !!containerRef.current,
        offsetWidth: containerRef.current.offsetWidth,
        clientWidth: containerRef.current.clientWidth,
        inDOM: document.contains(containerRef.current),
        retryCount
      });

      if (width > 0) {
        setContainerWidth(width);

        // Responsive breakpoints for different screen sizes
        let columnCount: number;
        let itemWidth: number;
        let itemHeight: number;

        if (width >= 1200) {
          columnCount = 8;
          itemWidth = 100;
          itemHeight = 100;
        } else if (width >= 768) {
          columnCount = 6;
          itemWidth = 100;
          itemHeight = 100;
        } else if (width >= 480) {
          columnCount = 4;
          itemWidth = 100;
          itemHeight = 100;
        } else {
          columnCount = 2;
          itemWidth = 100;
          itemHeight = 100;
        }

        setDimensions({
          columnCount,
          itemWidth,
          itemHeight,
          gap: 16
        });
        setIsInitialized(true);
        console.log('✅ Dimensions set and initialized:', { columnCount, itemWidth, itemHeight, containerWidth: width });
      } else {
        console.log('❌ Width is 0, retrying...', retryCount);
        // Retry after a short delay
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateDimensions, 100);
        }
      }
    };

    // Use requestAnimationFrame and multiple attempts to ensure proper mounting
    const initTimer1 = setTimeout(() => requestAnimationFrame(updateDimensions), 0);
    const initTimer2 = setTimeout(() => requestAnimationFrame(updateDimensions), 100);
    const initTimer3 = setTimeout(() => requestAnimationFrame(updateDimensions), 300);
    const initTimer4 = setTimeout(() => requestAnimationFrame(updateDimensions), 1000);

    // Also watch for DOM changes that might affect the container
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          updateDimensions();
        }
      });
    });

    // Observe the document body for changes
    observer.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true
    });

    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(initTimer1);
      clearTimeout(initTimer2);
      clearTimeout(initTimer3);
      clearTimeout(initTimer4);
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const rowCount = isInitialized ? Math.ceil(items.length / dimensions.columnCount) : 0;

  if (items.length === 0 || !isInitialized) {
    return (
      <div className="flex h-fit grow flex-col items-center justify-center gap-2 rounded-3xl border-4 border-gray-200 px-4 py-24 text-center" style={{ width: '100%', minHeight: '400px' }}>
        <h4>{items.length === 0 ? 'No Lil Nouns found.' : 'Loading grid...'}</h4>
      </div>
    );
  }


  console.log('ResponsiveVirtualizedGrid rendering:', {
    itemsLength: items.length,
    columnCount: dimensions.columnCount,
    rowCount,
    containerWidth,
    itemWidth: dimensions.itemWidth,
    itemHeight: dimensions.itemHeight
  });

  // Use a minimum width if container width is not properly calculated
  const gridWidth = Math.max(containerWidth, 800); // Increased minimum width

  // Don't render Grid until properly initialized
  if (!isInitialized || containerWidth === 0) {
    return (
      <div ref={containerRef} className="w-full min-h-[400px] flex items-center justify-center" style={{ width: '100%', minHeight: '400px' }}>
        <div className="text-muted-foreground">Loading grid...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full min-h-[400px]" style={{ width: '100%', minHeight: '400px' }}>
      <Grid
        columnCount={dimensions.columnCount}
        columnWidth={dimensions.itemWidth + dimensions.gap}
        height={Math.min(rowCount * (dimensions.itemHeight + dimensions.gap), 800)} // Max height
        rowCount={rowCount}
        rowHeight={dimensions.itemHeight + dimensions.gap}
        width={gridWidth}
        itemData={{
          items,
          columnCount: dimensions.columnCount,
          itemWidth: dimensions.itemWidth,
          itemHeight: dimensions.itemHeight
        }}
        overscanRowCount={3} // Render 3 extra rows for smooth scrolling
      >
        {GridCell}
      </Grid>

      {/* Show total count for large lists */}
      {items.length > 100 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Showing {items.length} nouns • Scroll for more
        </div>
      )}
    </div>
  );
}

// Animated grid with smooth appending
function AnimatedGrid({ items }: { items: AnimateGridProps['items'] }) {
  const renderedIdsRef = useRef<Set<number>>(new Set());
  const prevItemCountRef = useRef(0);
  
  // Track which items are new
  const itemsWithAnimation = useMemo(() => {
    const currentCount = items.length;
    const prevCount = prevItemCountRef.current;
    
    console.log('🎨 AnimationGrid:', {
      currentCount,
      prevCount,
      newItems: currentCount - prevCount,
      renderedIds: renderedIdsRef.current.size
    });
    
    const result = items.map((item, index) => {
      const isNew = !renderedIdsRef.current.has(item.id);
      
      if (isNew) {
        console.log('✨ New item detected:', item.id, 'at index', index);
      }
      
      // Mark as rendered immediately
      renderedIdsRef.current.add(item.id);
      
      return {
        ...item,
        isNew,
        index,
        appendOrder: isNew ? Math.max(0, index - prevCount) : -1
      };
    });
    
    prevItemCountRef.current = currentCount;
    return result;
  }, [items]);

  return (
    <ul 
      className="text-content-secondary grid grow auto-rows-min grid-cols-[repeat(auto-fill,minmax(100px,1fr))] items-stretch justify-stretch gap-4"
    >
      {itemsWithAnimation.map((item) => (
        <motion.li 
          key={item.id} 
          className="flex aspect-square w-full will-change-transform"
          initial={item.isNew ? { opacity: 0, y: 36, scale: 0.92 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={item.isNew ? { duration: 0.42, delay: (item.appendOrder ?? 0) * 0.025, ease: [0.22, 1, 0.36, 1] } : undefined}
        >
          {item.element}
        </motion.li>
      ))}
    </ul>
  );
}

// Main component - use animated grid
export default function AnimationGird({ items }: AnimateGridProps) {
  return <AnimatedGrid items={items} />;
}
