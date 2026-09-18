# Release Status — Work Management App v1.43.2 — Stage G M46

**Milestone:** M46 — Boards Backend & Data Contract Recovery
**State:** implementation-complete-pending-certification
**Architecture:** 54
**Prerequisite:** M45 active-certified

## Implemented

- Governed Board backend contract manifest with 40 RPCs and nine Board tables.
- Exact contract digest/version exported to runtime and SQL capability authorities.
- Live PostgreSQL catalog attestation through `public.wm_board_contract_attestation()`.
- Board RPC security/signature/default/return verification.
- Board table column/RLS/direct-privilege verification.
- Board Storage/Reatime policy and trigger verification.
- Canonical item-workspace `author_id` / `actor_id` DTO output with temporary `created_by` read compatibility.
- Board-scoped QueryClient invalidation/removal and structural preference invalidation.
- Metadata-first attachment deletion with canonical-path best-effort object cleanup.
- Isolated M46 pgTAP database contract suite.
- Production contract verifier bound to exact contract version/digest.
- Architecture 54 contract authority registration.

## Certification state

No M46 PASS record or certified baseline is valid until all local, database, live-production, historical, build, artifact, and hosted gates complete successfully.

## Certification-host shell portability corrective — 2026-09-18

The first governed Checkpoint 16 Mac transaction passed M46 static, deterministic, workflow, and finalizer fail-closed gates, then failed closed inside the production-deployment guard before any commit/push. Root cause was macOS Bash 3.2 `set -u` behavior when expanding the helper's empty optional-password array. The helper now uses explicit password/no-password branches; the guard covers both command forms and statically rejects recurrence of the empty-array construct. M46 remains pending until the corrected transaction completes every local and hosted gate.

## Retained M38 backend-preflight regression corrective — 2026-09-18

The Checkpoint 17 governed Mac transaction passed exact publication materialization, dependency/toolchain setup, live production M46 attestation, disposable local Supabase pgTAP (14/14), and the retained M45 browser regression before failing closed in `scripts/verify-runtime-backend-preflight-execution.mjs`. The retained M38 deterministic fixture still mocked only `wm_runtime_capabilities`; M46 runtime readiness now also calls `wm_board_contract_attestation` whenever the base Boards capability set is complete. Its unhandled 404 was therefore correctly converted into `WM_BACKEND_CAPABILITY_MISMATCH` for Boards. The fixture now serves the exact governed M46 version/digest/compatibility response and adds explicit digest-mismatch and `compatible=false` vectors. Static M46 verification binds that fixture contract. This corrective changes test-fixture synchronization only; production Board behavior and the already-attested M46 database contract are unchanged. M46 remains pending until the corrected full local/hosted transaction passes.
