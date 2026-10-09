import { useState, useEffect, useCallback, useRef } from 'react';
import { usePersistence } from './usePersistence';

const STORAGE_KEY = 'material_sourcing_starred';
const FLUSH_INTERVAL = 5000;

// Stable conflict resolver — defined outside the hook to avoid
// recreating the function on every render (was causing usePersistence
// callback identity churn → infinite load loops)
function starredConflictResolver(localData, remoteData) {
  const localSet = new Set(Array.isArray(localData) ? localData : []);
  const remoteSet = new Set(Array.isArray(remoteData) ? remoteData : []);
  return [...new Set([...localSet, ...remoteSet])];
}

// Stable options object — created once, never changes
const PERSISTENCE_OPTIONS = { onConflict: starredConflictResolver };

export function useStarredItems() {
  const [starred, setStarred] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  // usePersistence now stabilizes callbacks via refs internally,
  // but we also stabilize the options object to avoid unnecessary work
  const { load, debouncedSave, flush, hasPending } = usePersistence(
    STORAGE_KEY,
    PERSISTENCE_OPTIONS
  );

  // Load on mount — uses cancellation pattern that works correctly in
  // React strict mode (both mounts fire, first is cancelled, second completes).
  // No loadedOnceRef guard — that would block the second mount from loading.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const value = await load();
        if (cancelled) return;
        if (Array.isArray(value)) setStarred(new Set(value));
      } catch (err) {
        if (cancelled) return;
        console.error('[Starred] Load failed:', err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // `load` identity is stable (deps: [storageKey, maxRetries] — both constants)
    // so this effect runs exactly once in production, twice in strict mode (first cancelled).
  }, [load]);

  // Auto-flush pending writes every 5s — guards against data loss
  // if the user closes the tab mid-debounce
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      if (hasPending()) {
        flush();
      }
    }, FLUSH_INTERVAL);
    return () => {
      clearInterval(interval);
      // On unmount, flush any pending writes (fire-and-forget async)
      if (hasPending()) {
        flush();
      }
    };
  }, [loaded, flush, hasPending]);

  const toggle = useCallback(
    (itemId) => {
      setStarred((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        debouncedSave([...next], 1500);
        return next;
      });
    },
    [debouncedSave]
  );

  const isStarred = useCallback((id) => starred.has(id), [starred]);

  return { starred, toggle, isStarred };
}
