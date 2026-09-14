(() => {
'use strict';

function createConfirmedStateWriter(store) {
  if (!store || typeof store.getItem !== 'function') throw new TypeError('A TimeTracker module store is required.');

  const write = async ({ key, value, backupKey = null }) => {
    const normalizedKey = String(key || '').trim();
    if (!normalizedKey) throw new TypeError('A state key is required.');
    const serialized = String(value);

    if (backupKey) {
      const current = store.getItem(normalizedKey);
      if (current) {
        try {
          if (typeof store.setItemAsync === 'function') await store.setItemAsync(String(backupKey), current);
          else store.setItem(String(backupKey), current);
        } catch (error) {
          console.warn(`TimeTracker recovery-copy update failed for ${normalizedKey}; primary commit will still be attempted.`, error);
        }
      }
    }

    if (typeof store.setItemAsync === 'function') {
      await store.setItemAsync(normalizedKey, serialized);
    } else {
      store.setItem(normalizedKey, serialized);
      await store.flush?.();
    }

    // The compatibility cloud store may resolve a revision conflict by merging the
    // remote and local JSON values. Critical TimeTracker mutations must never report
    // success when that recovered value differs from the mutation the caller asked
    // to commit. The caller can then reload the authoritative state and retry.
    const committed = store.getItem(normalizedKey);
    if (committed !== serialized) {
      throw new Error(`TimeTracker cloud state changed while ${normalizedKey} was being committed. Reload the authoritative state, review the latest value, and retry.`);
    }
    return true;
  };

  return Object.freeze({ write });
}

function createMutationGate() {
  let busy = false;
  return Object.freeze({
    get busy() { return busy; },
    async run(task) {
      if (busy) return Object.freeze({ executed: false, value: undefined });
      busy = true;
      try {
        return Object.freeze({ executed: true, value: await task() });
      } finally {
        busy = false;
      }
    },
  });
}

function normalizedStoreChange(event) {
  if (event?.type === 'storage') {
    return Object.freeze({
      key: event.key == null ? null : String(event.key),
      oldValue: event.oldValue == null ? null : String(event.oldValue),
      newValue: event.newValue == null ? null : String(event.newValue),
    });
  }
  const detail = event?.detail;
  if (!detail || typeof detail !== 'object') return null;
  return Object.freeze({
    key: detail.key == null ? null : String(detail.key),
    oldValue: detail.oldValue == null ? null : String(detail.oldValue),
    newValue: detail.newValue == null ? null : String(detail.newValue),
  });
}

function installModuleStoreChangeBridge(target, handler) {
  if (!target?.addEventListener || typeof handler !== 'function') throw new TypeError('A browser event target and handler are required.');
  const abort = new AbortController();
  const listener = (event) => {
    const change = normalizedStoreChange(event);
    if (change) handler(change, event);
  };
  target.addEventListener('storage', listener, { signal: abort.signal });
  target.addEventListener('wm:module-store-change', listener, { signal: abort.signal });
  return Object.freeze({ dispose: () => abort.abort() });
}

globalThis.WMTimeTrackerStability = Object.freeze({
  createConfirmedStateWriter,
  createMutationGate,
  installModuleStoreChangeBridge,
});
})();
