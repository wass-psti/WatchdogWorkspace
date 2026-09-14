# v1.43.2 — Stage C Milestone 10 React Shell

**State:** active-certified  
**Architecture Version:** 20  
**Prerequisite:** Stage B M9 Client-state Ownership Model `active-certified`

## Implemented

- React 19.2 owns the persistent Work Management host-shell frame through `src/app/shell/WorkManagementShell.tsx`.
- The persistent sidebar, responsive/mobile shell chrome, workspace host semantics, overlay/toast roots, and shell accessibility structure are React-owned.
- `LegacyApplicationBoundary` is a memoized page-lifetime route-content island; React does not reconcile the imperative descendants inserted by existing feature renderers.
- `assets/js/app.ts` no longer creates the persistent shell at runtime. Existing host feature controllers publish shell presentation inputs through `shell-runtime-bridge.ts`.
- M9 Zustand remains shared client-state authority; M8 TanStack Query remains server-state authority; Supabase Auth remains session authority; Supabase remains persistent-domain/RLS/RPC/Storage authority.
- Architecture manifest/types/runtime schemas advance to Version 20 and explicitly identify React shell ownership plus the legacy route-content compatibility boundary.
- CI, deployment, package governance, aggregate verification, Stage C activation, and Stage C certification include the M10 gate.
- Vite dev/preview browser smoke includes the M10 ownership contract: exactly one React shell root, one React shell layout boundary, one legacy route-content host, and no authenticated shell exposure on the standalone login route.

## Verified in the implementation environment

The following dependency-independent verification has passed on the M10 tree:

- Stage C M10 runtime-bridge execution vectors.
- Stage C M10 architecture verifier.
- Stage A package-governance and security source gates.
- Stage B M3 React composition and M4/M5 source compatibility gates.
- Stage B governance synchronization.
- Complete historical `verify:ui` chain, including Boards M1–M8, Shell M1–M8, all shell collapse hotfix verifiers, and TimeTracker v2 Pass 1/Pass 2.
- TypeScript foundation source architecture gate.

The implementation container could not complete the exact lockfile installation because its npm package transport stalled. Therefore strict dependency-backed TypeScript, Vite build/dev/preview, Chromium, aggregate project verification, and the complete production `release:check` remain authoritative Mac certification steps.

## Temporary compatibility boundaries

- Dynamic Applications/Favorites/Boards resource navigation markup is temporarily serialized by the existing TypeScript host runtime and supplied to the React-owned `<nav>` through the M10 runtime bridge.
- Home, Boards, Settings, Account, User Management, authentication forms, command palette, TimeTracker, FuelTrack+, and TradeLink remain route-content/embedded compatibility islands for later Stage C milestones.
- The historical `shell(...)` serializer remains checked in only for older source-shape verifier continuity; runtime code does not invoke it.

## Database

No Supabase migration is required for M10.

## Strict optional typing certification hotfix

A Mac release-certification run identified TS2375 in `WorkManagementShell.tsx`: the shell explicitly supplied `undefined` to the optional `LegacyApplicationBoundary.className` prop while `exactOptionalPropertyTypes` is enabled. The M10 strict-optional hotfix omits the prop when the authenticated shell is inactive, preserving the strict boundary contract. No runtime behavior, ownership boundary, package dependency, or Supabase schema changes are introduced.


## Certified baseline note

The M10 consolidated browser-contract hardening baseline completed the governed `stage-c:certify` workflow, full `release:check`, dev/preview Chromium smoke, aggregate browser integration, and final M10 state verification. M11 starts from that certified snapshot; M10 remains `active-certified`.
