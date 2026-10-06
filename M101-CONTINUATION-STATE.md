# M101 Continuation State

Authoritative state after Corrective Loop 1 repository repair: IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS.

## Corrective Loop 1
- Origin: first local M101 certification attempt.
- Failed gate: `boards-import-preview:database` / M101 pgTAP atomic-import suite.
- Observed failure: pgTAP switched to the `authenticated` role and then directly selected `public.work_boards.updated_at`; the hardened Boards schema intentionally does not grant direct table SELECT authority to `authenticated`, so the test aborted before assertion 1 with SQLSTATE 42501 / permission denied.
- Root-cause classification: test/certification fixture defect. No production RPC or RLS defect was established.
- Corrective delta: the pgTAP fixture now captures the board version while running under the database-owner test context and carries it through the already-authorized temporary fixture table. Authenticated test calls consume only temporary fixture state and the public RPC.
- Security invariant preserved: no direct SELECT/INSERT/UPDATE/DELETE grant was added to `public.work_boards`; the RPC-only sensitive mutation boundary remains intact.
- Static successor guard: PASS.
- Dedicated M101 verifier: PASS.

M101 must not become canonical until `scripts/certify-stage-i-m101-local.sh` completes successfully on this exact corrective candidate and emits its certified ZIP, checksum, and PASS record.

## Corrective Loop 2 status

- Origin: M101 Corrective Candidate v2 local database certification.
- Failed gate: `boards-import-preview:database` / M101 pgTAP suite.
- Observed: 3 of 11 planned assertions executed before `permission denied for table m101_version`.
- Expected: all 11 pgTAP assertions execute under the intended authority model.
- Root cause: test fixture authority defect; the separate `m101_version` temp table was not granted to `authenticated`.
- Correction: remove `m101_version`; persist the stale-version snapshot in the already-authorized `m101_ids` fixture table.
- Production privilege/RPC changes: none.
- Authoritative state: IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS.
- Exit criterion: corrected database suite passes all planned assertions and every downstream fail-closed certification gate passes on this exact repository state.

## Corrective Loop 3 — Historical Successor Governance and Capability Registration

**Origin:** M101 Corrective Candidate v3 local certification.

**Observed failure:** The M101 database corrective gate passed 11/11 pgTAP assertions and the certification chain advanced through build, automated tests, browser/E2E, dedicated certification, and post-certification validation. `verify:historical-all` then reported 220 verifiers with 217 PASS and three failures: M38 runtime backend preflight did not recognize `wm_import_board_items_atomic` in the backend capability manifest; M46 treated the M101 import RPC as neither a certified predecessor RPC nor a governed successor RPC; and M51 still required the consolidated Supabase schema to end at the M51 migration.

**Root-cause classification:** one successor-integration implementation omission (runtime capability manifest) plus two historical-verifier successor-governance defects.

**Corrective delta:**
- Registered `wm_import_board_items_atomic` in `config/backend-capability-manifest.ts`.
- Updated the M46 historical verifier to authorize that RPC only as an M101 successor and only when defined and granted by the M101 migration.
- Updated the M51 historical verifier to require the authoritative M51 migration to remain embedded before the M101 migration and require the consolidated schema to end with the governed M101 successor migration.
- Extended the M101 source guard and dedicated verifier to bind these successor-integration changes.

**New evidence:** M101 source guard PASS (baseline files=2546; allowed mutations=16; allowed new files=13); M101 dedicated verifier PASS; M38 runtime configuration/backend preflight PASS with boardRpcs=41; M46 static verification PASS; M51 execution/static verification PASS; M98 deterministic production-readiness chain PASS.

**Current state:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS. The full historical aggregate must be rerun in the dependency-complete local certification environment because the current sandbox lacks the complete application dependency tree.

