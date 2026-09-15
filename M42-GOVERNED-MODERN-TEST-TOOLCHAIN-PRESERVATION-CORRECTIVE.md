# M42 Governed Modern Test-Toolchain Preservation Corrective

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery
Status: implemented and locally verified; milestone remains implementation-complete-pending-certification

## Problem isolated

The prior installed-dependency content binding captured `node_modules` immediately after the clean application `npm ci`. M42 browser verification and several nested release gates then executed `scripts/ensure-modern-test-toolchain.mjs`, which installs the exact Vitest / Testing Library / Playwright / jsdom toolchain with `npm install --no-save --package-lock=false` because those packages intentionally are not part of the application package lock.

That created a deterministic success-path contradiction:

1. clean `npm ci` produced the exact application lockfile tree;
2. M42 captured the dependency-content digest;
3. the browser gate installed the governed no-save test toolchain into the same root `node_modules`;
4. the dependency digest necessarily changed;
5. later `dependencies:ensure` calls could also classify the governed test packages as extraneous and clean them away.

Therefore a healthy environment could pass the real browser work yet still fail M42's dependency-integrity check solely because the certification harness changed its own governed tooling.

## Corrective architecture

M42 now treats the modern testing packages as a governed **certification extension** layered on top of the application lockfile tree:

- `scripts/lib/modern-test-toolchain.mjs` is the shared exact-version authority for Vitest 5.0.0, coverage-v8 5.0.0, Testing Library packages, Playwright 1.63.0, jsdom 27.4.0, and the required jsdom Node engine contract.
- Release activation performs clean `dependencies:certify`, then `modern-tests:toolchain:ensure`, then `users-rbac-recovery:dependencies:check`.
- The certification dependency check requires every applicable package-lock package to retain its exact version while explicitly allowing the no-save toolchain closure, and separately verifies every governed top-level test-tool version.
- Only after those checks pass does M42 capture the full installed-dependency content digest.
- Nested `dependencies:ensure` calls may preserve the toolchain extension only when both `WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN=1` and the owning transaction's `WM_M42_CERTIFICATION_DEPENDENCY_DIGEST` are present and match the current full dependency tree. Drift fails closed; the dependency helper refuses to clean or repair a captured certification tree.
- The dependency digest still covers the complete installed tree, including the governed toolchain and its transitive files, excluding only generated cache directories already declared by the M42 dependency-content policy.

## Fail-fast environment parity

`scripts/lib/npm-offline-m42-certification-probe.mjs` now reproduces the actual certification dependency path in a disposable directory:

1. application `npm ci --offline --ignore-scripts`;
2. exact governed modern test-toolchain `npm install --no-save --package-lock=false --offline --ignore-scripts`;
3. application lockfile-tree verification with governed extras allowed;
4. exact modern test-toolchain verification.

The aggregate M42 preflight therefore cannot claim an offline-ready environment merely because the application package-lock graph is cached while the browser/test toolchain tarballs are unavailable.

## CI parity

`.github/workflows/users-rbac-functional-recovery.yml` now materializes and verifies the governed test-toolchain extension before capturing the dependency digest, then exports the preservation flag and exact captured dependency digest for all subsequent M42 evidence gates.

## Deterministic regression coverage

`scripts/verify-stage-g-m42-governed-toolchain-preservation.mjs` proves:

- default lockfile verification still rejects extraneous packages;
- certification-mode lockfile verification permits the governed extension while retaining exact application lockfile checks;
- every governed top-level test-tool version and jsdom engine contract is verified;
- dependency preservation succeeds only against the captured combined digest;
- the preservation path does not clean the governed toolchain extension;
- release activation materializes the toolchain before dependency evidence capture;
- CI captures dependency evidence only after toolchain materialization and carries the digest-bound preservation authority.

The M30 historical verifier was synchronized to the shared modern-test-toolchain authority rather than requiring the pins to remain duplicated inline in `ensure-modern-test-toolchain.mjs`.

## Current verification

- M42 static verification: 135/135 PASS before the final corrective-record assertion.
- Users/RBAC deterministic vectors: 31/31 PASS.
- M42 activation/finalizer/certifier/package regressions: PASS.
- Governed modern test-toolchain preservation regression: PASS.
- Security baseline: PASS.
- Full UI verification: PASS.
- Historical collect-all: 136/152 PASS; the same 16 executions remain blocked only by unavailable application dependencies, with no new assertion regression.
- Real M42 preflight: FAIL CLOSED with exactly two external blockers — npm registry DNS `EAI_AGAIN` with an incomplete offline certification dependency cache, and no Docker-compatible runtime for the disposable Supabase pgTAP gate.

No certified baseline or PASS record is authorized until those external prerequisites are available and the complete fail-closed certification/finalization transaction succeeds.

## 2026-09-15 hosted deterministic-materialization supersession

The 2026-09-14 preservation model correctly bound the combined installed tree after test-tool bootstrap, but GitHub-hosted execution proved the root-level unlocked bootstrap could first replace lockfile-governed transitive packages. The preservation model remains valid after capture; the materialization step has now been corrected to use the isolated `node_modules/.wm-modern-test-toolchain` workspace with managed package/binary bridges. See `M42-DETERMINISTIC-DEPENDENCY-MATERIALIZATION-CORRECTIVE.md`.

## 2026-09-15 hosted evidence-stability refinement

The isolated governed test-toolchain topology remains unchanged and continues to be part of installed dependency evidence. The hosted integration run on `c4b42ddd594bc05b6e1d3e93c01a1b31f83fcd24` proved toolchain materialization, dependency checks, browser execution, Database/RLS, and historical verification all pass before the old final digest comparison.

The remaining evidence-boundary corrective does not weaken the governed toolchain digest. It excludes only Vite's generated `node_modules/.vite-temp` config-output directory, adds path-level evidence diagnostics, and checks the captured evidence after each hosted/release gate. Real packages inside `.wm-modern-test-toolchain`, their transitive files, and managed bridges remain certification-visible. See `M42-HOSTED-EVIDENCE-STABILITY-CORRECTIVE-2026-09-15.md`.
