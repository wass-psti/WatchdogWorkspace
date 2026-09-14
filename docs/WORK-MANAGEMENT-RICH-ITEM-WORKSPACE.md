# Work Management Rich Item Workspace — Stage D M21

Milestone 21 expands the existing Board Item Workspace without introducing a second Board state model.

## Scope

- Adds a typed **Overview** tab while retaining Updates, Files, and Activity.
- Exposes core item properties (name, status, owner, due date, notes) as explicit-save controls.
- Exposes visible non-system Board columns as typed property controls using the existing Board column registry.
- Preserves the no-save-on-blur interaction contract. Escape resets the active property form rather than committing it.
- Preserves update composer drafts across tab changes and Item Workspace rerenders.
- Adds drag-and-drop to the existing private attachment workflow; picker upload remains supported.
- Keeps M20 Realtime as metadata-only invalidation followed by canonical repository/RPC refetch.

## Data authority

M21 does not add a database schema or storage contract. Core fields persist through `BoardCommandService.updateItem`; custom fields persist through `BoardCommandService.setCell`; Updates and Files continue through the existing Item Workspace RPC and private Storage authorities.

## Compatibility boundaries

The React Board presentation facade continues to own the Board route host while `assets/js/boards-ui.ts` and the typed Item Workspace view/controller/runtime remain the compatibility presentation engine. M18 virtualization and M19 native drag/drop remain unchanged. M20 Realtime remains authoritative for cross-session convergence.
