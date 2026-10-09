import { useState, useEffect, useRef, useCallback } from 'react';
import { register, canFire, recordFire, isPaused, getOffset, setActive, clearActive } from './refreshCoordinator';
import { createThrottle, createCircuitBreaker } from './adaptiveRefresh';

export function useAutoRefresh(hookId, fetchFn, { baseInterval = 30000, throttleMs = 3000 } = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const intervalRef = useRef(null);
  const fetchRef = useRef(fetchFn);
  const silentRef = useRef(null);
  const throttleRef = useRef(createThrottle(throttleMs));
  const circuitRef = useRef(createCircuitBreaker(3, 30000));
  // D2: Debounce timer ref for visibility change handler
  const visDebounceRef = useRef(null);
  fetchRef.current = fetchFn;

  useEffect(() => { register(hookId); }, [hookId]);

  const silentRefresh = useCallback(async () => {
    if (isPaused() || !canFire(hookId) || circuitRef.current.isOpen()) return;
    setActive(hookId);
    setIsRefreshing(true);
    try {
      await fetchRef.current();
      recordFire(hookId);
      circuitRef.current.recordSuccess();
      setLastRefreshed(new Date());
    } catch (err) {
      circuitRef.current.recordFailure();
    } finally {
      setIsRefreshing(false);
      clearActive();
    }
  }, [hookId]);

  silentRef.current = silentRefresh;

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const ms = baseInterval + getOffset(hookId) + Math.random() * 2000;
    intervalRef.current = setInterval(() => silentRef.current?.(), ms);
  }, [hookId, baseInterval]);

  const manualRefresh = useCallback(async () => {
    if (!throttleRef.current.canProceed()) return false;
    circuitRef.current.reset();
    setActive(hookId);
    setIsRefreshing(true);
    try {
      await fetchRef.current();
      recordFire(hookId); // P0 Fix: Register manual refreshes so auto-refresh doesn't fire immediately after
      circuitRef.current.recordSuccess();
      setLastRefreshed(new Date());
      startInterval();
      return true;
    } catch (err) {
      circuitRef.current.recordFailure();
      return false;
    } finally {
      setIsRefreshing(false);
      clearActive();
    }
  }, [hookId, startInterval]);

  useEffect(() => {
    startInterval();
    // D2: Debounced visibility handler to prevent duplicate intervals on rapid tab switches
    const onVis = () => {
      if (document.hidden) {
        // Tab going hidden — stop interval immediately
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        // Cancel any pending resume debounce
        if (visDebounceRef.current) { clearTimeout(visDebounceRef.current); visDebounceRef.current = null; }
      } else {
        // Tab becoming visible — debounce 2s before resuming to avoid double-fire on rapid switches
        if (visDebounceRef.current) clearTimeout(visDebounceRef.current);
        visDebounceRef.current = setTimeout(() => {
          visDebounceRef.current = null;
          silentRef.current?.();
          startInterval();
        }, 2000);
      }
    };
    const onHostInvalidate = () => silentRef.current?.();
    window.addEventListener('watchdog:material-tracker:invalidate', onHostInvalidate);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (visDebounceRef.current) clearTimeout(visDebounceRef.current);
      window.removeEventListener('watchdog:material-tracker:invalidate', onHostInvalidate);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [startInterval]);

  return { isRefreshing, lastRefreshed, manualRefresh };
}
