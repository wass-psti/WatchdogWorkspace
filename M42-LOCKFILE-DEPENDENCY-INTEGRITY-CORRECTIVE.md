# M42 Lockfile Dependency Integrity Corrective

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery
State: implementation-complete-pending-certification
Architecture: 50

## Problem isolated

The certification environment preflight and the shared `dependencies:ensure` path validated only the 15 direct dependencies plus the `tsc`/`vite` binaries. That was insufficient for a fail-closed certification claim of an **exact package-lock dependency graph**: a missing, stale, or extraneous transitive package could pass the dependency preflight and fail later in TypeScript, browser, or historical verification.

## Corrective implementation

Added `scripts/lib/lockfile-install-verifier.mjs` as the shared lockfile authority. It now:

- requires lockfileVersion 3;
- verifies `package.json` dependency and devDependency declarations exactly match the lockfile root;
- checks every platform-applicable, non-optional lockfile package is installed;
- checks installed package versions exactly equal the lockfile versions;
- allows only legitimately absent optional packages and platform-inapplicable packages;
- detects installed packages that are extraneous to `package-lock.json`;
- requires the governed `tsc` and `vite` binaries.

`scripts/ensure-project-dependencies.mjs` now uses this verifier before installation and again after `npm ci --ignore-scripts`. M42 environment preflight uses the same authority before deciding whether registry access is required. A diagnostic package command, `npm run dependencies:verify-lockfile`, was added.

The M42 static verifier now fails if this lockfile-wide authority is removed or replaced by the former direct-only check.

## Current-environment result

This sandbox still has no installed dependency tree and outbound DNS is blocked, so lockfile-wide verification correctly fails closed before dependency-backed certification. An `npm ci --offline` attempt also proved the local npm content cache does not contain the required tarballs. This corrective does not change product runtime behavior or M42 activation state.

## Offline cache restoration corrective — 2026-09-14

The lockfile verifier exposed a further environment-detection issue: a missing `node_modules` tree was treated as requiring live registry access even when npm's local content cache could already satisfy the entire lockfile. M42 preflight now performs a disposable real `npm ci --offline --ignore-scripts` in an isolated temporary project as the capability probe. This avoids npm's misleading `--dry-run` behavior, which can succeed even when required package tarballs are not cached. `dependencies:ensure` uses the exact offline graph only when the disposable install actually materializes it, and otherwise falls back to registry resolution. This preserves exact package-lock enforcement while avoiding a false network blocker in air-gapped or transient-DNS environments.
