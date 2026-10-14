# M144.6 — Hosted staging readiness, migration parity and security acceptance preparation

**State:** CONTINUE — IMPLEMENTATION REQUIRED. **Release:** NOT CERTIFIED.

## What this candidate implements

Only four governance additions over the SHA-256-pinned M144.5 full-source package. There are **no changes to existing source, application components, authentication, backend migrations, deployment workflows or live databases**. It adds a current-source manifest verifier, source-derived offline migration/RPC readiness report, a non-mutating PostgreSQL catalog query template, and this implementation boundary.

### Predecessor integrity

- M144.5 source ZIP: SHA-256 `815457a5872ed86ae4280b73f5a2fd098ef95229aee9fdfcc92be3dfc1497a9d` (2,815 members).
- M144.5 full-source companion JSON: `c119c9551c7e13d9353f5591174e0622e80c0ee53a2e37092e4181ee39fb8a09`.
- M143 RPC SQL: `b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc` (unchanged; only `supabase/m143/` draft).
- Preserve the embedded historical checksum file; the external manifest describes the complete current successor.

## Offline staging-readiness gate

`scripts/m1446_staging_readiness.py --source-root <exactly-verified-unpacked-tree> --output-dir <NEW-folder>` produces JSON, Markdown, and a checksum record, using only Python's standard library. It verifies the draft's SHA-256, explicit actor and Board authorization checks, the nine `PT409` paths, `SECURITY DEFINER` and fixed `search_path`, ACL statements, all 57 migration SQL files, and the absence of the M143 RPC from automatic migrations. File appearances are **source references, not evidence of deployed definitions or effective security**.

## Hosted staging — NOT PERFORMED or preauthorized

`supabase/m1446/staging_catalog_READ_ONLY.sql` is a **template** to inspect a specifically authorized *nonproduction* PostgreSQL instance later. It starts an explicit `BEGIN TRANSACTION READ ONLY`, uses catalog metadata only, and commits; no fixtures or writes. It does **not** connect by itself. This candidate includes no connection string, credentials, DB target, automated network request, `supabase db push`, migration application, or rollback against a hosted project. No human should run it against production.

Before any actual hosted staging connection, identify the approved dedicated nonproduction project, obtain read-only access and written authorization, establish migration ledger/version parity, schema/function ownership, grants, and RLS policies. Preserve a reviewed rollback plan that does not remove actively used APIs or delete data. The read-only query cannot prove end-to-end authorization; separately validate editor/viewer/outsider/unauthenticated roles, real GoTrue login/refresh, tampered/expired tokens, transactional Add/Skip/Update, HTTP 409 conflicts, audit trail, race conditions, rollback and cross-module regressions.

Migration names in the source include both timestamp-prefixed and historical `v*` SQL files. **Their presence does not establish deployed order or parity**. Do not auto-convert legacy file names or guess which migrations the hosted project has applied. Compare to an independently authenticated staging migration ledger before authoring an install migration.

## Gate boundaries

- Static source parity and staging-plan generation: executable offline.
- M144.5 isolated local PostgreSQL/Auth/Playwright build QA: separately reported PASSED on user Mac, not rerun by this checkpoint; the precedent is not hosted proof.
- Staging migration ledger, owners/roles/RLS, runtime security, migration installation/rollback, real hosted Auth and HTTP acceptance: **PENDING**.
- Production migration, GitHub/Pages deployment and release certification: **NOT AUTHORIZED / WITHHELD**.

Do not issue an M144.6 release PASS or new production migration merely because the offline readiness gate passes. This ZIP is an implementation-continuation candidate only, and preserves its M144.5 predecessor.
