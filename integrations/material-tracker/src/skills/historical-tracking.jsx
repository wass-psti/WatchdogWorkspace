import { apiFetch } from '@material/api/http';
export async function fetchHistoricalData({ timestamps = [] } = {}) {
  const data = await apiFetch('/api/history');
  const history = data?.history || [];
  if (!history.length) return { raw: [] };
  const raw = timestamps.map((ts) => {
    const target = new Date(ts).getTime();
    let best = history[0];
    for (const row of history) {
      if (new Date(row.date).getTime() <= target) best = row; else break;
    }
    return { timestamp: ts, count: best?.count ?? 0 };
  });
  return { raw };
}
