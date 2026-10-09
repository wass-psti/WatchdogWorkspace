import { useEffect, useRef } from 'react';

/**
 * Hook to execute cleanup callback before the browser tab/window closes.
 * 
 * ONLY fires on the actual beforeunload event (tab close, navigation away).
 * Does NOT fire on React unmount/remount (strict mode, hot reload) — that
 * would cause spurious writes and is a bug, not a feature.
 * 
 * IMPORTANT: Modern browsers restrict beforeunload — only simple synchronous
 * operations are guaranteed to complete. Use this for writing to localStorage
 * or navigator.sendBeacon, NOT for async fetch/XHR.
 * 
 * @param {Function} callback - Synchronous cleanup function
 */
export function useBeforeUnload(callback) {
  const callbackRef = useRef(callback);

  // Keep callback ref fresh without re-registering the listener
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = () => {
      try {
        callbackRef.current?.();
      } catch (err) {
        console.error('[BeforeUnload] Cleanup failed:', err);
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
}
