# M42 Certification Environment Preflight Corrective

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery
State: implementation-complete-pending-certification
Architecture: 50

## Problem isolated

M42's implementation and gate scripts were fail closed, but target-environment prerequisites were discovered incrementally. A missing Docker runtime, unavailable npm registry, missing exact dependencies, or unavailable browser could therefore be discovered only after earlier verification work had already run. That behavior is safe but unnecessarily iterative and conflicts with the M42 continuation requirement to avoid trial-and-error certification.

## Corrective implementation

Added `scripts/preflight-stage-g-m42-certification.mjs` and the package command `users-rbac-recovery:preflight`.

The preflight aggregates the prerequisites required by the existing M42 certification/finalization path:

- exact Node v22.16.0;
- governed npm version from `packageManager`;
- `package-lock.json` presence;
- M41 `active-certified` prerequisite and a recognized M42 activation state;
- exact direct dependency availability, or npm-registry reachability when `npm ci` is required;
- a supported Chromium-based browser;
- a running Docker-compatible daemon for the disposable Supabase stack;
- Supabase CLI 2.117.0 available globally or resolvable through pinned `npx`;
- `shasum`, `tar`, `zip`, and `unzip` for final package hygiene.

The corrective is enforced by:

- `scripts/certify-stage-g-m42.sh` before the pgTAP/database gate or state mutation;
- `scripts/finalize-stage-g-m42.sh` before dependency restoration and the full certification sequence;
- `.github/workflows/users-rbac-functional-recovery.yml` immediately after `npm ci`;
- `verify-stage-g-m42-users-rbac-functional-recovery.mjs` so removal or reordering fails static verification.

## Verification in this continuation

- M42 static: PASS — 63 checks.
- M42 deterministic execution: PASS — 31 vectors.
- Stage A security baseline: PASS.
- Full UI verifier chain: PASS.
- Preflight behavior: PASS as a fail-closed diagnostic — it reports exactly two external blockers in this sandbox: npm registry DNS (`EAI_AGAIN`) and missing Docker command/runtime.
- Chromium detection: PASS (`/usr/bin/chromium`).
- Direct `users-rbac-recovery:certify`: correctly stops at preflight before database work or activation mutation.
- `scripts/finalize-stage-g-m42.sh`: correctly stops at preflight before dependency restoration or activation mutation.
- State immutability after both blocked attempts: PASS — M42 remains `implementation-complete-pending-certification`.
- Historical collect-all: 152 total, 136 PASS, 16 blocked by missing dependency modules. The failing verifiers resolve to `zod`, `@tanstack/react-query`, or `zustand` module-resolution failures; the M42 verifier itself passes.

## Remaining external certification requirements

M42 cannot be promoted in this sandbox. A certification-capable environment still must provide npm registry access (or an already exact dependency tree plus pinned Supabase CLI 2.117.0) and a running Docker-compatible runtime. After the preflight passes, the existing fail-closed finalizer must complete the real browser gate, disposable Supabase pgTAP suite, dedicated certification, post-certification state check, complete historical sweep, TypeScript/security/UI gates, and final checksum/package hygiene before any certified baseline or PASS record is created.
