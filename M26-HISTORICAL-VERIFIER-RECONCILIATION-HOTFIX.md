# Stage E M26 — Historical Verifier Reconciliation Hotfix

This corrective RC reconciles the historical v1.41 non-visual runtime verifier with the Architecture 34 hybrid module-presentation authority introduced by M26.

## Corrective scope

- `verify-v1410-nonvisual-runtime.mjs` now verifies `wm:module-store-invalidate` dispatch through `modulePresentationHost.invalidate`, preserving retained-iframe and native-host invalidation semantics through one authoritative presentation boundary.
- `verify-stage-e-m26-iframe-retirement.mjs` now prevents regression to the obsolete direct `moduleHost.invalidate` assertion and verifies the shell routes invalidation through the hybrid presentation host.
- `scripts/activate-stage-e-m26.mjs` now rolls `activationState` back to its prior value when any post-transition certification gate fails, preventing failed certification attempts from leaving an extracted RC stranded in a transitional state.

## Non-goals / preserved provenance

- No production module runtime behavior is changed.
- No iframe retirement is claimed. TimeTracker, FuelTrack+, and TradeLink remain retained compatibility islands.
- No dependency changes.
- No Supabase schema or migration changes.
- Architecture remains version 34.
