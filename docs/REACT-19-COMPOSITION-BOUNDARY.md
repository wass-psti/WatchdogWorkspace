# React 19.2 Composition Boundary

## Scope

Stage B Milestone 3 establishes React 19.2 as the target frontend composition runtime without converting established Work Management feature rendering ahead of the planned migration sequence.

React owns only the root `#app` DOM container. The existing imperative TypeScript shell is mounted beneath it into a dedicated `[data-wm-legacy-runtime-host]` container through `LegacyApplicationBoundary`. This prevents React and the legacy renderer from mutating the same DOM ownership surface.

## Dependency direction

`src/main.ts` → React composition root → legacy runtime adapter → `assets/js/app.ts` → existing feature/controllers/services.

The legacy runtime may resolve its assigned DOM host through the small `legacy-host.ts` contract. Feature modules do not import React. React components do not bypass existing domain services, repositories, authentication, RBAC, routing, query-cache, Supabase, or embedded-module contracts.

## Compatibility boundary

The legacy shell remains a page-lifetime singleton. React Strict Mode is intentionally not enabled in Milestone 3 because the current shell installs page-level listeners and service-worker/lifecycle hooks without an unmount contract. Enabling development double-mount semantics before those listeners become disposable would create duplicate side effects.

This is a temporary boundary, not the final architecture. Later Stage B milestones can move individual presentation surfaces into React while preserving the existing service/repository/RLS authorities.

## Non-goals

Milestone 3 does not:

- convert Boards, Authentication, Account, Settings, Home, User Management, or embedded applications to React;
- introduce Chakra UI, Ark UI/Zag, TanStack Query, Zod, Zustand, dnd-kit, Floating UI, React Hook Form, Motion, Lexical, ECharts, or other later target-stack packages;
- replace existing Supabase authentication, PostgreSQL/RLS authorization, repositories, Board domain services, query cache, route policy, or module-host contracts;
- change persisted data formats, routes, role semantics, module access policy, or application behavior;
- enable React Server Components or a server-rendered runtime.

## M3 acceptance invariants

1. React and React DOM are exact-pinned to the governed React 19.2 line.
2. `#app` is owned by a React `createRoot` composition root.
3. The legacy renderer owns only `[data-wm-legacy-runtime-host]`.
4. The legacy application is loaded through one typed, singleton adapter.
5. Existing features do not gain direct React dependencies in this milestone.
6. Existing platform/domain/backend behavior remains authoritative and unchanged.
7. Strict TypeScript, package governance, security checks, and existing verifiers remain release gates.
8. A clean dependency install, Vite build, dist verification, browser regression suite, and preview verification remain required before production certification.
