import { useRef, useCallback, useEffect } from 'react';
import BoardSDK from '@material/api/BoardSDK.js';

const board = new BoardSDK();
const THRESHOLD_PCT = 0.005; // 0.5% — minimum relative change to trigger sync
const SYNC_DEBOUNCE = 5000; // 5s debounce before auto-syncing on rate change

function findStaleItems(items, rates) {
  if (!rates?.usd && !rates?.eur) return [];
  return items.filter(it => {
    if (rates.usd != null) {
      const cur = parseFloat(it.exRateUsd) || 0;
      const threshold = Math.max(rates.usd * THRESHOLD_PCT, 0.01);
      if (Math.abs(cur - rates.usd) > threshold) return true;
    }
    if (rates.eur != null) {
      const cur = parseFloat(it.exRateEur) || 0;
      const threshold = Math.max(rates.eur * THRESHOLD_PCT, 0.01);
      if (Math.abs(cur - rates.eur) > threshold) return true;
    }
    return false;
  });
}

export function useRateSync(items, setItems, forexRates, { enabled = true } = {}) {
  const prevRatesRef = useRef(null);
  const itemsRef = useRef(items);
  const syncTimerRef = useRef(null);
  itemsRef.current = items;

  const syncItems = useCallback(async (targetItems) => {
    if (!enabled) return;
    const stale = findStaleItems(targetItems, forexRates);
    if (!stale.length) return;
    const usdStr = forexRates?.usd != null ? String(forexRates.usd.toFixed(2)) : null;
    const eurStr = forexRates?.eur != null ? String(forexRates.eur.toFixed(2)) : null;

    // Optimistic update
    const staleIds = new Set(stale.map(s => s.id));
    setItems(prev => prev.map(it => {
      if (!staleIds.has(it.id)) return it;
      const updated = { ...it };
      if (usdStr) updated.exRateUsd = usdStr;
      if (eurStr) updated.exRateEur = eurStr;
      return updated;
    }));

    // P2 Fix: Sequential API updates with delay to avoid 429 rate limiting.
    // Previous approach sent 5 concurrent requests per batch which risked TooManyConcurrentRequests.
    for (let i = 0; i < stale.length; i++) {
      try {
        const update = {};
        if (usdStr) update.exRateUsd = usdStr;
        if (eurStr) update.exRateEur = eurStr;
        await board.item(stale[i].id).update(update).execute();
      } catch (e) {
        console.warn('[RateSync] Update failed:', stale[i].id, e.message);
      }
      if (i < stale.length - 1) await new Promise(r => setTimeout(r, 600));
    }
  }, [enabled, forexRates, setItems]);

  // Debounced auto-sync — waits 5s after rate change to batch fluctuations
  useEffect(() => {
    if (!enabled) return;
    const prev = prevRatesRef.current;
    prevRatesRef.current = forexRates;
    if (!prev) return;
    const hasRates = forexRates?.usd != null || forexRates?.eur != null;
    if (!hasRates) return;
    if (prev.usd === forexRates?.usd && prev.eur === forexRates?.eur) return;
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => syncItems(itemsRef.current), SYNC_DEBOUNCE);
  }, [enabled, forexRates?.usd, forexRates?.eur, syncItems]);

  useEffect(() => () => clearTimeout(syncTimerRef.current), []);

  return { syncItems };
}
