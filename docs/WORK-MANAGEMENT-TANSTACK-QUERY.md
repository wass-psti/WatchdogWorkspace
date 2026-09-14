# Work Management — TanStack Query Migration

Stage B Milestone 8 moves Work Management server-state caching to **TanStack Query v5** while preserving the existing repository/service boundaries and the M7 Supabase transport adapter.

## Runtime authority

- Package: `@tanstack/react-query@5.102.8`
- Native client authority: `assets/js/platform/data/tanstack-query-client.ts`
- Legacy compatibility facade: `assets/js/platform/data/query-client.ts`
- React provider: `src/app/composition/WorkManagementQueryProvider.tsx`
- Architecture Version: **18**

The page owns one native TanStack `QueryClient`. `QueryClientProvider` exposes that client to React composition, while `platform-services.ts` injects the same native client into the Work Management compatibility facade used by the existing imperative Boards repository. React and legacy code therefore do not maintain separate server-state caches.

## Migrated responsibilities

TanStack Query now owns:

1. deterministic query hashing;
2. in-flight request de-duplication;
3. stale-time based cache reuse;
4. query invalidation and removal;
5. query error/data/fetch state;
6. mutation cache lifecycle;
7. cache garbage collection;
8. the React query context used by future feature migrations.

The Work Management facade continues to expose the established `fetchQuery`, `mutate`, `getQueryData`, `setQueryData`, `invalidateQueries`, `removeQueries`, `clear`, `subscribe`, and `snapshot` contract so non-React runtime code does not need a simultaneous presentation migration.

## Query key policy

Existing repositories continue to own semantic query keys. M8 converts those keys to TanStack Query keys without flattening nested structures. Hashing is delegated to TanStack Query `hashKey`, so object key order remains deterministic.

Board keys remain scoped to the authenticated user, for example:

`['boards-user', userId, 'board', boardId]`

This prevents cache reuse across authenticated identities. The existing authorization reconciliation path still calls `serverState.clear()` when the authenticated authorization context changes.

## Request and mutation policy

The compatibility facade passes TanStack's query `AbortSignal` to Work Management query functions. Existing query functions that do not consume a signal remain compatible; later repository migrations may forward the signal to M7 transport operations where useful.

To preserve current application behavior while the legacy shell remains mounted, the shared client disables automatic mount, reconnect, and window-focus refetches and disables automatic retries. Explicit Work Management refresh/invalidation behavior therefore remains authoritative. Future React-owned features may opt into different query options per query after their presentation migration.

The M8 facade also deliberately preserves four pre-M8 semantics that differ from TanStack Query defaults or broader matching behavior:

- repository query functions begin on a microtask, so existing immediate-state assumptions remain stable;
- de-duplicated followers and fresh-cache reads do not emit duplicate Work Management success events;
- prefix invalidation/removal compares complete top-level key segments structurally, preventing TanStack's object-partial matching from widening existing invalidation scopes;
- synchronous repository mutation functions are adapted to TanStack's promise-based mutation function contract.

These compatibility rules are executable regression vectors, not documentation-only conventions.

## Compatibility boundaries

M8 intentionally does **not**:

- move authentication/session state into TanStack Query;
- replace the M7 Supabase client adapter;
- bypass repository DTO/runtime-schema validation;
- move Board domain invariants into query functions;
- rewrite the imperative Board UI to React hooks;
- introduce query persistence to localStorage/IndexedDB;
- introduce cross-tab cache broadcasting;
- create a new Supabase migration.

`assets/js/core/auth.ts` remains session authority, the M7 Supabase adapter remains provider transport authority, Zod/domain mappers remain runtime validation authority, and Supabase RLS/RPC policies remain database authorization authority.

## Certification

`npm run tanstack-query:check` verifies package/lockfile governance, Architecture Version 18, provider wiring, shared-client composition, compatibility facade ownership, release-gate participation, historical architecture-verifier synchronization, and executable server-state vectors.

`npm run stage-b:certify` promotes M8 only after M7 is `active-certified`; the milestone reaches `active-certified` only after the complete production release gate succeeds.
