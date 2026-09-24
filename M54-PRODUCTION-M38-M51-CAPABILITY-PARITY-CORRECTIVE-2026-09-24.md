# M54 Production M38/M51 Capability Parity Corrective — 2026-09-24

## Originating failure
The live M54 post-deployment workflow authenticated successfully after the M39 production corrective, then failed to render the Account route. Direct production diagnostics returned `PGRST202` because `public.wm_runtime_capabilities()` was absent.

## Root cause found before deployment
The current client capability manifest already requires the M51 CAS RPC `wm_set_board_cell_if_current`, but the canonical database definition of `public.wm_runtime_capabilities()` still used the older pre-M51 RPC inventory. Deploying the historical M38/M42 function unchanged would recover Account but later falsely gate Boards.

## Corrective implementation
- Added a new forward-only M54 migration: `supabase/migrations/v1.43.2-stage-g-m54-runtime-capability-m51-parity-corrective.sql`.
- Synchronized `supabase/schema.sql` so `wm_runtime_capabilities()` reports `wm_set_board_cell_if_current`.
- Left historical M38/M42 migration files immutable.
- Hardened the M54 static verifier to bind the client capability manifest, canonical schema, and new forward migration to the same M51 CAS capability.

## Certification boundary
This corrective is not certified until the forward migration is dry-run/applied to production, the exact M38 capability diagnostic passes, the full local fail-closed verification sequence is rerun for Candidate 07, and the live GitHub Pages workflow completes through attestation and baseline freeze.
