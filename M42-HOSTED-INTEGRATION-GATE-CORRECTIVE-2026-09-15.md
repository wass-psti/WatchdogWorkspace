# Stage G M42 — Hosted Integration Gate Corrective (2026-09-15)

## Scope

This continuation is intentionally limited to the four concrete GitHub-hosted integration defects observed on source commit `58ef7d491e7c04ee240fad795d66a1eea1e9a847`.

No Users/RBAC production business logic, Supabase RPC contract, database migration, authorization rule, M39 runtime authority behavior, or M40 route-lifecycle behavior is changed.

## Corrective changes

1. **ESLint `no-promise-executor-return`**
   - `tests/modern/e2e/helpers/m39-auth-fixture.mjs`
   - Converted `m39BoundaryDelay` to a block-bodied Promise executor so `setTimeout(...)` is not returned from the executor.
   - Timing and retry semantics are unchanged.

2. **M42 evidence-digest capture / verification**
   - `.github/workflows/users-rbac-functional-recovery.yml`
   - Removed literal escaped quote characters around `$PWD`.
   - Added `set -euo pipefail` to both evidence-digest shell blocks.
   - Source and dependency digests are computed once, validated as 64-character lowercase SHA-256 values, then exported.
   - Final verification validates captured/current digest shapes and fails closed on missing, invalid, command-failure, or drift conditions.

3. **Synthetic clean-dependency fixture isolation**
   - `scripts/verify-stage-g-m42-clean-dependency-materialization.mjs`
   - The child fixture environment now removes the owning certification transaction's evidence/preservation variables:
     - `M42_SOURCE_DIGEST`
     - `M42_DEPENDENCY_DIGEST`
     - `WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN`
     - `WM_M42_CERTIFICATION_DEPENDENCY_DIGEST`
   - Assertions verify those values cannot leak into the synthetic dependency-materialization process.
   - Production dependency-preservation behavior remains unchanged.

4. **Main CI duplicate `env` mapping**
   - `.github/workflows/ci.yml`
   - Merged the duplicate job-level `env:` mappings into one mapping while preserving:
     - `VITE_RUNTIME_ENV: ci`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_BASE_PATH`
     - `VITE_BUILD_SOURCEMAP`
   - `timeout-minutes: 35` is preserved.

## Verification completed in this continuation

Passed locally in the governed Node `v22.16.0` / npm `10.9.2` environment:

- Node syntax checks for both modified `.mjs` files.
- Strict duplicate-key YAML parsing for `ci.yml` and `users-rbac-functional-recovery.yml`.
- Targeted workflow-shape validation proving no literal `\"$PWD\"` remains.
- M42 digest shell transaction simulation:
  - valid capture: PASS
  - command failure: fails closed
  - invalid digest: fails closed
  - stable post-check: PASS
  - source drift: fails closed
  - missing captured digest: fails closed
- M39 hosted runtime-boundary deterministic regression: PASS (6 vectors).
- Clean dependency materialization under deliberately poisoned parent M42 certification environment: PASS.
- M42 static verifier: PASS (148 checks, 6 browser scenarios declared).
- M42 deterministic suite: PASS, including finalizer rollback, activation gate ownership, clean dependency materialization, governed test-toolchain preservation, certifier rollback, package hygiene, and hosted certification workflow verification.
- M39 static verifier: PASS.
- M40 static verifier: PASS.
- M41 static verifier: PASS.
- Package governance: PASS.
- Stage A M1 CI/package governance: PASS.
- High-confidence secret scan: PASS.
- Stage A M2 security baseline: PASS.
- Full `verify:ui`: PASS.

## Environment limitation observed

A clean local `npm ci --ignore-scripts --offline` cannot materialize the complete package-lock graph because the sandbox npm cache does not contain `zustand@5.0.15`. Consequently, dependency-backed local commands such as the full M39 deterministic suite, ESLint execution, typecheck, browser/E2E, database/RLS, and full historical gate cannot all be rerun in this sandbox from a clean install.

This is an execution-environment limitation, not evidence of a project regression. The immediately preceding GitHub-hosted run on commit `58ef7d491e7c04ee240fad795d66a1eea1e9a847` already proved M39 browser 6/6, M40 browser 3/3, M41 browser 5/5, M38 browser 4/4, and historical 152/152 before exposing the four defects corrected here.

## Certification state

M42 remains `implementation-complete-pending-certification`.

No M42 certified-baseline ZIP and no M42 PASS record are created by this continuation. The next required operation is a hosted GitHub run of the corrected source followed, only after all required gates pass, by the exact-revision `Stage G M42 Certified Baseline` workflow.
