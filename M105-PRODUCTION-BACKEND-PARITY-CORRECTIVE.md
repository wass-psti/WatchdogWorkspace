# Stage I M105 — Production Backend Parity Corrective

## Originating failure

After the M104 GitHub Pages deployment, Boards was blocked by:

WM_BACKEND_CAPABILITY_MISMATCH

Missing capability:

rpc:wm_import_board_items_atomic

## Root cause

The production frontend was valid, but production Supabase had not received
the final M101/M103 Boards import RPC contract required by the deployed runtime.

## Corrective implementation

M105:

1. Records the production Board import RPC as a canonical timestamped migration.
2. Preserves authenticated-only execution for the mutating import RPC.
3. Adds a read-only deployment contract attestation.
4. Makes GitHub Pages fail closed if live backend parity is absent.
5. Rechecks backend parity after Pages deployment.
6. Adds bounded M105 successor authority over M104.

## Production migration

20261006041529_stage_i_m105_production_board_import_contract_parity

## Required live contract

wm_deployment_contract_attestation():

- schema_version = 1.43.2-m105-v1
- required_rpc = wm_import_board_items_atomic
- wm_import_board_items_atomic = true
- compatible = true

## Security boundary

wm_import_board_items_atomic:

- authenticated EXECUTE: allowed
- anon EXECUTE: denied

wm_deployment_contract_attestation is read-only and exposes only deployment
compatibility metadata.
