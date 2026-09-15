# Stage G M42 — Hosted Evidence Stability Corrective (2026-09-15)

## Scope

This corrective addresses the only failing step in GitHub-hosted `Users RBAC Functional Recovery` run `34932421537` / job `104263242279` for source commit `c4b42ddd594bc05b6e1d3e93c01a1b31f83fcd24`.

All functional M42 gates preceding the final evidence comparison passed on that exact revision: M42 static verification, deterministic verification, 6/6 browser scenarios, the 96-test Database/RLS suite, historical verification at 152/152, TypeScript, security, and UI verification. The final step failed while comparing the originally captured certification source/dependency digests with their post-gate values.

No Users/RBAC business logic, Supabase RPC behavior, RLS policy, migration, database test, route-ownership behavior, or authentication authority is changed by this corrective.

## What the previous hosted run proves — and what it does not

The previous workflow captured:

- source digest: `852ad27d3d94cfe6bfefbce680788ba32d687a0a2cf11af1b847282c6f9c08d6`
- dependency digest: `1f2c55b567a6b0d96551eac7ad53f2160da012aa466c4c21a2ab60680e156423`

The final shell block used silent POSIX `test` comparisons under `set -e`. GitHub therefore recorded only exit code `1`; it did not print the recomputed digests or any changed paths. Retrospectively asserting which tree/path changed in that already-finished run would be unsupported.

The corrective therefore does two things: it removes a concrete, reproducible false-positive dependency-evidence domain defect, and it makes any future drift attributable to an exact gate and exact path instead of a final silent mismatch.

## Reproducible dependency-evidence domain defect

The M42 installed-dependency digest previously excluded generated `.cache`, `.vite`, and `.vitest` directories but not Vite's generated `node_modules/.vite-temp` directory.

The project uses Vite 8.2.2. Vite's default bundled config loader writes a generated config module under `node_modules/.vite-temp` and removes it with best-effort asynchronous cleanup. Vite itself classifies this path as temporary read/write output rather than installed package content.

The pre-corrective M42 helper was reproduced against a synthetic installed Vite package:

- original baseline digest: `77ed6d7b9643a859e183d2d35da8e16ed8bea339334439b8d054b63f1adbe4f2`
- original digest after adding only `node_modules/.vite-temp/vite.config.js.timestamp-1-deadbeef.mjs`: `06a27c261b463bf2bb1cec197eebf58941fa263744befe833c92bca2033c5db4f`
- corrected digest with the same generated tempfile present: `77ed6d7b9643a859e183d2d35da8e16ed8bea339334439b8d054b63f1adbe4f2`

That proves the old certification evidence domain could classify Vite runtime output as installed dependency drift. The correction does not exclude real package bytes, modes, or symlink targets.

## Corrective implementation

### 1. Normalize Vite generated config output

`scripts/lib/stage-g-m42-dependency-tree.mjs` now excludes `.vite-temp` alongside the already-governed generated cache directories:

- `.cache`
- `.vite`
- `.vite-temp`
- `.vitest`

All other installed dependency files, modes, and symlink targets remain part of the SHA-256 evidence domain.

### 2. Avoid bundled-config tempfile generation in the focused M42 browser gate

`scripts/run-users-rbac-functional-recovery-browser.mjs` starts Vite with `--configLoader native`. The M42 browser gate therefore does not need to generate a bundled `node_modules/.vite-temp` config artifact at all.

The digest normalization remains necessary because broader release/history commands may invoke Vite through other entrypoints and certification evidence must distinguish generated tool output from installed package content consistently.

### 3. Add path-level evidence snapshots and exact drift diagnostics

Both M42 evidence helpers can now emit deterministic per-path manifests containing entry type, mode, and SHA-256 fingerprints.

`scripts/assert-stage-g-m42-evidence-stability.mjs` provides:

- `capture <snapshot>` — captures source and installed-dependency evidence to a snapshot outside the certifiable project tree;
- `verify <snapshot> <phase>` — recomputes both authorities and reports the exact added, removed, or changed paths if drift occurs.

A mismatch now prints the expected/current aggregate digests plus path-level changes before failing closed.

### 4. Attribute hosted drift to the exact gate

`.github/workflows/users-rbac-functional-recovery.yml` now verifies the same captured source/dependency evidence immediately after:

1. certification preflight;
2. M42 static verification;
3. M42 deterministic verification;
4. M42 browser verification;
5. Database/RLS verification;
6. historical verification;
7. TypeScript verification;
8. security verification;
9. UI verification / final hosted integration boundary.

The snapshot lives in `$RUNNER_TEMP`, not the repository.

### 5. Attribute release-certification drift to the exact gate

`scripts/activate-stage-g-m42.mjs` now verifies source and dependency evidence immediately after every major release-certification gate and state transition. A mutation is therefore attributed to the gate that produced it rather than being discovered only at the end of the release transaction.

### 6. Deterministic regression coverage

`scripts/verify-stage-g-m42-evidence-stability.mjs` proves:

- Vite `.vite-temp` output is outside the installed-dependency evidence domain;
- existing `.vite`, `.vitest`, and `.cache` tool output remains normalized;
- actual installed package-byte mutation remains certification-visible;
- stable evidence verification succeeds;
- Vite temporary output does not produce false drift;
- a real package mutation fails closed and reports the exact changed path.

The regression is part of `users-rbac-recovery:test` and the M42 static verifier protects the complete contract.

## Local verification for this corrective

Dependency-independent verification completed successfully after implementation:

- M42 static verifier: 153/153 PASS, including the corrective-record contract.
- Users/RBAC deterministic execution vectors: 31/31 PASS.
- Finalizer rollback regression: PASS.
- Activation gate-ownership regression: PASS with phase-local source/dependency drift attribution.
- Clean dependency materialization regression: PASS.
- Governed modern test-toolchain preservation regression: PASS.
- Dedicated certifier rollback regression: PASS.
- Certified-package secret hygiene regression: PASS.
- New M42 evidence-stability regression: PASS.
- Hosted certification workflow deterministic verifier: PASS.
- Stage A security baseline: PASS.
- Full UI verifier chain: PASS.
- Historical collect-all in this dependency-less sandbox: 136/152; the same 16 dependency-resolution executions remain unavailable locally. The immediately preceding GitHub-hosted revision `c4b42ddd...` proved the complete historical suite at 152/152 before the old final digest comparison failed.
- Aggregate certification preflight: FAIL CLOSED on exactly two sandbox capabilities — npm registry DNS `EAI_AGAIN` with incomplete offline cache materialization, and no Docker-compatible runtime.
- Actual finalizer attempt: FAIL CLOSED at the same preflight boundary; the M42 target and release-status records remained byte-for-byte unchanged and no certified artifact/PASS record was produced.

## Certification state

M42 remains `implementation-complete-pending-certification`.

This corrective is not itself a certified baseline. It must be pushed as an exact repository revision and pass the automatic `Users RBAC Functional Recovery` workflow. Only after that integration workflow is fully green may `Stage G M42 Certified Baseline` be run with that exact commit SHA as `expected_commit_sha`.

No M42 certified ZIP or PASS record may be created before those hosted gates succeed.
