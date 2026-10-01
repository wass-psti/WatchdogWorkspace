# M95 Corrective Loop — M63 Successor Accessibility Authority

## Origin
The v5 fail-closed release pipeline passed M62 successor-aware responsive verification and then stopped at the M63 accessibility deterministic verifier.

## Failure
M63 still required six M62-era responsive CSS authority hashes to remain unchanged even though M95 is the explicit staged responsive migration successor.

## Root cause
Verification lifecycle drift. M63 correctly protected the M62 certified authority at certification time, but its deterministic replay did not recognize the later M95 migration boundary.

## Corrective delta
M63 remains strict for pre-successor states. When M95 exists, only the six explicitly migrated responsive authorities are successor-owned, and each must be explicitly governed by the M95 responsive verifier. All other M63/M62 authority checks remain unchanged.

## Exit criterion
A clean local pipeline must pass M63, the remainder of `release:check`, package hygiene, final checkpoint, certified publication, and artifact checksum validation.

## Downstream audit
The same stale pre-M95 authority-freeze pattern was found before rerun in M64, M68, M69, and M70. The corrective checkpoint synchronizes those deterministic verifiers in the same fail-closed manner: only explicitly M95-governed responsive authorities may bypass predecessor hashes; all unrelated certified authority hashes remain mandatory.

## v7 state-literal correction

The v6 rerun exposed a second verifier defect after the authority-hash synchronization: M63/M64 accepted an obsolete post-certification state literal. The authoritative M95 finalizer publishes `certification-gates-passed-pending-regression`; both verifiers now validate that exact lifecycle state.
