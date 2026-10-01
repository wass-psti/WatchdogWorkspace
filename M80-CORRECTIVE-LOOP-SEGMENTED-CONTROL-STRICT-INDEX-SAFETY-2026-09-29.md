# M80 Corrective Loop — Segmented Control Strict Index Safety

## Origin
The first clean local M80 certification attempt failed during Stage 4 `npm run typecheck` with TypeScript TS2538 in `src/design-system/shared-primitives/segmented-control.tsx`.

## Root cause
The segmented-control keyboard focus path indexed `enabledIndexes` and immediately reused the indexed result as an index into the button-ref array. Under the repository's strict indexed-access contract, an array lookup remains `number | undefined` even after a separate non-empty length check. The implementation therefore failed strict compilation for Arrow/Home navigation and used a non-null assertion for End navigation that masked the same structural condition.

## Corrective delta
- Centralized ref focus through `focusEnabledPosition(position)`.
- Explicitly narrows an indexed enabled option before indexing `refs.current`.
- Removed the `enabledIndexes.at(-1)!` assertion.
- Preserved native disabled semantics and wrap-around Arrow navigation.
- Added deterministic component tests for disabled-option skipping, Arrow wrap-around, Home/End, a single enabled option, and a globally disabled control.

## Regression boundary
No database, migration, backend, API, authentication, RBAC, persistence, routing, dependency, infrastructure, or visual-token ownership was changed.

## Exit criterion
The corrective loop exits only after a clean M80 certification run passes typecheck, build, deterministic component execution, browser/E2E, dedicated certification, post-certification state validation, historical regression, artifact/package hygiene, and the final certified checkpoint.
