# Release Status — v1.43.2 Stage G M51 Boards Realtime & Concurrency Stabilization

State: active-certified
Semantics: 1.43.2-m51-v1
Date: 2026-09-23

M51 repository implementation is complete for the currently identified scope after the Candidate 03 ESLint corrective, but the release is not certified.

Deterministic verification passes for Presence cleanup, reconnect cancellation, shared token-refresh architecture, remote reconciliation retry, reconnect canonical catch-up, interaction-safe fallback, and simulated two-session convergence. Existing-item interactive mutation paths use field-scoped compare-and-set persistence, including item dialogs, Item Workspace, inline editing, modal cell editing, and undo/redo. Stale same-field writes fail closed with SQLSTATE 40001 while non-overlapping fields remain independently mergeable.

The authoritative M51 migration is included in both `supabase/migrations/` and the consolidated `supabase/schema.sql`. M51 also includes disposable pgTAP database verification, candidate/release gates, deterministic source-tree certification binding, and a finalizer that does not require hidden Git metadata.

Certification remains fail-closed because dependency restoration/full static/build gates, disposable database execution, authenticated two-session production-equivalent browser verification, historical regression, and final artifact certification have not all completed successfully in the current environment.

No M51 PASS record or active-certified baseline is valid until `npm run boards-realtime-concurrency:certify` completes successfully after all release prerequisites are satisfied.


## Candidate 03 corrective

Local Candidate 02 execution exposed seven `no-promise-executor-return` failures in the M51 execution verifier. Candidate 03 corrects all seven Promise executor contracts without changing timing semantics. The corrected verifier passes syntax validation and the M51 deterministic execution/static suites. Full local static/build/database/browser/release/historical/certification gates remain fail-closed and must be rerun on Candidate 03.

## Candidate 04 database-contract corrective

Candidate 03 local verification passed dependency restoration, lockfile verification, ESLint, TypeScript, M51 static/deterministic verification, historical M20/M27 realtime checks, and the M51 deterministic execution suite before failing at the disposable database gate. The pgTAP fixture intentionally created a flexible empty-schema Board, which has no legacy system `title` column. M51 had incorrectly made inline item-title CAS dependent on that optional schema column, so `wm_set_board_cell_if_current(..., NULL, ...)` raised `P0001 Column does not belong to this board` instead of performing guarded intrinsic-title persistence.

Candidate 04 corrects the architecture rather than weakening the test. `NULL p_column_id` is now the explicit intrinsic item-title sentinel for the existing CAS RPC. Item-title persistence validates the canonical title contract, compares under the existing row lock, fails stale writes with SQLSTATE `40001`, updates only the title, and remains independent of flexible/custom-only Board schema. The client uses a dedicated internal `setItemTitle` path, while non-null column ids continue to use normal Board-column CAS. Static/deterministic M51 and retained M20/M27 realtime verification pass after this correction. Database/build/browser/release/historical/final certification remain fail-closed until Candidate 04 is rerun locally.

Candidate 04 also corrects M51 certification ordering: historical regression is no longer embedded in the pre-browser candidate gate. The finalizer now enforces candidate/static/deterministic/database/build gates -> authenticated browser/release attestation -> dedicated active-certified staging -> post-certification staged-state verification -> historical regression -> package/checksum hygiene -> final certified ZIP/PASS publication.


## Candidate 05 pgTAP fixture corrective

Candidate 04 local database execution confirmed forward progress: the intrinsic-title CAS tests no longer produced assertion failures, but the suite aborted at the non-overlapping collaborator setup because the fixture still resolved a nonexistent legacy `notes` system column and passed NULL to `wm_set_board_cell`. Candidate 05 replaces that invalid setup with a real custom text column created through the production `wm_add_board_column` RPC, persists the collaborator value through the normal cell authority, and verifies that title CAS leaves the custom value intact. The fixture's TAP plan is also corrected from 9 to the actual 10 assertions. Production CAS/RPC semantics are unchanged by this corrective. Database/build/browser/release/historical/final certification remain fail-closed until Candidate 05 completes local execution.
