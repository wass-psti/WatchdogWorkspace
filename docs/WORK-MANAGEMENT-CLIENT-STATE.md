# Work Management — Client-state Ownership Model

Stage B Milestone 9 introduces **Zustand v5** as a deliberately scoped client-state engine. It is not a replacement for every stateful subsystem.

## Ownership rules

| State class | Authority | Zustand? |
| --- | --- | --- |
| Server state | TanStack Query v5 + repositories | No |
| Authentication/session | Work Management auth runtime + Supabase Auth | No |
| Persistent domain/application data | Supabase Postgres/RPC/Storage | No |
| Persistent shell preferences | Existing explicit browser persistence; hydrates live shell client state | Limited live mirror |
| Shared shell client state | Work Management Zustand client-state service | Yes |
| Feature-local UI state | Owning feature/controller | No global migration |
| Form/workflow state | Owning form/workflow controller | No global migration |
| Derived state | Selectors/computation | No persistence |

## M9 migrated state

M9 also removes the shell sidebar's duplicate Board-record cache. Sidebar Board rows and their loading/error metadata are now read directly from the existing TanStack Query authority through the Board query-key contract, so server data is not mirrored into Zustand or another module-level cache.

M9 moves the shell's duplicated module-level mutable client state behind `assets/js/platform/state/client-state-store.ts`:

- navigation mode, width, and pin state as the live client representation of established persisted preferences;
- navigation peek, resize, and mobile-open transient state;
- Favorites / Applications / Boards section expansion as the live client representation of established persisted preferences;
- shell resource-search query.

The store is framework-neutral (`zustand/vanilla`) so the imperative shell and React composition can share one page-lifetime authority. `src/app/composition/useWorkManagementClientState.ts` provides a React subscription bridge without introducing a second store or provider.

## Explicit exclusions

M9 does **not** move Board records, Board Item Workspace server data, authentication/session identity, module operational records, files, RLS/RPC authorization, Board selection/history/editor drafts, Home filters, or form submission state into Zustand. These remain with their existing authorities.

Authorization-context changes clear TanStack server state and transient shared client state. Persisted shell preferences survive this reset and are not treated as session-scoped data.

No Supabase migration is required for M9.
