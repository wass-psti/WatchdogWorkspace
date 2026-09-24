# M54 M40 Board Capability Fixture Synchronization Corrective — 2026-09-24

## Failure
Candidate 03 repeated the M40 browser failure on `#/boards`: route lifecycle committed with `owner: shell` while the Boards presentation remained hidden.

## Root cause
The historical M39/M40 Supabase fixture advertised the M38 runtime capability RPC list without `wm_set_board_cell_if_current`. The production M38 capability manifest requires that RPC after the M51 concurrency hardening. Therefore the backend preflight correctly marked the Boards module not ready and route presentation correctly remained shell-owned. Candidate 03 only waited for preflight to settle; it did not prove Boards capability readiness.

## Correction
- Add `wm_set_board_cell_if_current` to the fixture runtime capability RPC inventory.
- Require `backendPreflight.state === ready` and `backendPreflight.modules.boards.ready === true` before M40 route-cycle assertions begin.
- Add M54 static verification coverage for both invariants.

No production route, authorization, backend capability, database/RLS, or Boards runtime behavior is altered by this corrective change.
