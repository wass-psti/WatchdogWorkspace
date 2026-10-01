# M95 Corrective Loop — Stage-I Source-Guard Delegation

## Origin
M95 v12 local `release:check` after the M78 successor-authorization correction.

## Failed gate
`token-theme:source-guard` (`scripts/verify-stage-i-m79-m78-source-guard.mjs`), which delegated through historical Stage-I guards and stopped at the M91→M90 source guard.

## Exact failure
The M91 guard treated M95-authorized responsive mutations and M95-owned files as unauthorized M90/M91 drift because it only merged M92's first-order allowlist and did not delegate to the current M95→M94 source guard.

## Root-cause classification
Verification-contract lifecycle drift. Application/runtime behavior was not implicated.

## Corrective delta
The M91 source guard now recognizes a provenance-bound M95 target in any pending/certified lifecycle state and delegates current-tree validation to `scripts/verify-stage-i-m95-m94-source-guard.mjs`. Pure pre-M95 trees retain the original strict M91→M90 comparison.

## Safety properties
- No historical baseline hashes were removed or weakened.
- No unrestricted successor bypass was added.
- Delegation requires the exact certified M94 ZIP/source identities recorded by M95.
- The current M95 guard remains fail-closed against its M94 baseline and explicit mutation/new-file manifests.

## Exit criterion
All Stage-I source-guard entry points invoked by `release:check` must reach and pass the M95→M94 guard, followed by all remaining release, package-hygiene, final-checkpoint, publication, checksum, and handoff gates.
