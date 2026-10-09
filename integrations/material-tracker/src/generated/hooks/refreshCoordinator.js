// Central Refresh Coordinator — prevents multiple hooks from firing simultaneously.
// Each hook gets a stagger offset (8s apart). Enforces 30s minimum gap per hook.
// Mutual exclusion: only one hook can refresh at a time.
// Pauses all refreshes when browser tab is hidden.

const hooks = {};
let paused = false;
let counter = 0;
let activeHook = null;
const STAGGER = 8000;
const MIN_GAP = 30000;

export function register(id) {
  if (!hooks[id]) {
    hooks[id] = { offset: counter++ * STAGGER, lastFired: 0 };
  }
  return hooks[id];
}

export function canFire(id) {
  if (paused) return false;
  if (activeHook && activeHook !== id) return false;
  const h = hooks[id];
  return h ? Date.now() - h.lastFired >= MIN_GAP : false;
}

export function recordFire(id) {
  if (hooks[id]) hooks[id].lastFired = Date.now();
}

export function getOffset(id) {
  return hooks[id]?.offset || 0;
}

export function isPaused() {
  return paused;
}

export function setActive(id) { activeHook = id; }
export function clearActive() { activeHook = null; }

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
  });
}
