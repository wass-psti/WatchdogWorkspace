# M42 Stage-B Dependency Verifier Synchronization

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery
State: implementation-complete-pending-certification

The M42 lockfile-integrity corrective moved the governed `tsc`/`vite` binary checks from `scripts/ensure-project-dependencies.mjs` into the shared `scripts/lib/lockfile-install-verifier.mjs`. The historical Stage-B bootstrap verifier still asserted the former inline implementation location and therefore failed even though the behavior remained present and stronger.

`verify-stage-b-bootstrap-resilience.mjs` now validates the shared lockfile authority instead. It requires:

- `ensure-project-dependencies.mjs` to invoke `verifyInstalledLockfileTree(root)`;
- the shared lockfile verifier to enforce `tsc` and `vite` binaries; and
- the shared verifier to reject packages extraneous to `package-lock.json`.

This is a historical-verifier synchronization only; no production runtime or Stage-B behavior was weakened.

## Offline materialization synchronization — 2026-09-14

The later M42 offline-cache corrective replaced the old single inline `npm ci --ignore-scripts` shape with deterministic capability routing: an isolated real offline `npm ci` probe followed by either exact offline restoration or exact registry-backed restoration. `verify-stage-b-bootstrap-resilience.mjs` is synchronized to that stronger authority and now explicitly rejects dry-run-only cache evidence. This is verifier synchronization only; Stage-B runtime behavior is not weakened.
