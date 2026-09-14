# Stage F M27 — Realtime platform architecture activation runbook

1. Verify the certified M26 prerequisite.
2. Run `npm run realtime-platform:check`.
3. Run governed ESLint and strict TypeScript.
4. Run the M27 execution vectors.
5. Activate with `npm run realtime-platform:activate` for a non-release transition or `npm run realtime-platform:activate:release` for the complete release gate.
6. Confirm `config/stage-f-m27-realtime-platform-target.ts` reaches `active-certified` only after the production release gate succeeds.

The release activation is transactional: if a post-transition gate fails, M27 rolls back to its prior activation state.
