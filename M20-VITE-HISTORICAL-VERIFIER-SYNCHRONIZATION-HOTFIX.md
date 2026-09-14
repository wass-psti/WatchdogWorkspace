# M20 — Historical Vite Verifier Synchronization Hotfix

## Failure observed during M20 release certification

The authoritative M20 release gate reached `npm run verify:vite` after the bounded CDP browser driver, the Vite dev smoke, the production build, dist verification, and preview smoke had already passed. The historical v1.36 verifier then failed because it still required the removed `runBrowser` and in-file `BROWSER_BIN` implementation markers inside `scripts/verify-vite-server.mjs`.

## Root cause

The M20 browser-harness correction moved browser discovery and lifecycle ownership into `scripts/lib/browser-cdp-smoke.mjs` and added `scripts/verify-vite-browser-cdp-execution.mjs`. The v1.36 verifier still encoded the previous implementation shape rather than the behavioral guarantee.

## Correction

`verify-v1360-vite-migration.mjs` now verifies the current architecture across the split browser files:

- `scripts/verify-vite-server.mjs` imports and uses `findBrowserBinary` and `captureBrowserDom` while still exercising development and production assets.
- `scripts/lib/browser-cdp-smoke.mjs` owns `BROWSER_BIN` discovery, CDP launch, a real wall-clock timeout, and forced browser termination.
- `scripts/verify-vite-browser-cdp-execution.mjs` proves the bounded success and timeout paths.

The historical guarantee is preserved; only stale implementation-marker coupling was removed.

## Scope

This hotfix changes certification/governance verification only. It does not modify the Board repository, Board controllers, Board UI, Realtime transport semantics, Supabase migration, package dependencies, virtualization, or drag-and-drop authorities.
