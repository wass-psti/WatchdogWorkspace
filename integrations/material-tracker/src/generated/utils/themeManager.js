import { getMaterialTrackerRuntime } from '../../platform/integration/bootstrap';

const THEME_KEY = 'material-tracker:standalone:theme';

function isEmbedded() {
  try { return !!getMaterialTrackerRuntime().embedded; } catch { return false; }
}

export function initTheme() {
  if (isEmbedded()) return;
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') document.documentElement.classList.add('dark');
    if (saved === 'light') document.documentElement.classList.remove('dark');
  } catch (err) { console.warn('[Theme] Failed to restore standalone theme:', err); }
}

export function toggleTheme() {
  if (isEmbedded()) return document.documentElement.classList.contains('dark');
  const isDark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch {}
  return isDark;
}

export function getTheme() { return document.documentElement.classList.contains('dark') ? 'dark' : 'light'; }

export function setTheme(theme) {
  if (isEmbedded()) return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}
