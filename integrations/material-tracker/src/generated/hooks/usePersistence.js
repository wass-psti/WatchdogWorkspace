import { useRef, useCallback } from 'react';
import { storage } from '@material/api/monday-storage';

/**
 * Resilient persistence layer with retry logic and atomic version updates.
 *
 * Wraps monday.com storage API with:
 * - Automatic retry on transient failures (exponential backoff)
 * - Atomic version fetching (prevents race conditions)
 * - Conflict detection and callback hooks
 * - Debounced save with real flush (actually writes pending data)
 * - Stable callback identities regardless of caller re-renders
 * - Safe restore: never overwrites newer pending data on failure
 *
 * @param {string} storageKey
 * @param {object} options
 * @param {function} options.onConflict - (localData, remoteData) => resolvedData
 * @param {number} options.maxRetries - default 3
 */
export function usePersistence(storageKey, options = {}) {
  const { onConflict = null, maxRetries = 3 } = options;

  const versionRef = useRef(null);
  const pendingTimerRef = useRef(null);
  const pendingDataRef = useRef(null);

  // Stabilize onConflict with a ref — prevents doWrite/save/flush identity churn
  // when callers pass inline arrow functions as onConflict
  const onConflictRef = useRef(onConflict);
  onConflictRef.current = onConflict;

  const load = useCallback(async () => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await storage().key(storageKey).get();
        versionRef.current = result.version;
        return result.value;
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise(r =>
            setTimeout(r, Math.min(1000 * Math.pow(2, attempt - 1), 5000))
          );
        }
      }
    }
    console.error(
      `[Persistence:${storageKey}] Load failed after ${maxRetries} attempts:`,
      lastError
    );
    throw lastError;
  }, [storageKey, maxRetries]);

  /**
   * Internal write with retry + conflict resolution.
   * Uses onConflictRef (stable ref) so this callback identity never changes
   * due to caller-side onConflict recreation.
   */
  const doWrite = useCallback(
    async (data) => {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await storage()
            .key(storageKey)
            .version(versionRef.current)
            .set(data);
          // Refresh version after successful write
          const { version } = await storage().key(storageKey).get();
          versionRef.current = version;
          return;
        } catch (err) {
          lastError = err;
          const isVersionConflict =
            err.message?.includes('version') ||
            err.message?.includes('conflict');

          if (onConflictRef.current && isVersionConflict) {
            // Attempt conflict resolution — also retried within the outer loop
            try {
              const { value: remoteData, version: remoteVersion } =
                await storage().key(storageKey).get();
              versionRef.current = remoteVersion;
              const resolved = await onConflictRef.current(data, remoteData);
              await storage()
                .key(storageKey)
                .version(versionRef.current)
                .set(resolved);
              const { version: newV } = await storage().key(storageKey).get();
              versionRef.current = newV;
              return;
            } catch (conflictErr) {
              // If the resolution write itself conflicts, let the outer loop retry
              lastError = conflictErr;
              if (attempt < maxRetries) {
                await new Promise(r =>
                  setTimeout(
                    r,
                    Math.min(1000 * Math.pow(2, attempt - 1), 5000)
                  )
                );
                continue;
              }
            }
          }

          if (attempt < maxRetries) {
            await new Promise(r =>
              setTimeout(r, Math.min(1000 * Math.pow(2, attempt - 1), 5000))
            );
          }
        }
      }
      console.error(
        `[Persistence:${storageKey}] Save failed after ${maxRetries} attempts:`,
        lastError
      );
      throw lastError;
    },
    [storageKey, maxRetries]
  );

  /**
   * Immediate save — cancels any pending debounced write.
   */
  const save = useCallback(
    async (data) => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
        pendingDataRef.current = null;
      }
      await doWrite(data);
    },
    [doWrite]
  );

  /**
   * Debounced save — queues data and writes after delay.
   * Safe for rapid calls: each call replaces the pending data.
   * On failure, restores pending data ONLY if no newer data has been queued
   * since we started writing — prevents overwriting newer data with stale data.
   */
  const debouncedSave = useCallback(
    (data, delay = 1500) => {
      pendingDataRef.current = data;
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
      }
      pendingTimerRef.current = setTimeout(async () => {
        pendingTimerRef.current = null;
        const toWrite = pendingDataRef.current;
        pendingDataRef.current = null;
        if (toWrite !== null) {
          try {
            await doWrite(toWrite);
          } catch (err) {
            // SAFE RESTORE: Only put data back if nothing newer has arrived.
            // If pendingDataRef is no longer null, a newer debouncedSave call
            // already queued fresher data — don't overwrite it with our stale data.
            if (pendingDataRef.current === null) {
              pendingDataRef.current = toWrite;
            }
            console.error(
              `[Persistence:${storageKey}] Debounced save failed (data preserved for retry):`,
              err
            );
          }
        }
      }, delay);
    },
    [doWrite, storageKey]
  );

  /**
   * Flush — immediately writes any pending debounced data.
   * On failure, restores pending data ONLY if no newer data arrived during the write.
   */
  const flush = useCallback(async () => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    const toWrite = pendingDataRef.current;
    pendingDataRef.current = null;
    if (toWrite !== null) {
      try {
        await doWrite(toWrite);
      } catch (err) {
        // SAFE RESTORE: Only if no newer data arrived during our write attempt
        if (pendingDataRef.current === null) {
          pendingDataRef.current = toWrite;
        }
        console.error(
          `[Persistence:${storageKey}] Flush failed (data preserved for retry):`,
          err
        );
      }
    }
  }, [doWrite, storageKey]);

  /**
   * Check if there's pending data that hasn't been written yet.
   */
  const hasPending = useCallback(() => pendingDataRef.current !== null, []);

  return {
    load,
    save,
    debouncedSave,
    flush,
    hasPending,
    getVersion: () => versionRef.current,
  };
}
