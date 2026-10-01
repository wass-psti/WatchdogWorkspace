# M95 Corrective Loop — M81 Successor Breakpoint Synchronization

## Classification
- Execution: CORRECTIVE LOOP
- Origin: v13 clean M95 certification replay
- Failed gate: `application-shell:test` inside `release:check`
- Failure: M81 deterministic verification required the retired CSS literal `@media (max-width:620px)` after M95 normalized governed shell CSS to the canonical `40rem` (640px) narrow breakpoint.
- Root cause: implementation / historical verifier successor-governance drift.

## Corrective delta
- Keep the original M81 `620px` CSS assertion when M95 successor authority is absent, preserving deterministic historical behavior for an actual M81 tree.
- When an M95 target and M95→M94 source-guard manifest are present, require the canonical M95 `@media (max-width:40rem)` shell rule instead.
- Preserve M81 runtime JavaScript breakpoint semantics and all non-responsive M81 navigation invariants unchanged.
- Explicitly authorize the historical M81 verifier mutation in the M95 source-guard manifest.
- Add M95 static verification that the M81 historical execution verifier remains successor-aware and source-guard-authorized.

## Forward-progress evidence
The corrected targeted M81 verifier, M95 source guard, and M95 static/deterministic gates must pass before this corrective loop may be considered exited. Full local fail-closed certification remains required for final M95 completion.
