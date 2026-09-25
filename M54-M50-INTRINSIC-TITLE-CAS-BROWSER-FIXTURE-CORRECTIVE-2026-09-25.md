# M54 — M50 Intrinsic Title CAS Browser Fixture Corrective — 2026-09-25

Candidate 02 advanced through M46–M49 browser certification, then M50 failed because the retained Item Workspace fixture still modeled title edits through the retired `wm_update_board_item` whole-item RPC. The current Item Workspace controller persists core fields through field-scoped Board cell compare-and-set operations.

This corrective updates the M50 browser fixture to implement `wm_set_board_cell` / `wm_set_board_cell_if_current`, source intrinsic/system-field expected values from authoritative item state, return `WM_BOARD_CELL_CONFLICT` for stale expected values, reconcile successful writes into the fixture snapshot, and retain Item Workspace activity semantics. The M50 browser test now proves title CAS with expected value `Alpha` and explicitly verifies that `wm_update_board_item` is not used.

Production runtime, database schema, RLS, migrations, and the frozen `v1.43.2-m54` release remain unchanged.
