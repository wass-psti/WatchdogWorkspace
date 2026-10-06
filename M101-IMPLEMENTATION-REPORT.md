# M101 Implementation Report

Implemented preview classification, row-level diagnostics, normalized-value review, explicit row exclusion, remapping/revalidation entry point, deterministic commit-request construction, typed repository integration, and an atomic Supabase PostgreSQL RPC.

Failure-path coverage includes stale-preview concurrency rejection, relationship-resolution rollback, duplicate/concurrent conflict rejection, authorization denial, and no silent exception swallowing.

## Corrective Loop 1 — pgTAP authority fixture
The first local certification attempt reached the disposable Supabase pgTAP gate and failed before any of the 11 assertions executed. The fixture had correctly switched to the `authenticated` role but then attempted a direct read of `public.work_boards.updated_at`. Existing Stage F/G database hardening intentionally keeps sensitive Boards table access behind authenticated RPCs, so PostgreSQL rejected that fixture-only direct table read.

The correction is intentionally limited to `supabase/tests/m101/boards_import_preview_atomic_commit.test.sql`. The fixture now captures and refreshes the board `updated_at` version while executing under the database-owner test context, stores it in the temporary `m101_ids` fixture table, and passes that value to authenticated RPC invocations. This validates the real public contract without weakening table privileges, RLS, or the atomic import function.

Post-correction repository evidence available in the implementation environment:
- M101 M100-certified source guard: PASS.
- M101 Boards import preview/atomic commit verifier: PASS.
- Production database grants: unchanged.
- Production migration/RPC: unchanged.

Execution-dependent certification, including the corrected pgTAP suite, full typecheck/lint/build, browser/E2E, historical aggregate, package hygiene, and certified artifact emission, remains mandatory locally.

## Corrective Loop 2 — pgTAP stale-version fixture authority

The second local certification attempt progressed past the original direct `public.work_boards` permission defect and executed three pgTAP assertions before failing at the stale-preview case. The test created a separate temporary table `m101_version` while running as the database owner, then attempted to read that table after switching to role `authenticated`. Because no privilege had been granted on `m101_version`, PostgreSQL correctly rejected the read before the fourth assertion.

Root-cause classification: test/certification fixture defect. No production RPC, RLS, schema, or application permission defect was established.

Corrective delta:
- Removed the unnecessary `m101_version` temporary table.
- Stored the stale board-version snapshot as a dedicated `stale_version` row in the already-authorized `m101_ids` temporary fixture table.
- Reused the existing `authenticated` SELECT privilege on `m101_ids`.
- Preserved the production RPC-only Boards security boundary with no direct table grant.

Post-correction repository evidence:
- `verify-stage-i-m101-m100-source-guard.mjs`: PASS.
- `verify-v1432-m101-board-import-preview-atomic-commit.mjs`: PASS.
- Full pgTAP/database execution remains local-certification dependent.

## Corrective Loop 3 — Historical Regression Successor Synchronization

Candidate v3 proved the database fixture correction: the direct M101 pgTAP suite and the full certification rerun both passed all 11 atomic-import assertions. The certification subsequently failed at the historical aggregate with exactly three successor-integration failures.

1. `verify-stage-g-m38-runtime-configuration-backend-preflight.mjs` correctly detected that the new Boards repository RPC was absent from the backend capability manifest. This was an implementation integration omission, not a historical-only false positive.
2. `verify-stage-g-m46-boards-backend-data-contract-recovery.mjs` preserved its certified 40-RPC predecessor contract but recognized only the M51 CAS RPC as a governed successor. It now recognizes `wm_import_board_items_atomic` solely through the M101 migration.
3. `verify-stage-g-m51-boards-realtime-concurrency-stabilization.mjs` assumed the consolidated schema must terminate at the M51 migration. It now verifies that M51 remains present and ordered before M101 while requiring the schema to terminate with the M101 successor migration.

No production privilege broadening, RLS relaxation, RPC semantic change, or import transaction change was required. The M101 source guard now explicitly authorizes and protects the four additional successor-integration mutations. Targeted M38/M46/M51 checks and the M98 deterministic readiness chain pass on the corrected state.

