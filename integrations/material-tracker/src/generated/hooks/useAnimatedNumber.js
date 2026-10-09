import { useState, useEffect, useRef } from 'react';

export function useAnimatedNumber(target, duration = 600) {
  const [value, setValue] = useState(0);
  // P2 Fix: Use a ref for the "from" value so the animation always
  // starts from the current displayed value, not a stale closure capture
  const displayedRef = useRef(0);

  useEffect(() => {
    if (target == null || isNaN(target)) {
      setValue(0);
      displayedRef.current = 0;
      return;
    }
    const from = displayedRef.current;
    let start = null;
    let rafId;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // Ease out cubic for smoother feel
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(from + (target - from) * eased);
      displayedRef.current = current;
      setValue(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        displayedRef.current = target;
        setValue(target);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}
