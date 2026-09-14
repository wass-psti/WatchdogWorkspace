# Stage D M20 — Realtime Lazy Composition Hotfix

## Failure signature

The bounded M12 CDP browser smoke reached a stable React authentication host but remained at `data-wm-authentication-ui-view="boot"` until the real wall-clock timeout.

## Root cause

M20 platform composition created `BoardRealtimeService` during `assets/js/app.ts` module evaluation. The service eagerly called `createSupabaseRealtimeClient(auth.supabase.project)`. On the anonymous/setup-required certification route, Supabase public configuration is intentionally blank. The Realtime transport correctly rejects a blank project, but because that validation happened during global module evaluation, `assets/js/app.ts` rejected before its `bootstrap()` function could call `auth.init()`. React therefore remained on its default boot view.

## Correction

Board Realtime transport construction is now lazy. `createBoardRealtimeService(auth)` is safe to compose regardless of authentication/backend configuration. The Supabase Realtime client is instantiated only when an authenticated Board subscription is requested, after `auth.ensureAccessToken()` and authenticated user identity checks succeed.

This preserves all M20 collaboration semantics while restoring the established authentication/setup-required startup boundary. No Board SQL, repository, RPC, virtualization, drag/drop, or package dependency authority changed.

## Regression guarantee

`scripts/verify-board-collaborative-realtime-execution.mjs` now proves that an unconfigured anonymous auth transport can construct the Board Realtime service without throwing and that subscription fails at the authenticated-session boundary instead of global application composition.
