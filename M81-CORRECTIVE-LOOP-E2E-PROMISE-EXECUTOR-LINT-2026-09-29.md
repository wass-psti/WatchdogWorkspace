# M81 Corrective Loop — E2E Promise Executor Lint

## Origin
M81 Corrective v2 local certification reached Stage 4 static verification and failed ESLint in `tests/modern/e2e/m81-application-shell.spec.mjs`.

## Failure
`no-promise-executor-return` rejected two Promise executors because concise arrow bodies implicitly returned the numeric handle produced by `requestAnimationFrame(...)`. Promise executor return values are ignored.

## Root cause
Test implementation defect isolated to Browser/E2E synchronization code; no application-shell or navigation runtime regression was established.

## Corrective delta
Both frame-wait Promise executors now use block bodies and explicit nested callbacks. They call `resolve(...)` without returning the animation-frame request handle.

## Regression protection
The M81 static verifier requires this corrective record and rejects the previous concise executor pattern.

## Exit criterion
A clean fail-closed M81 certification must pass lint, typecheck, build/performance, deterministic tests, Browser/E2E, dedicated certification, post-certification validation, historical regression, package hygiene, and final checkpoint validation.
