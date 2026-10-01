# M99 Corrective Loop — E2E Promise Executor Lint

## Classification

**CORRECTIVE LOOP**

## Origin

The first dependency-backed M99 local certification attempt reached the static-verification stage and failed in ESLint on `tests/modern/e2e/m99-sidebar-interaction-containment.spec.mjs`.

## Failure condition

ESLint reported `no-promise-executor-return` for the two-animation-frame synchronization helper because the Promise executor used an expression body that implicitly returned the numeric value from `requestAnimationFrame()`.

## Root-cause classification

Implementation defect in newly introduced M99 E2E regression-test code. No production-runtime defect was established by this failure.

## Corrective delta

The Promise executor now uses a block body and nested `requestAnimationFrame()` callbacks, preserving the intended two-frame synchronization while returning no executor value.

## Forward-progress evidence

Before the lint failure, the user's local run established PASS for repository identity, lockfile presence, clean dependency installation with 0 vulnerabilities, the M99 static verifier, historical shell section/resource, resizing/pinning, responsive/accessibility and collapse-control verifiers, and TypeScript type checking.

The corrected source also passes the dependency-independent M99 static verifier in the packaging environment.

## Exit criterion

Restart the complete fail-closed M99 certification pipeline from Stage 1. The loop is exited only after every required stage passes and the certified ZIP, checksum companion, and PASS record are generated from the unchanged certified source state.
