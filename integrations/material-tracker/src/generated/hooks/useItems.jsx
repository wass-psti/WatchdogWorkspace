import { useState, useEffect, useCallback, useRef } from 'react';
import BoardSDK from '@material/api/BoardSDK.js';
import { useAutoRefresh } from './useAutoRefresh';
import { useSWRCache } from './useSWRCache';

const board = new BoardSDK();
const COLUMNS = [
  "sourceType", "materialDescription", "brand", "quantity", "buyingPrice", "currency",
  "exRateUsd", "exRateEur", "shippingCost", "shippingCostCurrency", "leadtimeInWeeks", "dateRequired", "vendorDetails", "rfqRefNo",
  "accounts", "supplierPoNo"
];
const retry = async (fn, attempts = 2) => {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
};

// Tier 3: Generate a cache key from filter parameters
function makeCacheKey(sourceFilter, searchTerm, vendorTerm) {
  return `${sourceFilter || 'all'}|${searchTerm || ''}|${vendorTerm || ''}`;
}

export function useItems({ sourceFilter, searchTerm, vendorTerm } = {}) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [swrRefetching, setSwrRefetching] = useState(false); // Tier 3: SWR background fetch indicator
  const [searchTruncated, setSearchTruncated] = useState(false); // Track if search results may be incomplete
  const fetchGenRef = useRef(0);
  // D1: Track which generation the current cursor belongs to
  const cursorGenRef = useRef(0);
  // Tier 3: SWR cache for stale-while-revalidate on filter changes
  const { getCached, setCached, invalidateAll } = useSWRCache({ maxEntries: 8 });
  const isFirstLoad = useRef(true);

  const fetchPage1 = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    const cacheKey = makeCacheKey(sourceFilter, searchTerm, vendorTerm);
    const w = sourceFilter && sourceFilter !== 'all' ? { sourceType: sourceFilter } : {};
    if (vendorTerm) w.vendorDetails = { contains: vendorTerm };
    if (!searchTerm) {
      const q = board.items().withColumns(COLUMNS);
      const query = Object.keys(w).length ? q.where(w) : q;
      const results = await retry(() => query.orderBy({ column: "createdAt", direction: "desc" })
        .withPagination({ limit: 200 }).execute());
      if (gen !== fetchGenRef.current) return;
      setItems(results.items);
      setCursor(results.cursor);
      setSearchTruncated(false);
      cursorGenRef.current = gen; // D1: Tag cursor with current gen
      // Tier 3: Cache the result for SWR
      setCached(cacheKey, { items: results.items, cursor: results.cursor });
      return;
    }
    // P1 Fix: Fire both search queries in parallel instead of sequentially to halve search latency
    const nameQuery = retry(() => board.items().withColumns(COLUMNS).where({ ...w, name: searchTerm })
      .orderBy({ column: "createdAt", direction: "desc" }).withPagination({ limit: 200 }).execute());
    const descQuery = retry(() => board.items().withColumns(COLUMNS)
      .where({ ...w, materialDescription: { contains: searchTerm } })
      .orderBy({ column: "createdAt", direction: "desc" }).withPagination({ limit: 200 }).execute());
    const [r1, r2] = await Promise.all([nameQuery, descQuery]);
    if (gen !== fetchGenRef.current) return;
    const seen = new Set(r1.items.map(i => i.id));
    let merged = [...r1.items];
    let searchCursor = r1.cursor;
    // Merge description results, deduplicating against name results
    for (const item of r2.items) { if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); } }
    if (!searchCursor && r2.cursor) searchCursor = r2.cursor;
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setItems(merged);
    // P4 Fix: Disable Load More during search — merged results come from two separate
    // queries, so a single cursor cannot reliably paginate both. The user sees all
    // matches from the first page of each query (up to 400 items). If either query
    // has more, the cursor would only extend one of the two, producing gaps or duplicates.
    // We track whether results may be truncated so the UI can inform users.
    const mayBeTruncated = !!(r1.cursor || r2.cursor);
    setCursor(null);
    setSearchTruncated(mayBeTruncated);
    cursorGenRef.current = gen; // D1: Tag cursor with current gen
    // Tier 3: Cache the result for SWR
    setCached(cacheKey, { items: merged, cursor: null });
  }, [searchTerm, sourceFilter, vendorTerm, setCached]);

  const initialFetch = useCallback(async () => {
    // Tier 3: SWR — if we have cached data for these params, show it immediately
    const cacheKey = makeCacheKey(sourceFilter, searchTerm, vendorTerm);
    const cached = getCached(cacheKey);
    if (cached && !isFirstLoad.current) {
      // Show stale data immediately — swrRefetching will indicate background fetch
      setItems(cached.items);
      setCursor(cached.cursor);
      setLoading(false);
      setSwrRefetching(true);
    } else {
      setLoading(true);
    }
    isFirstLoad.current = false;
    try { await fetchPage1(); }
    catch (err) { console.error('Failed to fetch items:', err); }
    finally { setLoading(false); setSwrRefetching(false); }
  }, [fetchPage1, getCached, sourceFilter, searchTerm, vendorTerm]);

  const { isRefreshing, lastRefreshed, manualRefresh } = useAutoRefresh(
    'useItems', fetchPage1, { baseInterval: 30000 }
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { initialFetch(); }, [sourceFilter, searchTerm, vendorTerm]);

  const loadMore = useCallback(async (onNewItems) => {
    if (!cursor || loadingMore) return;
    // D1: Capture the gen at the time of the loadMore request
    const genAtRequest = cursorGenRef.current;
    setLoadingMore(true);
    try {
      const results = await retry(() => board.items().withPagination({ cursor }).execute());
      // D1: If a new query has fired while we were loading, discard these results
      if (genAtRequest !== fetchGenRef.current) {
        return;
      }
      setItems(prev => [...prev, ...results.items]);
      setCursor(results.cursor);
      cursorGenRef.current = genAtRequest; // Keep gen consistent
      if (onNewItems && results.items.length) onNewItems(results.items);
    } catch (err) { console.error('Failed to load more:', err); }
    finally { setLoadingMore(false); }
  }, [cursor, loadingMore]);

  return { items, setItems, loading, loadingMore, loadMore, hasMore: !!cursor, isRefreshing: isRefreshing || swrRefetching, lastRefreshed, manualRefresh, invalidateCache: invalidateAll, searchTruncated };
}

export function useAggregates() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tier 2: Source type options from server for dynamic filter dropdowns
  const [sourceOptions, setSourceOptions] = useState(['Local', 'Import']);
  const fetchAggregates = useCallback(async () => {
    const [totals, bySource] = await Promise.all([
      retry(() => board.aggregate().countItems('count').sum('buyingPrice', 'totalBuying')
        .avg('buyingPrice', 'avgBuying').execute()),
      retry(() => board.aggregate().groupBy('sourceType').countItems('count').sum('buyingPrice', 'totalBuying').execute())
    ]);
    setData({ totals: totals[0], bySource });
    // Tier 2: Derive source options from the groupBy result (scales if new statuses are added)
    const opts = bySource?.map(r => r.sourceType).filter(Boolean) ?? [];
    if (opts.length) setSourceOptions(opts);
  }, []);
  const initialFetch = useCallback(async () => {
    try { await fetchAggregates(); }
    catch (err) { console.error('Failed to fetch aggregates:', err); }
    finally { setLoading(false); }
  }, [fetchAggregates]);
  const { isRefreshing: aggRefreshing, lastRefreshed: aggLast, manualRefresh: aggRefresh } = useAutoRefresh('useAggregates', fetchAggregates, { baseInterval: 30000 });
  useEffect(() => { initialFetch(); }, []);
  return { data, loading, isRefreshing: aggRefreshing, lastRefreshed: aggLast, manualRefresh: aggRefresh, sourceOptions };
}
