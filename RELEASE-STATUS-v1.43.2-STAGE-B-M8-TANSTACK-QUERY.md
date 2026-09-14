# Release Status — Work Management v1.43.2 — Stage B M8 TanStack Query Migration

## State

**Implementation complete; release certification pending on the packaged RC.**

M8 advances the application to **Architecture Version 18** and replaces the project-owned Map/promise server-state engine with TanStack Query v5.

The package carries forward the user-verified M6 and M7 `active-certified` prerequisite states from the successful M7 Architecture Verifier Synchronization certification run; M8 itself remains pending until its own complete release gate succeeds.

## Implemented

- exact-pinned `@tanstack/react-query@5.102.8` and lockfile graph;
- page-lifetime native `QueryClient` authority;
- React `QueryClientProvider` mounted above the existing design-system/legacy boundary;
- the same native client injected into platform services;
- existing Work Management `QueryClient` contract retained as a compatibility facade;
- TanStack-owned hashing, de-duplication, stale cache, invalidation, removal, mutation lifecycle and cache state;
- query `AbortSignal` exposed to compatibility query functions;
- pre-M8 query microtask timing retained across the compatibility facade;
- fresh-cache and in-flight follower event semantics retained without duplicate success notifications;
- legacy exact top-level prefix invalidation/removal semantics retained instead of adopting broader TanStack object-partial matching;
- synchronous repository mutation functions adapted to TanStack's promise-based mutation contract;
- Architecture Version 18 manifest/type/Zod schema contract;
- M8 activation/status/certification workflow;
- CI/deployment/governance synchronization gates;
- historical architecture verifier synchronization to Version 18;
- M8 execution-vector verifier;
- documentation and third-party notice updates.

## Verified before packaging

Static governance, manifest, source-ownership, verifier-synchronization, script-syntax, package-lock structural checks, archive checksum generation, and all verification gates that do not require downloading the new TanStack package are performed before delivery.

The complete release certification must run with the real npm dependency graph. `npm run stage-b:certify` is the authoritative promotion gate.

## Temporary compatibility boundaries

- Boards and the legacy shell still consume the Work Management `QueryClient` facade instead of React hooks.
- Authentication/session state remains outside TanStack Query.
- M7 remains the Supabase provider-transport authority.
- No persisted/offline TanStack cache is introduced.
- No cross-tab query broadcasting is introduced.

These are deliberate boundaries, not incomplete M8 work.

## Database

No Supabase migration is required for M8.
