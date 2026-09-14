# M42 / M40 Browser Harness Readiness Corrective

## Scope

This corrective preserves M42/M39 authoritative identity readiness and restores a separate M40 application-shell readiness barrier.

## Corrections

- `waitForM39Identity()` remains based on persisted identity plus `identity.current`.
- Added `waitForM40ApplicationReady()` requiring authenticated runtime context, committed route lifecycle, one React shell root, and one runtime/board/overlay host.
- All three M40 route-lifecycle browser scenarios wait for this barrier after identity readiness and before lifecycle assertions.
- `expectCommittedSurface()` now includes shell-host counts in its polling predicate, closing the gap between lifecycle commit and DOM host readiness.

## Verification state

Static/syntax verification passes. The current execution environment could not restore project dependencies because repeated `npm ci` attempts timed out at the transport layer, so dependency-backed M40 deterministic/browser and M42 browser reruns remain target-machine gates.
