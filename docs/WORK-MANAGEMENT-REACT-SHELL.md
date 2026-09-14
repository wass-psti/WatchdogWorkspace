# Work Management React Shell — Stage C Milestone 10

Milestone 10 moves persistent host-shell presentation ownership from the imperative `assets/js/app.ts` renderer into React 19.2.

## Ownership after M10

- React owns the persistent `.shell` frame, sidebar structure, responsive/mobile navigation chrome, workspace host semantics, global shell overlay roots, and projection of shared navigation state.
- Zustand v5 remains the shared client-state authority for shell navigation mode, width, pin/peek/resizing/mobile state, section expansion, and resource-search state.
- TanStack Query v5 remains the server-state authority. Board rows are not copied into React or Zustand state.
- Supabase Auth remains identity/session authority; Supabase Postgres/RPC/Storage remains persistent-domain and authorization authority.
- Existing host feature renderers remain temporary route-content compatibility islands inside the page-lifetime `LegacyApplicationBoundary`.

## Temporary compatibility boundary

M10 intentionally retains a **temporary compatibility bridge for dynamic resource navigation markup**. The existing TypeScript host runtime still serializes authorization-aware Applications, Favorites, and Boards resource rows and publishes that markup through `shell-runtime-bridge.ts`; React owns the `<nav>` container and persistent shell structure. This boundary avoids duplicating module authorization, favorites, Board query-cache reads, and search semantics while later Stage C milestones migrate those host features independently.

The historical `shell(...)` serializer remains checked in only so older source-shape verifiers can continue validating previous shell guarantees. Runtime code no longer invokes it to create the persistent shell.

## Stable route-content island

`LegacyApplicationBoundary` is memoized and page-lifetime stable. Authentication, route transitions, responsive navigation state, and shell updates do not remount the host. React changes attributes around the host but does not render or reconcile the imperative descendants inserted by existing route controllers.

## Out of scope

M10 does not migrate Home, Boards, Settings, Account, User Management, authentication forms, command palette, or embedded application internals to React. It also introduces no Supabase schema migration.
