# M51 Continuation State — Boards Realtime & Concurrency Stabilization

Date: 2026-09-23
Canonical predecessor: Work-Management-App-v1.43.2-Stage-G-M51-Continuation-Candidate-05-2026-09-23
State: IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS
Overall scope completion: 97%

## Implemented and verified in the current environment

- Candidate 02's seven ESLint `no-promise-executor-return` defects remain corrected.
- Candidate 03 local verification proved exact dependency restoration, lockfile verification, ESLint, TypeScript, M51 static verification, historical M20/M27 realtime verification, and M51 deterministic execution PASS before the database gate.
- Candidate 03 database execution exposed a real flexible-board concurrency defect: modern Boards may intentionally contain no system `title` column, while the M51 inline-title CAS path had become dependent on such a column.
- Candidate 04 corrects that root cause by defining `NULL p_column_id` on `wm_set_board_cell_if_current` as the intrinsic item-title CAS authority. This preserves schema-column CAS for actual Board columns while allowing item-title conflict detection on empty/custom-only Board schemas.
- Inline item-title editing now uses a dedicated internal `setItemTitle` command/repository path and no longer aborts when a Board lacks a legacy system title column.
- Intrinsic title CAS validates 1–240 characters, holds the item row lock, compares the authoritative title to the expected title, raises SQLSTATE `40001` on stale writes, updates only the item title, updates Board timestamps, and records Board activity.
- The M51 pgTAP fixture intentionally creates a flexible empty-schema Board and therefore now directly covers the no-system-title-column production case that failed in Candidate 03.
- The consolidated `supabase/schema.sql` ends with the corrected authoritative M51 migration.
- M51 static/deterministic verification passes after the Candidate 04 correction.
- Historical M20 Board collaborative realtime execution vectors pass after the Candidate 04 correction.
- Historical M27 shared realtime-platform execution vectors pass after the Candidate 04 correction.

## Implemented but not yet locally verified

- Candidate 04 ESLint and TypeScript must be rerun locally because this checkpoint changes TypeScript contracts/runtime code after Candidate 03's local static PASS.
- Candidate 05 M51 disposable Supabase/pgTAP suite must be rerun locally to prove all 10 assertions against the corrected intrinsic-title CAS and non-overlapping custom-cell contract.
- Candidate 04 build/dist/preview gates remain to be rerun locally.
- Authenticated two-session browser/E2E against a production-equivalent Supabase project remains required.
- Final M51 release certification and certified artifact production remain fail-closed until every prerequisite succeeds.

## Remaining implementation

None currently identified after the Candidate 04 intrinsic-title CAS correction. Any later source/configuration/schema change is contingent on a remaining verification gate exposing a new defect.

## Remaining verification/certification

1. Exact dependency restoration and governed dependency validation.
2. ESLint and TypeScript.
3. M51 static/deterministic tests plus retained M20/M27 realtime checks.
4. M51 disposable Supabase/pgTAP concurrency suite; all 10 tests must run and pass.
5. Build, dist, and preview verification.
6. Authenticated two-session browser/E2E covering Presence, Broadcast, token refresh, reconnect/catch-up, active-edit deferral, same-field conflict rejection, non-overlapping merge, flexible-board title editing, and fallback recovery.
7. Dedicated M51 candidate/release certification and post-certification state check.
8. Complete historical regression gate.
9. Package-hygiene/checksum verification.
10. Final certified checkpoint validation and PASS record.

## Active defects or regressions

No active source defect is currently reproduced after the Candidate 05 fixture correction. Candidate 04 local execution showed that the intrinsic-title CAS assertions no longer fail, but the suite then aborted at its non-overlapping collaborator setup because it still attempted to use a nonexistent legacy `notes` system column. Candidate 05 corrects that fixture defect by creating a real custom text column and corrects the TAP plan from 9 to the actual 10 assertions. The corrected database gate has not yet been rerun locally and therefore is not claimed PASS.

## Blockers / external dependencies

- The current implementation container cannot complete exact dependency restoration because its npm cache is incomplete and registry retrieval times out.
- Docker, Supabase CLI, and psql are unavailable in the current implementation container, so Candidate 04 database verification cannot be executed here.
- No production-equivalent Supabase project credentials/test identities are available here for the mandatory authenticated two-session live test.

## Temporary compatibility / transitional architecture

- Canonical Board state remains RPC/RLS owned; Realtime carries collaboration/invalidation signals only.
- The M27 platform remains the sole shared realtime token/channel lifecycle authority.
- `wm_set_board_cell_if_current` retains its existing signature. A null column id is now an explicit intrinsic-title sentinel; non-null ids continue to identify actual Board schema columns.
- The legacy `wm_update_board_item` RPC remains available for compatible create/general command paths, while identified existing-item interactive M51 edit paths use scoped CAS persistence.

## Technical debt / production-readiness risk

- Production-equivalent two-session verification remains the principal external production-readiness gate.
- Candidate 05's corrected 10-assertion SQL fixture still requires actual disposable-database execution before certification.
- Historical milestone finalizers may retain Git-bound assumptions; M51's own certification tree/finalizer remains reconstructible from a continuation ZIP.

## Loop / regression telemetry

Corrective loop: YES — database-fixture corrective loop, implementation correction completed and awaiting local verification.

- Originating checkpoint: Candidate 04 M51 database concurrency gate.
- Failed condition: Candidate 04 successfully moved past the intrinsic-title CAS assertions, then the pgTAP fixture called legacy `wm_set_board_cell` with a `notes_col` lookup that resolves to NULL on a valid flexible Board with no legacy system columns. PostgreSQL raised `P0001 Column does not belong to this board`, aborting the suite after four completed assertions.
- Secondary fixture defect: the file declared `plan(9)` while containing 10 pgTAP assertions, so even without the setup abort the plan was inconsistent.
- Classification: implementation-related, isolated to the M51 database verification fixture/certification layer.
- Corrective change: Candidate 05 creates a real custom text column through `wm_add_board_column`, uses that column for the collaborator non-overlapping mutation, verifies its value through `work_board_item_values`, removes dependency on a legacy notes system column, and changes the TAP plan to 10. Production RPC semantics are not weakened.
- Evidence of forward progress: Candidate 05 M51 static/deterministic verification plus retained M20/M27 realtime execution vectors pass in the current environment, and the static verifier now asserts the 10-test plan and real custom-column fixture contract.
- Remaining exit condition: Candidate 05 must pass local ESLint/typecheck, all 10 database assertions, build/dist/preview, authenticated two-session browser verification, certification/state check, historical regression, package hygiene, and final checkpoint validation.

## Continuation signal

IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS

## Candidate 04 certification-order correction

M51 certification governance now matches the mandated fail-closed order. Candidate verification stops after environment/dependency/static/deterministic/database/build/dist/preview gates. The release gate then requires the authenticated two-session production-equivalent attestation. The finalizer stages the dedicated active-certified state, verifies that staged state, runs the historical regression gate only afterward, then performs secret/symlink/environment/checksum hygiene before producing the certified ZIP and PASS record. No PASS artifact can be published if any earlier gate fails.

## Candidate 05 database-fixture corrective

Candidate 04 local execution demonstrated that the intrinsic-title CAS correction was effective: the first four pgTAP assertions completed without assertion failures. Execution then aborted at the non-overlapping collaborator setup because the fixture still looked up a legacy `notes` system column on a flexible Board and passed NULL to `wm_set_board_cell`. Candidate 05 fixes the fixture by creating a real custom text column with `wm_add_board_column`, writing the collaborator value through that valid column, and asserting preservation via `work_board_item_values`. It also corrects the TAP plan from 9 to the actual 10 assertions. The M51 static verifier now fails if the fixture regresses to `notes_col`, loses the real custom-column setup, or changes away from the complete ten-assertion plan.


## Candidate 06 historical-integration corrective

Candidate 05 local certification cleared the authenticated two-session browser gate, M51 candidate/release gates, post-certification staged-state check, 10/10 database concurrency suite, build/dist/preview, and all M51/M20/M27 static/deterministic checks. The historical regression gate then identified six successor-integration failures. Candidate 06 resolves all six without weakening predecessor guarantees:

- M38 backend capability coverage now includes `wm_set_board_cell_if_current` so runtime preflight recognizes the M51 CAS RPC.
- The M46 historical contract remains the immutable certified 40-RPC predecessor contract; its verifier now permits only the explicitly governed M51 successor RPC and proves that successor is migration-defined and authenticated-executable.
- The M47 item-edit flow now uses intrinsic title CAS and tracks already-applied field edits so a later failure triggers reverse CAS compensation before authoritative reload. This closes the partial-edit window exposed by the historical verifier.
- The M50 schema verifier no longer incorrectly requires M50 to be the final schema tail; it proves the exact M50 migration remains present and ordered before the governed M51 successor migration.
- The v1.31 interaction verifier now recognizes the same optimistic-local-update + rollback behavior when persistence is guarded by CAS `expectedValue`.
- The v1.32 Board-overhaul verifier now recognizes metadata persistence through the governed `createItem` command boundary rather than requiring the controller to call the legacy `updateItem` command directly.

All six formerly failing verifiers pass individually after these changes. A complete 167-verifier sweep in the implementation container advances past those six; the only remaining failures there are environment dependency-materialization errors because exact `node_modules` restoration times out in this container. Candidate 06 therefore requires one local rerun of the full fail-closed chain on the already proven macOS/Docker/Supabase environment before M51 can be declared fully complete.
