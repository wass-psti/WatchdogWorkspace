# M106 M54 Runtime-Capability / M105 Import-Contract Parity Corrective

## Originating failure
M54 Functional Production Readiness Certification run `37561869409`,
job `112603306185`, failed during live authenticated production E2E.

The authenticated administrator successfully traversed Account, Settings, and
Users. Navigation to `#/boards` then failed because the Boards presentation
never became available and the test could not find the expected level-one
`Boards` heading.

## Root cause
The Stage I M105 migration introduced and production-attested
`wm_import_board_items_atomic`, and the active client capability manifest also
requires that RPC for the Boards module. However, the production
`wm_runtime_capabilities()` RPC still used the earlier M54/M51 required-RPC
list and did not advertise `wm_import_board_items_atomic`.

As a result, the authenticated M38 runtime preflight classified Boards as not
ready before it could run the Board-contract attestation, so routing remained
behind the backend-preflight presentation instead of exposing Boards.

## Evidence
- M54 live HTTP artifact smoke: PASS.
- `wm_runtime_capabilities` request during the failed test: authenticated HTTP
  200.
- The pre-corrective capability payload omitted
  `wm_import_board_items_atomic`.
- The client `M38_REQUIRED_RPCS` includes
  `wm_import_board_items_atomic`.
- Production `wm_board_contract_attestation()` independently reports
  `compatible=true` and `m47_compatible=true`.
- Production `wm_deployment_contract_attestation()` independently requires and
  reports the atomic import RPC.
- Corrective production migration
  `stage_i_m106_m54_runtime_capability_m105_parity_corrective` was applied to
  Supabase and the post-corrective runtime capability payload includes
  `wm_import_board_items_atomic` with all missing capability arrays empty.

## Corrective repository delta
This repository adds the exact migration already applied to production and
extends M106 governance verification so source reconstruction cannot regress
the parity correction.

No application UI/runtime behavior is weakened and no capability gate is
bypassed.
