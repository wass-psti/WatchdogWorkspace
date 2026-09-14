(() => {
  'use strict';

  const DIVERGENCE_CODE = 'WM_FUELTRACK_COMMIT_DIVERGED';

  function createMutationGate() {
    const active = new Set();
    return Object.freeze({
      isActive(key) {
        return active.has(String(key));
      },
      async run(key, task) {
        const normalizedKey = String(key || 'default');
        if (active.has(normalizedKey)) return Object.freeze({ accepted: false, value: undefined });
        active.add(normalizedKey);
        try {
          return Object.freeze({ accepted: true, value: await task() });
        } finally {
          active.delete(normalizedKey);
        }
      },
    });
  }

  function createSerialTaskQueue() {
    const queues = new Map();
    return Object.freeze({
      async run(key, task) {
        const normalizedKey = String(key || 'default');
        const previous = queues.get(normalizedKey) || Promise.resolve();
        const current = previous.catch(() => undefined).then(task);
        queues.set(normalizedKey, current);
        try {
          return await current;
        } finally {
          if (queues.get(normalizedKey) === current) queues.delete(normalizedKey);
        }
      },
    });
  }

  function createConfirmedStateWriter(store) {
    if (!store || typeof store.setItemAsync !== 'function' || typeof store.getItem !== 'function') {
      throw new Error('FuelTrack+ confirmed state writer requires the authenticated module store.');
    }

    async function writeRaw(key, serialized) {
      await store.setItemAsync(key, serialized);
      const committed = store.getItem(key);
      if (committed !== serialized) {
        const error = new Error(`FuelTrack+ cloud state diverged while committing ${key}.`);
        error.code = DIVERGENCE_CODE;
        error.expected = serialized;
        error.committed = committed;
        throw error;
      }
      return serialized;
    }

    return Object.freeze({
      async writeJson(key, value) {
        const serialized = JSON.stringify(value);
        await writeRaw(key, serialized);
        return serialized;
      },
      writeRaw,
    });
  }

  function createStoreChangeBridge({ keys, onChange }) {
    const acceptedKeys = new Set(Array.isArray(keys) ? keys.map(String) : []);
    const listener = (event) => {
      const key = event?.key ?? event?.detail?.key ?? null;
      if (!key || !acceptedKeys.has(String(key))) return;
      onChange?.({ key: String(key), event });
    };
    window.addEventListener('storage', listener);
    window.addEventListener('wm:module-store-change', listener);
    return Object.freeze({
      dispose() {
        window.removeEventListener('storage', listener);
        window.removeEventListener('wm:module-store-change', listener);
      },
    });
  }

  globalThis.WMFuelTrackStability = Object.freeze({
    version: 1,
    divergenceCode: DIVERGENCE_CODE,
    createMutationGate,
    createSerialTaskQueue,
    createConfirmedStateWriter,
    createStoreChangeBridge,
  });
})();
