# M35 Certification Harness Collect-All Hotfix

## Problem
The M35 certification loop was exposing one stale historical verifier at a time because `verify-project.sh` is fail-fast. Corrective-3 also exposed a verifier-harness defect: `verify-settings.mjs` supplied an incomplete `window` mock while M34 correctly emits `wm:backup-dr` events through `window.dispatchEvent`.

## Correction
- `verify-settings.mjs` now supplies browser-compatible event dispatch methods and asserts the M34 `import-preflight` event is emitted.
- `scripts/verify-all-historical-verifiers.mjs` executes every root `verify-*.mjs` authority, continues after failures, and reports the complete failure set in one run.
- `npm run verify:historical-all` is an M35 preflight authority.
- The dedicated M35 CI workflow executes the collect-all gate immediately after `npm ci`, before the formerly failing verifier families and before M35 activation gates.

## Scope
No production runtime, database schema, migration, service-worker, embedded module, or dependency version is changed by this corrective.
