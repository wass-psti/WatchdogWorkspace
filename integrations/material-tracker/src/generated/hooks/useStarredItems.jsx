// Canonical implementation lives in useStarredItems.js (with proper version tracking and debounced saves).
// This file re-exports to prevent any accidental .jsx-specific imports from loading a stale copy.
export { useStarredItems } from './useStarredItems.js';
