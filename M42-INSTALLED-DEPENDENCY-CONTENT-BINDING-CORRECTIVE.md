# M42 Installed Dependency Content Binding Corrective

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery

## Problem

The lockfile-wide dependency verifier correctly enforced package-lock structure, installed package versions, platform applicability, required binaries, and extraneous-package rejection. It did not, however, prove the byte content of already-installed packages. Because `node_modules` is intentionally excluded from the source-tree certification digest, a modified installed package could preserve its `package.json` version and still influence browser/database/release evidence.

The certification environment preflight also only proved cache/registry restoration capability when the installed dependency metadata tree was incomplete. After M42 release certification began requiring a clean install, that could make preflight report an environment as dependency-ready even though a clean `npm ci` could not actually be materialized.

## Corrective

M42 release certification now:

1. Executes `dependencies:certify`, a governed `--force-clean` dependency path that always performs a real `npm ci --ignore-scripts`, even if installed package versions already match `package-lock.json`.
2. Prefers a disposable verified offline materialization only when the local npm cache can really reconstruct the complete lockfile; otherwise it requires registry resolution.
3. Computes a deterministic SHA-256 over installed dependency bytes, modes, and symlink targets immediately after the clean install. Only generated tool cache directories (`.cache`, `.vite`, `.vitest`) are excluded.
4. Requires that installed-dependency digest to remain unchanged after the browser/Database-RLS pre-activation evidence gates, through activation transitions, and after historical/full-release verification.
5. Fails closed and restores both M42 authority records if installed dependency bytes drift.
6. Makes aggregate certification preflight prove a clean dependency materialization path regardless of whether the current installed metadata tree is already exact.

## Deterministic evidence

- Activation gate-ownership regression now mutates an installed dependency during the pre-activation Database/RLS sequence and during post-activation historical verification; both cases fail closed and restore both authority records.
- A dedicated clean-dependency-materialization regression proves ordinary dependency ensure may reuse an exact metadata tree, while M42 release certification always executes a clean npm materialization.
- M42 static verification asserts the governed clean-install scripts, dependency-content digest helper, drift assertions, preflight parity, and deterministic regressions remain present.

## Current certification status

This corrective does not waive any external gate. In the current sandbox, clean dependency materialization still fails because the npm cache cannot reconstruct the lockfile and registry DNS returns `EAI_AGAIN`. The disposable Supabase pgTAP gate also remains unavailable because no Docker-compatible runtime exists. M42 therefore remains `implementation-complete-pending-certification` and no certified baseline/PASS record may be created.

## CI evidence parity

The M42 GitHub workflow now installs dependencies with the same `--ignore-scripts` policy, captures the M42 source-tree and installed-dependency content digests immediately after installation, runs the non-mutating certification evidence gates, and verifies both digests remain unchanged afterward. CI therefore enforces the same stale-evidence boundary as local release certification without mutating milestone activation state.

## 2026-09-15 generated-tool-output boundary refinement

Hosted integration revision `c4b42ddd594bc05b6e1d3e93c01a1b31f83fcd24` passed every functional gate but failed the old final evidence-digest comparison. The old workflow did not emit the recomputed values or paths, so the exact historical mismatch cannot be recovered from that log.

A reproducible evidence-domain defect was found in the installed dependency authority: Vite 8.2.2's default bundled config loader writes generated modules under `node_modules/.vite-temp`, while the M42 digest excluded `.vite` but not `.vite-temp`. Under the old helper, adding only a synthetic Vite `.vite-temp` config changed the dependency digest; under the corrected helper it does not. Actual package-file mutation continues to change the digest.

The generated-cache exclusion set is now `.cache`, `.vite`, `.vite-temp`, and `.vitest`. Path-level evidence manifests and per-gate assertions were added so future source/dependency drift fails at the exact producing gate with exact changed paths. See `M42-HOSTED-EVIDENCE-STABILITY-CORRECTIVE-2026-09-15.md`.
