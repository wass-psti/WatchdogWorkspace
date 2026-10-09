import { apiFetch } from '@material/api/http';
export async function discoverForexBoard() { return 'local-forex'; }
export async function queryForexRates() {
  try { return await apiFetch('/api/forex'); }
  catch (e) { console.warn('[FOREX] Local rate fetch failed:', e.message); return null; }
}
