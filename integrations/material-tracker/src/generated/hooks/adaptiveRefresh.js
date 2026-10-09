// Throttle — per-hook rate limiter for manual refreshes.
export function createThrottle(minMs = 3000) {
  let last = 0;
  return {
    canProceed() {
      const now = Date.now();
      if (now - last < minMs) return false;
      last = now;
      return true;
    },
    reset() { last = 0; }
  };
}

// Circuit Breaker — after threshold consecutive failures, stops calls for cooldown period.
export function createCircuitBreaker(threshold = 3, cooldown = 30000) {
  let failures = 0;
  let openedAt = null;
  return {
    recordSuccess() { failures = 0; openedAt = null; },
    recordFailure() {
      failures++;
      if (failures >= threshold) openedAt = Date.now();
    },
    isOpen() {
      if (!openedAt) return false;
      if (Date.now() - openedAt >= cooldown) {
        openedAt = null;
        failures = 0;
        return false;
      }
      return true;
    },
    reset() { failures = 0; openedAt = null; }
  };
}

// Exponential backoff with jitter for retry delays.
export function getBackoffDelay(attempt, base = 5000, max = 60000) {
  return Math.min(base * Math.pow(2, attempt), max) + Math.random() * 2000;
}
