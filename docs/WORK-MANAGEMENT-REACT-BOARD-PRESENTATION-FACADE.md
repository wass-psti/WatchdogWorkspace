# Work Management — Stage D M15 React Board Presentation Facade

## Scope
M15 establishes **React route-level presentation ownership** for `#/boards` and `#/boards/:boardId` without rewriting the mature Board behavior stack.

React now owns a dedicated page-lifetime `BoardPresentationFacade` host. The existing typed Board presentation engine (`assets/js/boards-ui.ts`) renders only inside that host. React does not reconcile the engine's imperative descendants.

## Preserved authorities
- Board domain/service authority remains in the existing typed Board service layer.
- Board command authority remains the typed command service.
- Board repository, TanStack Query server-state, Zustand-scoped client state, RBAC, Supabase transport/RLS/RPC, status lifecycle, drag/drop, inline editing, history, selection, dialogs, overlays, Item Workspace, Table, and Kanban behavior are unchanged.
- M11 continues to own global overlay roots.

## Ownership transition
Before M15, Board route presentation rendered through the general M10 legacy route-content island. M15 isolates Boards into a dedicated React-owned facade host and hides/inerts the general legacy host while a Board route is active.

## Compatibility boundary
The Board DOM renderer and interaction controllers remain imperative compatibility presentation internals behind the React facade. This is intentional for M15; later Stage D milestones can migrate individual Board surfaces to React without destabilizing Board behavior.

## Data / backend impact
No Supabase migration. No schema, RLS, RPC, repository payload, or persistence contract changes.
