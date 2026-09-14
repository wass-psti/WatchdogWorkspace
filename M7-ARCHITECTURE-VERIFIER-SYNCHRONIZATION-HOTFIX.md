# Stage B M7 — Architecture Verifier Synchronization Hotfix

The first M7 release-candidate certification reached the inherited Vite migration gate and failed because two historical verifiers still required Architecture Version 16 even though M7 correctly advances the application manifest to Architecture Version 17.

## Corrected verifiers

- `verify-v1360-vite-migration.mjs` now validates the current M7 Architecture Version 17 while retaining all Vite migration assertions.
- `verify-v1350-platform-architecture.mjs` now validates the current M7 Architecture Version 17 while retaining all platform-modernization assertions.
- `verify-v1216-item-workspace.mjs` now resolves the private signed-file transport marker through the M7 adapter, where Storage URL ownership now lives.
- `verify-stage-b-m7-supabase-client-adapter.mjs` now contains regression checks that reject stale Architecture Version 16 pins and stale pre-M7 backend transport ownership assumptions.

## Scope

This hotfix changes certification metadata synchronization only. It does not change Supabase transport behavior, authentication/session authority, RLS/RPC authorization, Board semantics, embedded-module behavior, UI behavior, database schema, or dependency versions.
