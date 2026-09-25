# M54 M47 System-Cell CAS Browser Fixture Corrective — 2026-09-25

## Originating failure

Candidate 01 passed artifact integrity, clean dependency installation, static verification, deterministic M46–M50 verification, and the M46 browser gate. The M47 browser CRUD scenario then stopped with the Edit “Echo” dialog still open after Save.

## Root cause

The M47 browser fixture advertised `wm_set_board_cell_if_current`, but resolved every non-title column through `state.values`. Current item editing persists system fields through field-scoped CAS. The Status column is system-backed by `item.status`, so the fixture incorrectly observed `null` instead of the expected `todo`, returned `WM_BOARD_CELL_CONFLICT`, and correctly caused the dialog to remain open.

The browser spec also retained an obsolete assertion requiring `wm_update_board_item`, although current editing intentionally avoids whole-item mutation.

## Corrective

- Resolve Status, Assignee, Due Date, and Notes CAS values from authoritative item fields.
- Persist those system-field CAS mutations back to the authoritative item record.
- Preserve intrinsic title CAS through a null column id and custom-column values through `state.values`.
- Update M47 browser authority to require title/status CAS and reject the retired `wm_update_board_item` edit path.
- Harden the M47 static verifier so future fixture drift fails before browser execution.

No production runtime, database, RLS, migration, or deployed M54 baseline semantics are changed.
