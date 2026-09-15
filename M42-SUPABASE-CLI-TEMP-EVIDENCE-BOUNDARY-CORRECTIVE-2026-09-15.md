# Stage G M42 — Supabase CLI Temporary Evidence-Boundary Corrective (2026-09-15)

## Hosted evidence that triggered this corrective

GitHub-hosted `Users RBAC Functional Recovery` run `34941635390`, job `104291433377`, on commit `aba7d0462eaf90734034036a6f40f95147cf25a8` passed M42 preflight, static verification, deterministic verification, all 6 browser scenarios, and all 96 Database/RLS tests. The immediately following evidence-stability check failed closed and identified one source-manifest addition:

`supabase/.temp/cli-latest`

The captured source digest was `7bfd34896446cc11af8de09d414cb9e05b9fbff782c49be1492b76aeb4e32b85`; after the Database/RLS gate it became `de8457c3106e3e58977769e1063b96e00a3302ab33d3530f681fdfd49c25565a`. No other source-manifest path changed. The Database/RLS suite itself completed successfully (`Files=5`, `Tests=96`, `Result: PASS`).

## Root cause

The disposable local Supabase CLI invocation writes generated runtime metadata beneath `supabase/.temp`. The M42 source-certification tree previously treated that generated directory as certifiable application source. That caused a false source-drift failure after a successful Database/RLS run.

This is a certification evidence-domain defect, not a Users/RBAC, SQL, RPC, RLS, browser, or authentication defect.

## Corrective implementation

1. `scripts/lib/stage-g-m42-certification-tree.mjs` excludes only the exact relative directory `supabase/.temp` from M42 source evidence. The exclusion is relative-path scoped rather than a global `.temp` basename exclusion, so unrelated `.temp` directories remain certification-visible.
2. `.gitignore` now ignores `supabase/.temp/` so Supabase CLI runtime metadata is not accidentally committed.
3. `scripts/verify-stage-g-m42-evidence-stability.mjs` proves that:
   - creating or changing `supabase/.temp/cli-latest` does not change the M42 source digest;
   - an unrelated `.temp` directory outside `supabase/.temp` remains certification-visible, proving the exclusion is not global;
   - changing real `supabase/schema.sql` bytes does change the source digest;
   - changing ordinary application source bytes does change the source digest;
   - existing dependency-evidence protections remain fail closed.
4. `verify-stage-g-m42-users-rbac-functional-recovery.mjs` protects the narrow relative-directory exclusion, the regression contract, the Git ignore rule, and this corrective record.

## Security and fail-closed properties preserved

The corrective does not exclude the `supabase` tree generally. Migrations, schema, functions, SQL tests, configuration, and any other real project source under `supabase/` remain hashed. Only Supabase CLI-generated `supabase/.temp` runtime metadata is outside the certifiable source domain. Real application and installed-dependency mutations continue to invalidate certification evidence.

## Certification state

M42 remains `implementation-complete-pending-certification`. This corrective candidate must pass the complete GitHub-hosted automatic `Users RBAC Functional Recovery` workflow. Only after that workflow is fully green may the manual `Stage G M42 Certified Baseline` workflow be run against the exact same commit SHA. No certified ZIP or PASS record is authorized before all required hosted gates pass.

## Local verification after implementation

- M42 static verifier: **155/155 PASS**.
- Users/RBAC deterministic execution vectors: **31/31 PASS**.
- Finalizer rollback, activation gate ownership, clean dependency materialization, governed test-toolchain preservation, dedicated certifier rollback, package hygiene, evidence stability, and hosted certification workflow regressions: **PASS**.
- Actual project source digest with and without `supabase/.temp/cli-latest`: **identical**, confirming the hosted-generated path is normalized.
- Stage A security baseline: **PASS**.
- Full UI verifier chain: **PASS**.
- Historical collect-all: **136/152** in this dependency-less sandbox; all 16 failures are package-resolution failures caused by unavailable local dependencies.
- Aggregate preflight/finalizer: **FAIL CLOSED on exactly two sandbox capabilities** — registry DNS/offline cache materialization and Docker. The M42 activation target and release-status hashes remained unchanged, and no certified ZIP or PASS record was created.

The candidate therefore requires only hosted revalidation of the complete automatic M42 workflow before the exact-revision manual certified-baseline workflow may be run.
