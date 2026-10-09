import { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh } from './useAutoRefresh';
import { discoverForexBoard, queryForexRates } from './forexDiscovery';

export function useForexRates() {
  const [rates, setRates] = useState({ usd: null, eur: null });
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    try {
      const bid = await discoverForexBoard();
      if (!bid) return;
      const r = await queryForexRates(bid);
      if (r && (r.usd != null || r.eur != null)) {
        setRates(prev => ({ usd: r.usd ?? prev.usd, eur: r.eur ?? prev.eur }));
      }
    } catch (e) {
      console.error('[FOREX] Rate fetch error:', e.message || e);
    }
  }, []);

  const { isRefreshing, lastRefreshed, manualRefresh } = useAutoRefresh(
    'useForexRates', fetchRates, { baseInterval: 60000 }
  );

  useEffect(() => {
    fetchRates()
      .catch(e => console.error('Forex rate fetch failed:', e))
      .finally(() => setLoading(false));
  }, []);

  return { rates, loading, isRefreshing, lastRefreshed, manualRefresh };
}
