# M73 Boards UI Design-System Migration

M73 migrates the existing typed imperative Boards presentation consumers onto the certified Stage H design-system semantics without changing Board domain state, repository/Supabase contracts, realtime/concurrency, persistence, RBAC, drag/drop, selection, history, or route ownership.

## Ownership
- React remains the route-level Board presentation host only.
- `assets/js/features/boards/views/**` remains the production Board descendant renderer.
- Shared semantic classes from M63–M71 are additive to existing Board selectors and `data-*` runtime hooks.
- `boards-monday.css` remains the Board-specific visual authority; `boards-ui-migration.css` is a bounded reconciliation layer loaded after it.

## Migrated surfaces
Boards collection, workspace chrome, Table, Kanban, Item Workspace, and Board dialogs.

## Successors
M74 TimeTracker, M75 FuelTrack+, M76 TradeLink, M77 final UI production certification.
