# M73 CSS performance budget corrective v2 — 2026-09-27

## Originating failure
The corrective-v1 local production build measured `initialCssRawBytes: 590071`, exceeding the unchanged M31 ceiling of `590000` by 71 bytes.

## Root cause
M73 applied the shared `wm-panel` class to Board groups and Kanban lanes even though those surfaces already own their geometry through the established Board presentation system. That unnecessary adoption required an M73-only `padding:0` compensation rule.

## Corrective change
- Removed `wm-panel` from Board group roots and Kanban lane roots.
- Retained shared `wm-panel` adoption on the Board workspace header where the primitive is compatible.
- Removed the now-unnecessary panel-padding compensation from `boards-ui-migration.css`.
- Retained only the `wm-data-region` reconciliation needed by the Board Table/Kanban roots.
- Tightened the M73 bridge source-size guard to 220 bytes and added deterministic checks preventing reintroduction of geometry-sensitive `wm-panel` adoption.

The M31 budget remains unchanged. Board runtime, state, persistence, realtime, RBAC, virtualization and drag/drop ownership are unchanged.
