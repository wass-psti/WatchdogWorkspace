# Work Management — Stage D M16 Board Component Decomposition

## Scope
M16 decomposes the M15 React Board presentation facade into focused, strongly typed React presentation components **without rewriting Board behavior or changing any Board domain authority**.

The route-level `BoardPresentationFacade` is now only a composition entrypoint. Route-derived presentation state is normalized in `board-presentation-model.ts`, `BoardPresentationRouteBoundary.tsx` owns the typed route-to-component boundary, and `BoardPresentationSurface.tsx` owns the single stable compatibility host consumed by the existing typed Board engine.

## Component responsibilities
- `BoardPresentationFacade.tsx` — subscribes to the M15 external-store runtime and delegates presentation.
- `BoardPresentationRouteBoundary.tsx` — converts one Board runtime snapshot into one typed presentation model and delegates to the stable surface component.
- `board-presentation-model.ts` — exhaustive discriminated model for inactive, collection, and Board workspace states.
- `BoardPresentationSurface.tsx` — owns host DOM attributes, accessibility metadata, hidden/inert semantics, and the M15 compatibility-host contract.

## Stability invariant
The compatibility host remains one stable element type across `#/boards` and `#/boards/:boardId` transitions. M16 deliberately avoids route-specific host component replacement because the imperative Board engine patches this host synchronously. This prevents React route updates from remounting the host and discarding freshly rendered Board markup.

## Preserved authorities
- `assets/js/boards-ui.ts` remains the compatibility Board presentation/interaction engine.
- Board domain service, command service, repository, TanStack Query server state, Zustand-scoped client state, RBAC, Supabase transport/RLS/RPC, Status lifecycle, drag/drop, inline editing, history, selection, overlays, dialogs, Item Workspace, Table, and Kanban behavior remain unchanged.
- M11 remains the global overlay authority.

## Exclusions
M16 does not migrate individual Board Table, Kanban, Item Workspace, dialog, menu, cell-editor, or drag/drop implementations to React. Those remain compatibility internals for later Stage D milestones.

## Data / backend impact
No Supabase migration. No database schema, RPC, RLS, transport payload, repository DTO, query key, persistence, or authorization change.
