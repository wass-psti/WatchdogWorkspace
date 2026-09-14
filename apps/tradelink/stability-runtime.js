(() => {
  'use strict';

  const localWrites = new Set();

  const createError = (code, message) => {
    const error = new Error(message);
    error.code = code;
    return error;
  };

  const createMutationGate = (scope = 'tradelink') => {
    const active = new Set();
    return Object.freeze({
      isActive(key) {
        return active.has(`${scope}:${String(key)}`);
      },
      async run(key, task) {
        const token = `${scope}:${String(key)}`;
        if (active.has(token)) {
          throw createError('WM_TRADELINK_MUTATION_BUSY', 'This TradeLink operation is already in progress.');
        }
        active.add(token);
        try {
          return await task();
        } finally {
          active.delete(token);
        }
      },
    });
  };

  const createSerialTaskQueue = () => {
    let tail = Promise.resolve();
    return Object.freeze({
      run(task) {
        const current = tail.catch(() => undefined).then(task);
        tail = current;
        return current;
      },
    });
  };

  const confirmedSet = async (key, value) => {
    const store = globalThis.WMModuleStore;
    if (!store) throw createError('WM_TRADELINK_STORE_UNAVAILABLE', 'TradeLink cloud storage is unavailable.');
    const normalizedKey = String(key);
    const serialized = String(value);
    localWrites.add(normalizedKey);
    try {
      if (typeof store.setItemAsync === 'function') await store.setItemAsync(normalizedKey, serialized);
      else {
        store.setItem(normalizedKey, serialized);
        if (typeof store.flush === 'function') await store.flush();
      }
      const committed = store.getItem(normalizedKey);
      if (committed !== serialized) {
        throw createError('WM_TRADELINK_COMMIT_DIVERGED', `TradeLink cloud state diverged while committing ${normalizedKey}.`);
      }
      return committed;
    } finally {
      localWrites.delete(normalizedKey);
    }
  };

  const confirmedRemove = async (key) => {
    const store = globalThis.WMModuleStore;
    if (!store) throw createError('WM_TRADELINK_STORE_UNAVAILABLE', 'TradeLink cloud storage is unavailable.');
    const normalizedKey = String(key);
    localWrites.add(normalizedKey);
    try {
      store.removeItem(normalizedKey);
      if (typeof store.flush === 'function') await store.flush();
      if (store.getItem(normalizedKey) !== null) {
        throw createError('WM_TRADELINK_DELETE_DIVERGED', `TradeLink cloud state still contains ${normalizedKey} after deletion.`);
      }
      return true;
    } finally {
      localWrites.delete(normalizedKey);
    }
  };

  const refreshStore = async () => {
    const store = globalThis.WMModuleStore;
    if (!store) throw createError('WM_TRADELINK_STORE_UNAVAILABLE', 'TradeLink cloud storage is unavailable.');
    if (typeof store.refresh === 'function') await store.refresh();
    return true;
  };

  const withWorkspaceLock = async (task, options = {}) => {
    const locks = globalThis.WMModuleLocks;
    if (!locks?.acquire || !locks?.release) {
      throw createError('WM_TRADELINK_LOCK_UNAVAILABLE', 'TradeLink distributed workspace locking is unavailable.');
    }
    const lockKey = options.lockKey || 'workspace-state';
    const ttlMs = Number(options.ttlMs) || 60000;
    const lock = await locks.acquire(`tradelink:${lockKey}`, ttlMs);
    if (!lock) throw createError('WM_TRADELINK_WORKSPACE_BUSY', 'TradeLink is being updated in another session. Try again after it finishes.');
    try {
      return await task(lock);
    } finally {
      await locks.release(lock);
    }
  };

  const createStoreChangeBridge = ({ keys, onChange }) => {
    const watched = new Set((keys || []).map(String));
    let disposed = false;
    let refreshQueued = false;

    const queueRefresh = (key, source) => {
      if (disposed || !watched.has(String(key)) || localWrites.has(String(key)) || refreshQueued) return;
      refreshQueued = true;
      queueMicrotask(async () => {
        refreshQueued = false;
        if (disposed) return;
        try {
          await onChange({ key: String(key), source });
        } catch (error) {
          console.error('TradeLink cloud synchronization failed.', error);
        }
      });
    };

    const onStorage = (event) => {
      if (event?.key) queueRefresh(event.key, 'storage');
    };
    const onModuleStore = (event) => {
      const key = event?.detail?.key;
      if (key) queueRefresh(key, 'wm:module-store-change');
    };
    const onPageShow = (event) => {
      if (!event.persisted || disposed) return;
      const primary = [...watched][0];
      if (primary) queueRefresh(primary, 'bfcache');
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('wm:module-store-change', onModuleStore);
    window.addEventListener('pageshow', onPageShow);

    return Object.freeze({
      dispose() {
        if (disposed) return;
        disposed = true;
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('wm:module-store-change', onModuleStore);
        window.removeEventListener('pageshow', onPageShow);
      },
    });
  };

  globalThis.WMTradeLinkStability = Object.freeze({
    createMutationGate,
    createSerialTaskQueue,
    confirmedSet,
    confirmedRemove,
    refreshStore,
    withWorkspaceLock,
    createStoreChangeBridge,
  });
})();
