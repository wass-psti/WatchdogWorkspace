import { useRef, useCallback } from 'react';

/**
 * Tier 3: Stale-while-revalidate cache for data fetching hooks.
 * 
 * Returns cached data immediately while a fresh fetch is in-flight,
 * preventing the full loading skeleton on filter/search changes.
 * 
 * Enhanced with cache invalidation for mutations.
 * 
 * Usage:
 *   const { getCached, setCached, invalidate, invalidateAll } = useSWRCache();
 *   // On fetch start: if (hasCachedFor(key)) → show stale data, set isRefresching
 *   // On fetch complete: setCached(key, data)
 *   // On mutation (create/edit/delete): invalidateAll() to clear stale data
 */
export function useSWRCache({ maxEntries = 10 } = {}) {
  const cacheRef = useRef(new Map());
  const orderRef = useRef([]);

  const getCached = useCallback((key) => {
    return cacheRef.current.get(key) ?? null;
  }, []);

  const setCached = useCallback((key, data) => {
    const cache = cacheRef.current;
    const order = orderRef.current;

    cache.set(key, data);

    // LRU eviction
    const idx = order.indexOf(key);
    if (idx >= 0) order.splice(idx, 1);
    order.push(key);

    while (order.length > maxEntries) {
      const evicted = order.shift();
      cache.delete(evicted);
    }
  }, [maxEntries]);

  const hasCachedFor = useCallback((key) => {
    return cacheRef.current.has(key);
  }, []);

  /**
   * Invalidate specific key or all cache entries
   * Call after mutations (create/edit/delete) to prevent stale data
   */
  const invalidate = useCallback((key) => {
    if (key) {
      cacheRef.current.delete(key);
      const idx = orderRef.current.indexOf(key);
      if (idx >= 0) orderRef.current.splice(idx, 1);
    } else {
      cacheRef.current.clear();
      orderRef.current.length = 0;
    }
  }, []);

  /**
   * Convenience method to invalidate all cache entries
   * Use after item mutations that affect filter results
   */
  const invalidateAll = useCallback(() => {
    cacheRef.current.clear();
    orderRef.current.length = 0;
  }, []);

  return { getCached, setCached, hasCachedFor, invalidate, invalidateAll };
}
