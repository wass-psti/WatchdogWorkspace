import { useState, useEffect, useRef } from 'react';

export function useHistoricalTrend(boardId) {
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current || !boardId) return;
    fetched.current = true;

    (async () => {
      try {
        const { fetchHistoricalData } = await import('@material/skills/historical-tracking.jsx');
        const timestamps = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i * 7);
          timestamps.push(d.toISOString().split('T')[0]);
        }
        const result = await fetchHistoricalData({
          boardId,
          timestamps,
          aggregations: [{ alias: 'count', function: 'COUNT_ITEMS' }],
        });
        if (result?.raw?.length) {
          setTrendData(result.raw.map(r => r.count ?? 0));
        }
      } catch (err) {
        // Historical data may not be available on all plans — fail gracefully
        console.warn('Historical trend unavailable:', err?.message || err);
        setTrendData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [boardId]);

  return { trendData, loading };
}
