# M46 — Boards Backend & Data Contract Recovery

M46 restores one explicit, verifiable contract between the Boards frontend and the deployed Supabase/PostgreSQL backend. It does not expand Board UX scope; later milestones own table/cell, Kanban, item-workspace UX, realtime/collaboration, formulas, and final production-readiness certification.

## Contract authority

- Contract manifest: `config/stage-g-m46-board-backend-contract.ts`
- Milestone target: `config/stage-g-m46-boards-backend-data-contract-recovery-target.ts`
- Forward migration: `supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql`
- Production deployment copy: `supabase/deployments/m46/20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql`
- Authoritative schema snapshot: `supabase/schema.sql`
- Board repository: `assets/js/features/boards/data/board-repository.ts`
- DTO boundary: `assets/js/features/boards/data/board-contracts.ts`
- Backend preflight: `assets/js/platform/data/backend-capability-preflight.ts`
- Local database contract test: `supabase/tests/m46/boards_backend_contract_recovery.test.sql`
- Live production verifier: `scripts/verify-stage-g-m46-production-contract.mjs`

## Recovery requirements

The governed M46 contract contains 40 Board RPC signatures and nine Board table contracts. The live catalog attestation verifies exact input argument names/types/default counts, return contracts, SECURITY DEFINER authority, pinned `search_path=public`, authenticated execution and anon denial for governed Board RPCs. It also validates Board table columns/nullability, RLS enablement, direct privilege denial, the private Board Storage bucket/policies, Realtime policies/triggers, capability version/digest, and the canonical item-workspace identity payload.

Frontend recovery additionally requires Board-scoped QueryClient invalidation/removal, preferences invalidation on structural mutations, fail-closed required DTO labels, canonical `author_id`/`actor_id`, and metadata-authoritative attachment deletion before best-effort Storage cleanup.

## Certification boundary

M46 can become `active-certified` only when the exact source commit passes static, deterministic, browser, local pgTAP/Supabase, live production catalog attestation, TypeScript/security/UI, staged post-state historical verification, production build, artifact integrity, and hosted independent artifact verification. The source milestone state remains pending during certification; only the isolated certified package is promoted.

The `created_by` DTO alias is a temporary read-only compatibility boundary for pre-M46 item-workspace update/file payloads. Canonical M46 SQL emits `author_id`; activity emits `actor_id`.

## Certification transaction

M46 uses the established exact-commit fail-closed certification pattern. The pending repository source is hashed, all contract/browser/local-database/live-production gates execute without state mutation, an exact Git commit is staged, only the staged target/status records are promoted, and the active candidate then passes historical verification and production build before packaging. The resulting ZIP and PASS record are independently reverified against the pending source-tree digest and exact source commit.

Production migration is intentionally separate from certification. `npm run board-backend-contract:deploy:production` requires `WM_M46_ALLOW_PRODUCTION_MIGRATION=1`, a project ref matching `VITE_SUPABASE_URL`, Supabase access/database credentials, Supabase CLI 2.117.0, byte-identical migration/deployment SQL, and a successful remote dry-run before applying the isolated timestamped migration. It immediately runs the live contract attestation after deployment. Certification itself never attempts an implicit database mutation.

## Live production recovery evidence — 2026-09-17

The M46 production recovery was executed against Supabase project `WatchdogWorkspace` (`jtlusodorfnyzgyuewkz`). Before recovery, the deployed catalog had all 40 governed Board RPC signatures and all nine Board tables, but `wm_board_backend_capabilities()` still reported schema version `1.34.0`; `wm_board_contract_attestation()` was absent; and the private Board Realtime authority (two helper functions, two `realtime.messages` authorization policies, and eight Board change triggers) was absent.

The isolated forward migration `stage_g_m46_boards_backend_data_contract_recovery` was applied successfully and is recorded in the production Supabase migration ledger as version `20260917142647`. No historical migration replay was performed.

Post-migration live attestation returned the exact M46 contract version `1.43.2-m46-v1`, canonical contract digest `2e5db3073f702cad96be3eb1d4a18b33ea039252ad4d0532dc9b6e1b3ca0da1c`, and `compatible=true`, with 40/40 RPCs, 9/9 tables, 9/9 RLS-enabled Board tables, zero Board-table direct RLS policies, zero direct anon/authenticated Board CRUD privilege violations, 3/3 Storage policies, 2/2 Realtime helper functions, 2/2 Realtime authorization policies, and 8/8 Realtime triggers.

Supabase security/performance advisors were run after the DDL. The Board-table `rls_enabled_no_policy` INFO findings describe the intentional RPC-only deny-by-default architecture: direct Board-table CRUD grants are absent and all governed application access remains through authenticated RPCs. The advisor also reports `wm_board_contract_attestation()` as an anonymous-executable SECURITY DEFINER RPC. This is intentional for the non-data-bearing production certification endpoint used by hosted verification; its result contains only aggregate contract/version/count compatibility metadata and no tenant or row data. Runtime Boards readiness still invokes the same attestation after an authenticated access token is established. Other reported advisor findings pre-date M46 and are outside this milestone's Board contract recovery scope.

M46 remains `implementation-complete-pending-certification` until dependency-backed browser/type/build, isolated local PostgreSQL/pgTAP, historical regressions, exact-commit certification, hosted certification, artifact verification, and package/promotion gates all pass.

## Certification package whitespace corrective — 2026-09-17

The Checkpoint 10 pre-publication hygiene gate identified three Markdown hard-break lines in the M46 release-status header with trailing spaces. The release record now uses whitespace-clean lines so the mandatory `git diff --check` publication gate can pass. This corrective changes documentation/package hygiene only; it does not change Boards runtime behavior, the canonical backend contract, the production migration, or the live-attested schema.

## Hosted public-runtime configuration fallback corrective — 2026-09-17

The M46 hosted certification workflow now keeps repository variables as the preferred production runtime configuration while providing governed fallbacks for the already-public Supabase URL and publishable key bound to the certified Board contract. This removes an external repository-variable availability ambiguity without introducing or embedding any secret credential. The fallback values are the same public runtime values used by the application and local M46 certification wrapper.

## Hosted certifier self-test corrective — 2026-09-17

The M46 hosted workflow now executes the finalizer fail-closed regression and production-deployment guard regression immediately after dependency/toolchain materialization and before milestone-state resolution. This aligns hosted pending certification with the local atomic transaction and prevents an independently pushed pending commit from reaching the certifier without first proving its rollback/source-drift and deployment-guard behavior.

## pgTAP evidence-count synchronization corrective — 2026-09-17

The disposable M46 database runner now reports `pgTAP=14`, matching the authoritative `plan(14)` suite. Static verification binds the runner evidence count to 14 so the certification log cannot silently under-report the executed database contract assertions. This is an evidence-integrity correction; test semantics and production schema are unchanged.

## macOS Bash 3.2 production-deployment guard corrective — 2026-09-18

The governed Mac certification run exposed a shell-portability defect before publication: the production deployment helper represented the optional database password as an empty Bash array and expanded it under `set -u`. macOS Bash 3.2 can treat that empty-array expansion as an unbound variable, so the helper stopped immediately after `supabase projects list` and never reached project linking or migration dry-run. M46 now uses explicit password/no-password Supabase command branches, and the deployment-guard verifier exercises both branches while statically forbidding the empty-array pattern. No production DDL or application runtime behavior is changed by this corrective.

## Retained M38 preflight-fixture synchronization corrective — 2026-09-18

The Checkpoint 17 governed Mac transaction passed exact publication materialization, dependency/toolchain setup, live production M46 attestation, disposable local Supabase pgTAP (14/14), and the retained M45 browser regression before failing closed in `scripts/verify-runtime-backend-preflight-execution.mjs`. The retained M38 deterministic fixture still mocked only `wm_runtime_capabilities`; M46 runtime readiness now also calls `wm_board_contract_attestation` whenever the base Boards capability set is complete. Its unhandled 404 was therefore correctly converted into `WM_BACKEND_CAPABILITY_MISMATCH` for Boards. The fixture now serves the exact governed M46 version/digest/compatibility response and adds explicit digest-mismatch and `compatible=false` vectors. Static M46 verification binds that fixture contract. This corrective changes test-fixture synchronization only; production Board behavior and the already-attested M46 database contract are unchanged. M46 remains pending until the corrected full local/hosted transaction passes.
