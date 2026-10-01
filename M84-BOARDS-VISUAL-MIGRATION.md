# Stage I — M84 Boards Visual Migration

M84 is a presentation-only successor over the M83 certified baseline and the M73 Board design-system migration.

## Scope
- Boards collection shell and cards
- Board workspace shell and view navigation
- Table, grid and list presentation
- Status presentation
- Search and filter surfaces
- Board dialogs and floating surfaces
- Kanban lanes/cards/drop feedback
- Item workspace presentation
- Responsive, reduced-motion and forced-colors presentation

## Preserved behavior authorities
M45 collection/routes, M46 backend/data contracts, M47 table/group/item behavior, M48 columns/cells/status semantics, M49 Kanban/drag-drop, M50 rich item workspace, M51 realtime/concurrency, and M52 cross-module RBAC remain authoritative. M84 does not alter database schema, migrations, Supabase contracts, persistence semantics, realtime semantics, RBAC, status identifiers, drag/drop state, selection/history, or Board repository/domain ownership.
