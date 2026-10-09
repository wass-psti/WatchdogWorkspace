import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { storage } from '@material/api/monday-storage';
import { useBeforeUnload } from './useBeforeUnload';

const STORAGE_KEY = 'material_sourcing_col_prefs';
const STORAGE_KEY_WIDTHS = 'material_sourcing_col_widths';
const STORAGE_KEY_ORDER = 'material_sourcing_col_order';
const BACKUP_KEY_VIS = `${STORAGE_KEY}_backup`;
const BACKUP_KEY_WIDTHS = `${STORAGE_KEY_WIDTHS}_backup`;
const BACKUP_KEY_ORDER = `${STORAGE_KEY_ORDER}_backup`;

const AUTO_HIDE_NARROW = [
  'shipping', 'shipCur', 'shipPhp', 'lead', 'exUsd', 'exEur',
  'landed', 'totalLanded', 'totalVat', 'supplierPo', 'account',
];
const AUTO_HIDE_VERY_NARROW = ['selling', 'creator', 'rfqRefNo', 'desc'];

// Max retries for versioned writes
const MAX_RETRIES = 3;

export function useColumnPrefs(defaultVisibility) {
  const [vis, setVis] = useState(defaultVisibility);
  const [colWidths, setColWidths] = useState({});
  const [colOrder, setColOrder] = useState(null);
  const [autoHidden, setAutoHidden] = useState(new Set());
  const userToggledRef = useRef(new Set());
  const versionRef = useRef(null);
  const loaded = useRef(false);
  const saveTimer = useRef(null);
  const widthSaveTimer = useRef(null);
  const pendingVisRef = useRef(null);
  const pendingWidthsRef = useRef(null);
  const pendingOrderRef = useRef(null);

  // Single load effect — checks for localStorage backup first, then loads from monday storage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Step 1: Check for localStorage backups (from a previous tab-close-during-debounce)
        let visBackup = null;
        let widthsBackup = null;
        let orderBackup = null;
        try {
          const rawVis = localStorage.getItem(BACKUP_KEY_VIS);
          const rawWidths = localStorage.getItem(BACKUP_KEY_WIDTHS);
          const rawOrder = localStorage.getItem(BACKUP_KEY_ORDER);
          if (rawVis) visBackup = JSON.parse(rawVis);
          if (rawWidths) widthsBackup = JSON.parse(rawWidths);
          if (rawOrder) orderBackup = JSON.parse(rawOrder);
        } catch (e) {
          // Corrupted backup — ignore
        }

        // Step 2: If we have backups, push them to monday storage first
        if (visBackup) {
          try {
            const { version } = await storage().key(STORAGE_KEY).get();
            await storage().key(STORAGE_KEY).version(version).set(visBackup);
            localStorage.removeItem(BACKUP_KEY_VIS);
          } catch (err) {
            console.error('[ColumnPrefs] Backup restore failed (backup preserved for next boot):', err);
          }
        }
        if (widthsBackup) {
          try {
            await storage().key(STORAGE_KEY_WIDTHS).set(widthsBackup);
            localStorage.removeItem(BACKUP_KEY_WIDTHS);
          } catch (err) {
            console.error('[ColumnPrefs] Width backup restore failed:', err);
          }
        }
        if (orderBackup) {
          try {
            await storage().key(STORAGE_KEY_ORDER).set(orderBackup);
            localStorage.removeItem(BACKUP_KEY_ORDER);
          } catch (err) {
            console.error('[ColumnPrefs] Order backup restore failed:', err);
          }
        }

        if (cancelled) return;

        // Step 3: Now load the authoritative state from monday storage
        const [visResult, widthResult, orderResult] = await Promise.all([
          storage().key(STORAGE_KEY).get(),
          storage().key(STORAGE_KEY_WIDTHS).get().catch(() => ({ value: null })),
          storage().key(STORAGE_KEY_ORDER).get().catch(() => ({ value: null })),
        ]);
        if (cancelled) return;

        versionRef.current = visResult.version;
        if (visResult.value && typeof visResult.value === 'object') {
          setVis((prev) => ({ ...prev, ...visResult.value }));
        }
        if (widthResult.value && typeof widthResult.value === 'object') {
          setColWidths(widthResult.value);
        }
        if (Array.isArray(orderResult.value)) {
          setColOrder(orderResult.value);
        }
      } catch (err) {
        console.error('Load col prefs:', err);
      } finally {
        loaded.current = true;
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(saveTimer.current);
      clearTimeout(widthSaveTimer.current);
    };
  }, []);

  // Responsive auto-hide with throttled resize
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const hide = new Set();
      if (w < 1024)
        AUTO_HIDE_NARROW.forEach((k) => {
          if (!userToggledRef.current.has(k)) hide.add(k);
        });
      if (w < 768)
        AUTO_HIDE_VERY_NARROW.forEach((k) => {
          if (!userToggledRef.current.has(k)) hide.add(k);
        });
      setAutoHidden(hide);
    };
    check();
    let throttleTimer = null;
    const throttledCheck = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        check();
      }, 200);
    };
    window.addEventListener('resize', throttledCheck);
    return () => {
      window.removeEventListener('resize', throttledCheck);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []);

  /**
   * Debounced save with retry on version conflict.
   * On success, only clears pendingVisRef if no newer data has arrived
   * during the retry window — prevents destroying fresher data.
   */
  const debouncedSave = useCallback((newVis) => {
    if (!loaded.current) return;
    pendingVisRef.current = newVis;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const dataToWrite = pendingVisRef.current;
      let lastErr;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const { version: freshVersion } = await storage().key(STORAGE_KEY).get();
          versionRef.current = freshVersion;
          await storage().key(STORAGE_KEY).version(versionRef.current).set(dataToWrite);
          const { version } = await storage().key(STORAGE_KEY).get();
          versionRef.current = version;
          if (pendingVisRef.current === dataToWrite) {
            pendingVisRef.current = null;
          }
          return;
        } catch (err) {
          lastErr = err;
          if (attempt < MAX_RETRIES - 1) {
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          }
        }
      }
      console.error(
        '[ColumnPrefs] Save failed after retries (data preserved for backup):',
        lastErr
      );
    }, 1500);
  }, []);

  const toggle = useCallback(
    (key) => {
      userToggledRef.current.add(key);
      setVis((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave]
  );

  /**
   * Column width save — debounced with 2-attempt retry.
   * On failure, pendingWidthsRef stays populated for beforeunload backup.
   */
  const setColWidth = useCallback((key, width) => {
    setColWidths((prev) => {
      const updated = { ...prev, [key]: width };
      pendingWidthsRef.current = updated;
      clearTimeout(widthSaveTimer.current);
      widthSaveTimer.current = setTimeout(async () => {
        const dataToWrite = pendingWidthsRef.current;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            await storage().key(STORAGE_KEY_WIDTHS).set(dataToWrite);
            if (pendingWidthsRef.current === dataToWrite) {
              pendingWidthsRef.current = null;
            }
            return;
          } catch (err) {
            if (attempt === 0) {
              await new Promise((r) => setTimeout(r, 500));
            } else {
              console.error('[ColumnPrefs] Save widths failed after retry:', err);
              // pendingWidthsRef stays populated for beforeunload backup
            }
          }
        }
      }, 1000);
      return updated;
    });
  }, []);

  /**
   * Column order save — immediate with 2-attempt retry.
   * Tracks pending state for beforeunload backup on failure.
   */
  const updateColOrder = useCallback((order) => {
    setColOrder(order);
    pendingOrderRef.current = order;
    (async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await storage().key(STORAGE_KEY_ORDER).set(order);
          // Only clear if no newer order arrived during our write
          if (pendingOrderRef.current === order) {
            pendingOrderRef.current = null;
          }
          return;
        } catch (err) {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 500));
          } else {
            console.error('[ColumnPrefs] Save order failed after retry:', err);
            // pendingOrderRef stays populated for beforeunload backup
          }
        }
      }
    })();
  }, []);

  // P1 Fix: Batch set visibility — single state update + single save for "Show All" / "Reset"
  const batchSetVis = useCallback(
    (newVis) => {
      Object.keys(newVis).forEach((k) => userToggledRef.current.add(k));
      setVis(newVis);
      debouncedSave(newVis);
    },
    [debouncedSave]
  );

  const effectiveVis = useMemo(() => {
    const result = { ...vis };
    autoHidden.forEach((k) => {
      result[k] = false;
    });
    return result;
  }, [vis, autoHidden]);

  // beforeunload: back up ALL pending data to localStorage (sync-only, last resort)
  useBeforeUnload(() => {
    if (pendingVisRef.current) {
      clearTimeout(saveTimer.current);
      try {
        localStorage.setItem(
          BACKUP_KEY_VIS,
          JSON.stringify(pendingVisRef.current)
        );
      } catch (e) {
        /* quota or private browsing — nothing we can do */
      }
    }
    if (pendingWidthsRef.current) {
      clearTimeout(widthSaveTimer.current);
      try {
        localStorage.setItem(
          BACKUP_KEY_WIDTHS,
          JSON.stringify(pendingWidthsRef.current)
        );
      } catch (e) {
        /* quota or private browsing */
      }
    }
    if (pendingOrderRef.current) {
      try {
        localStorage.setItem(
          BACKUP_KEY_ORDER,
          JSON.stringify(pendingOrderRef.current)
        );
      } catch (e) {
        /* quota or private browsing */
      }
    }
  });

  return {
    colVis: effectiveVis,
    rawVis: vis,
    toggleCol: toggle,
    batchSetVis,
    setColVis: setVis,
    colWidths,
    setColWidth,
    colOrder,
    setColOrder: updateColOrder,
  };
}
