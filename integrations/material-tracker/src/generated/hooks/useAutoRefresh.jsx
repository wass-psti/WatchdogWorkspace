// Canonical implementation lives in useAutoRefresh.js (advanced version with coordinator, circuit breaker, visibility handling).
// This file re-exports to prevent any accidental .jsx-specific imports from loading a stale copy.
export { useAutoRefresh } from './useAutoRefresh.js';
