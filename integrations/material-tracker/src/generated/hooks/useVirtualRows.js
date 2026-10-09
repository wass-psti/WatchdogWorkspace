import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Tier 3: Lightweight row virtualization using IntersectionObserver.
 * For lists exceeding ~150 rows, this defers mounting of off-screen rows
 * until they enter a generous margin around the viewport.
 * 
 * Returns a Set of item IDs that should currently be mounted.
 * Items not in the set render a lightweight placeholder row.
 * 
 * For lists under the threshold, returns null (meaning "render all").
 * 
 * Tier 1 Fix #5: Single long-lived observer — never disconnect/recreate on rapid length changes.
 * Instead, maintain a single observer and update the initialSet without tearing it down.
 */
export function useVirtualRows(flatItemIds, { threshold = 150, rootMargin = '600px' } = {}) {
  const [visibleIds, setVisibleIds] = useState(null);
  const observerRef = useRef(null);
  const placeholderMapRef = useRef(new Map()); // id → element
  const mountedRef = useRef(true);

  // Only activate for large lists
  const isActive = flatItemIds.length > threshold;

  // Initial visible window: first N items visible immediately
  const initialCount = Math.min(50, flatItemIds.length);

  // Create or reuse the long-lived observer — only recreated if rootMargin changes
  useEffect(() => {
    mountedRef.current = true;

    if (!isActive) {
      setVisibleIds(null);
      // Disconnect observer if it existed from a previous active state
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    // Only create if we don't already have one
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (!mountedRef.current) return;
          const toAdd = [];
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const id = entry.target.dataset?.virtualId;
              if (id) toAdd.push(id);
            }
          }
          if (toAdd.length) {
            setVisibleIds(prev => {
              if (!prev) return null;
              const next = new Set(prev);
              let changed = false;
              for (const id of toAdd) {
                if (!next.has(id)) { next.add(id); changed = true; }
              }
              return changed ? next : prev;
            });
          }
        },
        { rootMargin, threshold: 0 }
      );
    }

    return () => {
      mountedRef.current = false;
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
    // Only recreate observer when rootMargin or isActive changes — NOT on length changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, rootMargin]);

  // Update the initial visible set when flatItemIds change — without recreating the observer
  useEffect(() => {
    if (!isActive) return;

    // Build initial visible set from current flatItemIds
    const initialSet = new Set();
    for (let i = 0; i < initialCount; i++) {
      if (flatItemIds[i]) initialSet.add(flatItemIds[i]);
    }

    // Merge with existing visible ids (don't remove already-visible items)
    setVisibleIds(prev => {
      if (!prev) return initialSet;
      const merged = new Set(prev);
      for (const id of initialSet) merged.add(id);
      return merged;
    });

    // Re-observe any registered placeholders that aren't in the visible set
    if (observerRef.current) {
      placeholderMapRef.current.forEach((el, id) => {
        if (el && !initialSet.has(id)) {
          observerRef.current.observe(el);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, flatItemIds.length]);

  // Register a placeholder element for observation — stable callback
  const registerPlaceholder = useCallback((id, element) => {
    const prev = placeholderMapRef.current.get(id);
    if (prev === element) return; // Same element, no-op

    // Unobserve previous element for this id
    if (prev && observerRef.current) {
      observerRef.current.unobserve(prev);
    }

    if (element) {
      placeholderMapRef.current.set(id, element);
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    } else {
      placeholderMapRef.current.delete(id);
    }
  }, []);

  return { visibleIds, isActive, registerPlaceholder };
}
