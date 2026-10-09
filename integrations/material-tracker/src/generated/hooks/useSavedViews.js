import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from '@material/api/monday-storage';

const KEY = 'material_sourcing_saved_views';

export function useSavedViews() {
  const [views, setViews] = useState([]);
  const vRef = useRef(null);
  const loaded = useRef(false);

  /**
   * Ref that always holds the latest React views state.
   * Updated synchronously inside every setState updater so that
   * persist() reads the freshest data on every attempt (including retries).
   *
   * This eliminates the stale-snapshot race where two rapid save/remove
   * operations could cause a retry to overwrite the second operation's
   * data with stale data from the first.
   */
  const viewsRef = useRef(views);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { value, version } = await storage().key(KEY).get();
        if (cancelled) return;
        vRef.current = version;
        if (Array.isArray(value)) {
          setViews(value);
          viewsRef.current = value;
        }
      } catch (err) {
        console.error('Load saved views:', err);
      } finally {
        loaded.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Persist with retry — reads from viewsRef.current on every attempt.
   *
   * CRITICAL FIX: On version conflict retry, re-reads the latest React
   * state from viewsRef instead of writing a stale pre-computed snapshot.
   * This guarantees that rapid save+save or save+remove sequences always
   * converge to the correct final state, regardless of persist ordering.
   */
  const persist = useCallback(async () => {
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { version } = await storage().key(KEY).get();
        vRef.current = version;
        await storage().key(KEY).version(vRef.current).set(viewsRef.current);
        const { version: newV } = await storage().key(KEY).get();
        vRef.current = newV;
        return;
      } catch (err) {
        lastErr = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }
    console.error('Persist views failed after 3 attempts:', lastErr);
    throw lastErr;
  }, []);

  const save = useCallback(
    (name, filters) => {
      const newView = { name, filters, createdAt: Date.now() };

      setViews((prev) => {
        const next = [...prev, newView];
        viewsRef.current = next;
        return next;
      });

      if (loaded.current) {
        persist().catch(() => {
          setViews((c) => {
            const next = c.filter((v) => v.createdAt !== newView.createdAt);
            viewsRef.current = next;
            return next;
          });
        });
      }
    },
    [persist]
  );

  const remove = useCallback(
    (index) => {
      let removed;

      setViews((prev) => {
        removed = prev[index];
        const next = prev.filter((_, i) => i !== index);
        viewsRef.current = next;
        return next;
      });

      if (loaded.current) {
        persist().catch(() => {
          setViews((c) => {
            const copy = [...c];
            copy.splice(Math.min(index, copy.length), 0, removed);
            viewsRef.current = copy;
            return copy;
          });
        });
      }
    },
    [persist]
  );

  return { views, save, remove };
}
