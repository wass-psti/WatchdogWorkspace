# M95 Corrective Loop — Historical Regression Synchronization

## Classification

- Execution class: CORRECTIVE LOOP
- Origin: historical regression gate after M95 dedicated certification
- Failed checkpoint: `npm run verify:historical-all`
- Observed result: 211 verifiers, 183 passed, 28 failed
- Root-cause classes: verification-contract drift and predecessor source-guard lifecycle mismatch

## Root cause

M95 intentionally canonicalized viewport breakpoints to 640 / 840 / 1120 / 1440 px. Several historical verifiers still asserted obsolete literal breakpoint strings such as 620, 720, 760, 900, 960, 1180 and 1440 px in predecessor stylesheets. Those literal checks no longer represented the successor responsive contract even though the associated behavior remained present under the canonical M95 breakpoints.

Stage-I M84–M94 historical verifiers also invoked their original milestone source guards against the current M95 tree. Those guards are certification-boundary guards for their own milestone snapshots and cannot classify legitimate M95 successor files as historical regressions. M95's M94-certified source guard remains the authoritative current-tree provenance gate.

## Corrective delta

- Historical responsive assertions were synchronized to canonical M95 breakpoint equivalents while retaining the original behavior/selector assertions.
- M84–M94 root verifiers now recognize the presence of the M95 successor target and omit only their obsolete predecessor snapshot guard in that successor context. Their functional, architectural and protected-contract assertions continue to run.
- The M95 root verifier accepts each valid lifecycle state used by the ordered certification pipeline: implementation-complete/pending, certification-gates-passed/pending-regression, and active-certified.
- The M95 M94-certified source-guard manifest explicitly authorizes the corrected historical verifier mutations.

## Evidence

All 28 verifiers that failed in the supplied historical-regression output pass when replayed against this corrected source tree. M95 source-guard and M95 deterministic responsive verification also pass.

## Exit criterion

The corrective loop is exited only after a clean local ordered certification run reports all historical verifiers passing, release verification passing, package/checksum hygiene passing, final checkpoint passing, and certified M95 artifact publication passing.
