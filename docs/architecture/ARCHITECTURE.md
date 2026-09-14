# Work Management Architecture

Current platform architecture: **Architecture Version 35**.

Stage C Milestone 14 established **Architecture Version 24**. React 19.2 now owns the global command palette, global toast presentation, and service-worker update banner through `src/app/shared-ui/SharedApplicationUI.tsx`, backed by the external-store bridge in `src/app/shared-ui/shared-application-ui-runtime.ts`. The typed `assets/js/features/commands/command-registry.ts` remains the command-definition, visibility, and execution authority; `assets/js/features/commands/index.ts` is reduced to a thin trigger/registry adapter. M11 `global-overlay-runtime.ts` remains the page-lifetime cross-feature overlay-exclusivity authority, while M13 Account / Settings / User Management and all Supabase Auth/RPC/RLS boundaries remain unchanged.

Stage C Milestone 13 advances the platform to **Architecture Version 23**. React 19.2 now owns the authenticated Account, Settings, and User Management route presentation through `src/app/management/AuthenticatedManagementUI.tsx`, with safe transient route state and service bridging in `src/app/management/authenticated-management-ui-runtime.ts`. `assets/js/core/auth.ts` remains Supabase Auth/profile/password/session/user-administration authority; `assets/js/core/platform.ts` and `assets/js/core/backup.ts` remain Settings and recovery authorities; **TanStack Query** remains the user-directory server-state owner. The M10 legacy route-content island remains page-lifetime mounted but hidden and inert while these M13 routes are active.

Stage C Milestone 12 advances the platform to **Architecture Version 22**. React 19.2 owns the persistent host shell (`src/app/shell/WorkManagementShell.tsx`), the page-lifetime global overlay host (`src/app/overlays/GlobalOverlayHost.tsx`), and now the standalone authentication presentation (`src/app/auth/AuthenticationUI.tsx`). The framework-neutral `src/app/auth/authentication-ui-runtime.ts` coordinates authentication-route presentation state while `assets/js/core/auth.ts` remains Supabase Auth/session/token/profile authority. M9 Zustand remains shared client-state authority, M8 TanStack Query remains server-state authority, and Supabase remains persistent-domain/RLS authority.

Stage C M11 established **Architecture Version 21** with `GlobalOverlayHost.tsx`; that historical ownership contract remains active beneath M12. Stage C M10 established the `WorkManagementShell.tsx` host and stable legacy route-content island. During M12 authentication routes, that legacy host remains page-lifetime mounted but is hidden and inert rather than becoming a competing presentation owner.

Stage B Milestone 7 advances the current platform to **Architecture Version 17**. The Work Management browser now has a single typed Supabase client adapter (`assets/js/platform/data/supabase-client-adapter.ts`) beneath the authenticated transport and repository boundaries. It centralizes project-origin validation, publishable-key/bearer headers, Auth/PostgREST/RPC/private-Storage dispatch, signed-URL resolution, timeout/cancellation composition, and provider-error normalization. `AuthManager` remains the session lifecycle authority and Supabase RLS/protected RPCs remain the server-side authorization authority.

Stage B Milestone 6 established **Architecture Version 16** with the Work Management-owned Zod runtime-schema authority. M7 preserves that schema boundary and adds the provider-transport seam beneath it.


v1.43.2 production hardening retains **Architecture Version 15** while adding defense-in-depth at external-data, session-revalidation, SQL authorization, transport timeout, diagnostics, and public-build boundaries. The v1.42 TypeScript architecture remains authoritative; this phase hardens its production behavior rather than introducing another migration layer.
v1.42.0 establishes **Architecture Version 15** and completes the controlled Work Management shell/UI TypeScript migration. Authentication/session, backup/restore, embedded-module host integration, shell/navigation, shared presentation contracts, Boards rendering and interaction controllers, Item Workspace, overlays, and motion infrastructure are TypeScript-authoritative. The v1.41 behavioral baseline remains the compatibility reference; the internal UIs of TimeTracker, FuelTrack+, and TradeLink remain isolated same-origin JavaScript compatibility islands behind typed host contracts rather than being rewritten as part of this release.

v1.41.0 established **Architecture Version 14** for the remaining non-visual TypeScript runtime boundary, while v1.39.0 established **Architecture Version 13** for the TypeScript composition/controller/domain-service layer.

## Purpose

Work Management is a progressively modernized modular platform, not a collection of pages sharing a global script. Earlier architecture phases established the runtime gateway, feature registry, route ownership, application lifecycle, module host, domain configuration boundaries, design tokens, browser integration verification, motion architecture, Board workflow/controller boundaries, grouped Board sheet, and configurable Status system.

v1.35.0 added the first shared **platform infrastructure layer** around transport, server state, authorization policy, overlay lifecycle, runtime errors, diagnostics, and extensible Board schemas. v1.36.0 adds the package/build boundary around that architecture with **Vite 8**, deterministic production bundles, source maps, environment conventions, and build-generated service-worker assets.

The modernization remains incremental and static-host compatible. No UI-framework rewrite or v1.36 database migration is required.

## Layer model


### 0. Build and delivery pipeline

`src/main.ts` is the Vite-owned browser composition entry. `vite.config.js` owns deployment base handling, production chunking, source maps, emitted asset naming, static embedded-module compatibility copies, and service-worker cache-manifest generation.

The shell is bundled and optimized. TimeTracker, FuelTrack+, and TradeLink remain route-lazy same-origin iframe runtimes during this phase so build-system adoption does not require simultaneous domain rewrites.

Public browser environment values use `VITE_*`; secrets remain server-side. The default relative base keeps GitHub Pages/subdirectory deployments viable.

### 1. Foundation and design system

`assets/css/foundation/` owns semantic tokens, themes, primitives, accessibility defaults, spacing, typography, focus behavior, and shared visual contracts. Feature CSS consumes these contracts rather than defining independent theme systems.

### 2. Runtime gateway and composition root

`assets/js/runtime/index.ts` is the shell dependency gateway.

`assets/js/runtime/platform-services.ts` is the authoritative platform composition root. Obsolete paired JavaScript compatibility entries have been removed now that Work Management consumers import TypeScript authorities directly. Cross-cutting services are constructed once and injected or registered through the internal Work Management runtime client.

### 3. Platform infrastructure

`assets/js/platform/`

- `errors/app-error.ts` — authoritative normalized application errors;
- `observability/diagnostics.ts` — bounded, sanitized local diagnostic events;
- `data/query-client.ts` — authoritative server-state caching, stale-time policy, request de-duplication, invalidation, and mutation contracts;
- `data/supabase-client-adapter.ts` — authoritative Supabase project transport adapter for Auth/PostgREST/RPC/private Storage and signed URLs;
- `data/backend-client.ts` — Work Management authenticated RPC/private-Storage facade, diagnostics, error classification, and external-data validation boundary;
- `auth/permissions.ts` — authoritative capability vocabulary and exhaustive role-to-capability mapping;
- `ui/global-overlay-runtime.ts` — page-lifetime global root-overlay ownership, root/toast portal resolution, and cross-feature exclusivity;
- `ui/overlay-manager.ts` — feature-scoped branch adapter for focus restoration, Escape/outside dismissal, parent-child branches, and click-through suppression.

Platform infrastructure is framework-neutral and contains no feature-specific presentation.

### 4. Runtime ownership

`feature-registry.ts`, `route-controller.ts`, `application-lifecycle.ts`, and `error-boundary.ts` define ownership and recovery:

1. parse route;
2. enforce authentication/account policy;
3. resolve route owner from the manifest;
4. activate/deactivate feature ownership only when required;
5. dispatch the route renderer through a recoverable error boundary;
6. keep long-lived browser events in a disposable lifecycle unit.

### 5. Feature/domain boundaries

`assets/js/features/`

- Auth
- Home / Commands
- Account — React-owned M13 authenticated management presentation
- Settings — React-owned M13 authenticated management presentation
- User Management / Roles — React-owned M13 presentation with TanStack Query directory state
- Boards
- Module registry/host integration

A feature facade exposes its public runtime surface. Controllers/workflows own behavior; views own presentation; repositories own domain persistence access. Features do not import another business module's implementation.

### 6. Repository/data boundaries

Boards is the first migrated repository:

```text
Board view/controller
  -> Board repository
       -> query client
       -> backend client
       -> response contracts
            -> Supabase RPC / private Storage
```

`assets/js/core/boards.ts` is a typed feature-facing Board gateway and no longer owns transport details.

Future Attendance, Fuel, Trade Document, Role, and Profile repositories should follow the same direction.

### 7. Board/grid architecture

Boards retains its established grid engine and interaction controllers. v1.35 established the seams; v1.38 makes these Board data/schema seams TypeScript-authoritative:

- `data/board-repository.ts`;
- `data/board-contracts.ts`;
- `grid/column-type-registry.ts`;
- `status-labels.ts`;
- shared overlay-manager adoption;
- capability-based Board policies.

The registry becomes the extension point for future column renderers/editors/validators instead of expanding global conditionals.

### 8. Embedded applications

TimeTracker, FuelTrack+, and TradeLink remain isolated same-origin application runtimes behind the typed `module-host.ts`, identity bridge, cloud store, domain config, and authenticated module bootstrap boundaries. Their internal application scripts remain intentionally isolated compatibility islands for this release.

This boundary is also a practical loading boundary: embedded application code is not initialized until its module route opens. Internal domain decomposition can proceed without destabilizing the shell.

### 9. Persistence and state ownership

- **Server state:** repositories + TanStack Query; never copied into Zustand.
- **Authentication/session state:** Work Management auth runtime + Supabase Auth; never copied into Zustand as authority.
- **Persistent application/domain state:** Supabase-backed domain stores/RPCs/Storage.
- **Persistent shell preferences:** explicit local preference persistence hydrates the live Zustand shell slice; persistence and client runtime ownership remain separate.
- **Shared client state:** scoped Zustand service for shell navigation presentation, section expansion mirror, and shell resource-search state.
- **Local UI state:** feature/controller scope; Board selection/editor state and Home filters remain local.
- **Form state:** owning form/workflow controller.
- **Derived state:** computed from authoritative inputs, not redundantly persisted.

Backend RLS/RPC enforcement remains authoritative. Client capabilities improve UX and consistency but never replace server authorization.

### 10. Testing and release gates

The repository maintains static verifiers, domain release checks, and a real Chromium/CDP integration suite. v1.35 adds architecture-contract checks for server-state behavior, policy mappings, repositories, transport isolation, overlay reuse, column registry extensibility, diagnostic redaction, runtime asset registration, and release-version consistency.

The package/build-tooling phase is established with Vite. Stage F M30 now introduces Vitest 5 + Testing Library + jsdom for governed unit/component testing while retaining bounded-CDP real-browser verification and M29 pgTAP database/RLS testing as specialized authorities.

## Dependency direction

```text
index.html
  -> src/main.ts (Vite entry)
       -> foundation/design system
       -> shell
       -> runtime gateway
            -> platform services
            -> feature registry / route controller / lifecycle / error boundary
            -> feature facade
                 -> controllers + workflows + views
                 -> repository
                      -> query client
                      -> backend client
                      -> domain contracts

module route
  -> module host
       -> identity + cloud-store boundary
       -> domain-config
       -> embedded domain runtime
```

Dependencies flow inward toward stable contracts. Transport/vendor details do not flow upward into views.

## Compatibility strategy

Work Management uses a strangler migration:

- preserve routes, IDs, persisted values, RLS/RPC business rules, and public feature behavior;
- create stable interfaces before moving implementation;
- redirect consumers to typed authorities through bounded migration seams;
- verify equivalence with behavior tests;
- remove obsolete paths only after all consumers migrate;
- avoid business-data migrations for architecture-only changes.

For the platform evaluation see `PLATFORM-MODERNIZATION-v1.35.md`. For the package/build migration see `VITE-MIGRATION-v1.36.md`. For the completed Work Management UI migration and verification boundary see `TYPESCRIPT-UI-RUNTIME-v1.42.md` and `TYPESCRIPT-UI-RUNTIME-VERIFICATION-v1.42.md`.


## Stage D M20 — Board collaborative Realtime

Architecture Version 28 introduces Board-scoped collaborative synchronization through private Supabase Realtime Broadcast + Presence. Database triggers emit metadata-only `board-change` signals to `board:<uuid>` topics after canonical Board mutations; clients never treat those payloads as domain state. The typed Board Realtime controller coalesces change bursts, defers convergence while an explicit inline editor or Board drag interaction is active, invalidates TanStack Query-backed Board state, and refetches the canonical Board/Item Workspace through the existing authorized RPC/repository boundary. Realtime Authorization delegates topic access to `public.work_board_access(...)`; browsers can receive Broadcast/Presence and track Presence but cannot originate authoritative Broadcast changes. Heartbeat, JWT/RLS refresh, bounded reconnect, degraded fallback polling, route disposal, and an accessible Board live-status surface are part of the M20 runtime contract. M18 virtualization and M19 drag/drop remain authoritative. M20 requires the dedicated Supabase Realtime migration.

## Stage D M19 — Drag-and-drop evaluation

Architecture Version 27 is intentionally unchanged for M19. M19 evaluates `@dnd-kit/react` 0.5.0 and `@dnd-kit/dom` 0.5.0 against the certified Work Management Board drag requirements while retaining the existing item and structural drag controllers as production authorities. The adoption decision remains `defer-production-adoption`; no dnd-kit package is installed and no database migration is introduced by M19.

## Stage D M18 — Virtualization

Architecture Version 27 introduces conditional Board Table row and column windowing without adopting TanStack Table or an external virtualization dependency. The typed virtualization planner computes bounded row/column windows and spacer geometry; the Board runtime controller synchronizes those windows with page and horizontal scroll positions and reveals logical keyboard targets before focus moves. Fixed selection/drag/Item/action columns remain mounted. Wrapped columns disable row virtualization because they can produce variable-height rows. M18 improves DOM scalability for already-loaded data; server-side pagination/filtering/sorting and incremental loading remain separate data-layer concerns. No Supabase migration.

## Stage D M17 — TanStack Table evaluation

Architecture Version 26 is intentionally unchanged for M17 because this milestone adds no production runtime authority. M17 evaluates `@tanstack/react-table` 9.2.4 through a typed compatibility profile in `src/app/boards/evaluation/`, classifying current Board requirements as native, adapter-backed, or external to the table library. The decision is `defer-production-adoption`: the headless table model is a viable future candidate, but Board groups, typed editors, drag/drop, optimistic history, keyboard accessibility, overlay/Item Workspace behavior, TanStack Query server state, and Zustand/preference ownership remain Work Management authorities. The production Board Table renderer and M16 compatibility host are unchanged. No Supabase migration.

## Stage D M16 — Board component decomposition

Architecture Version 26 decomposes the M15 React Board facade into focused typed presentation components. `BoardPresentationFacade.tsx` remains the route-level entrypoint, `BoardPresentationRouteBoundary.tsx` owns route-to-component derivation, `board-presentation-model.ts` owns the exhaustive inactive/collection/workspace presentation model, and `BoardPresentationSurface.tsx` owns the single stable compatibility host. The existing typed `assets/js/boards-ui.ts` engine continues to own imperative Board descendants and interaction behavior; Board services, commands, repository, TanStack Query, Zustand, RBAC, Supabase, and M11 overlay authority remain unchanged. No Supabase migration.

## Stage D M15 — React Board presentation facade

Architecture Version 25 gives React route-level ownership of Boards through `src/app/boards/BoardPresentationFacade.tsx`. The existing typed `assets/js/boards-ui.ts` engine remains a compatibility presentation engine behind the dedicated host; Board services, commands, repository, TanStack Query, RBAC, Supabase, and M11 overlay authority remain unchanged. No Supabase migration.


## Stage D M21 — Rich Item Workspace

Architecture Version 29 expands the Board Item Workspace into a typed rich work surface while preserving the canonical Board repository/RPC authority established by earlier milestones. The drawer now exposes an Overview tab alongside the certified Updates, Files, and Activity tabs. Overview surfaces core item fields and visible custom Board properties through explicit-save typed controls; no property commits on blur. Update drafts survive Item Workspace rerenders and tab changes, and the Files surface accepts both the existing file picker and drag-and-drop input while retaining the private Supabase Storage contract and 20 MB client limit. All property writes continue through the existing Board command service (`updateItem` / `setCell`), and M20 Realtime remains an invalidation/refetch transport rather than a second state store. No Supabase migration or new dependency is required for M21.


## Stage E M22 — Normalized module data foundation

Architecture Version 30 introduces a canonical module-data registry and typed normalized module-data service spanning TimeTracker, FuelTrack+, and TradeLink. Canonical keys translate to the existing authorized Supabase module-state RPC keys; no parallel persistence authority is introduced. Existing same-origin iframe runtimes and WMModuleStore remain compatibility islands for later Stage E replacement. Malformed/unmapped legacy state is preserved and surfaced, expected-revision concurrency is retained, and FuelTrack+ activity workspace state is explicitly normalized as user-scoped.


## Stage E M23 — TimeTracker stabilization

Architecture Version 31 stabilizes the existing TimeTracker embedded runtime before later Stage E island replacement. Clock form Location/Department selection is user-scoped only and no longer writes the shared attendance ledger. Administrative attendance corrections/deletions and all OT workflow mutations confirm cloud persistence before success and roll back local state on failure. TimeTracker listens to both native storage events and the embedded module-store fallback event. Launch-time automatic Clock Out and automatic GPS association refresh authoritative attendance after obtaining their distributed operation locks, preventing stale cross-device writes. The existing attendance policy, Work Management identity/RBAC authority, M22 normalized data registry, same-origin iframe boundary, and Supabase contracts remain unchanged. No new dependency or Supabase migration is required.
## Stage E M24 — FuelTrack+ stabilization

Architecture Version 32 stabilizes the existing FuelTrack+ v3.17.0 wm6 compatibility runtime before later Stage E iframe retirement. `apps/fueltrack-plus/app.v3.17.0-wm6.js` remains the production application authority and consumes the pre-bootstrap `stability-runtime.js` for confirmed state writes, duplicate-mutation gates, conflict-divergence detection, and native/fallback module-store synchronization. Request creation, approval transitions, deletion, and refueling completion recover authoritative cloud state when persistence cannot be confirmed rather than restoring stale local snapshots. Refresh obtains current module state before hydration and still defers non-forced refreshes during active editing/dialog workflows. Analytics gains an exact-pinned Apache ECharts 6.1.0 same-origin Vite entry that is requested only when the Analytics route renders; the existing accessible HTML/CSS chart remains a non-fatal fallback. FuelTrack+ RBAC, request lifecycle rules, LightFuels semantics, Work Management identity, M22 normalized module data, existing Supabase RPCs, and the same-origin iframe boundary remain authoritative. M24 requires no Supabase migration.


## Stage E M25 — TradeLink stabilization

Architecture Version 33 stabilizes the existing TradeLink compatibility island without replacing its application model. `apps/tradelink/stability-runtime.js` adds keyed mutation gates, serial user-state queues, exact confirmed persistence, a module-scoped distributed workspace lock, and storage/module-store synchronization. The production `app.v1.42.0-wm1.js` refreshes authoritative shared state after lock acquisition before document numbering and critical workflow/recovery mutations, rejects stale `updatedAt` edits, and keeps active company/page-size/draft state user-scoped. Existing TradeLink RBAC/workflow, normalized Supabase module-state keys, and the same-origin iframe remain authoritative compatibility boundaries. M25 adds no dependency and no Supabase migration.

## Stage E M26 — Retire iframe compatibility where justified

Architecture Version 34 changes module isolation from a platform-wide `same-origin-iframe` assumption to a retirement-gated hybrid presentation model. `assets/js/runtime/module-presentation-host.ts` can delegate a retained module to the certified iframe host or mount a registered `native-host` adapter that consumes Work Management identity directly. `src/platform/contracts/module-presentation.ts` makes retirement conditional on native mount, root-scoped DOM, scoped styles, global-runtime isolation, direct identity/data consumption, browser-permission integration, lifecycle disposal parity, and native regression parity. M26 evaluates TimeTracker, FuelTrack+, and TradeLink against those gates and retires none: all three remain full-document compatibility applications and therefore retain same-origin iframe isolation. The host is ready for future native adapters, but iframe removal is never achieved by injecting legacy HTML/CSS/classic scripts into the shell DOM. No new dependency or Supabase migration is introduced.


## Architecture 35 — Stage F M27 Realtime platform

Stage F M27 promotes authenticated private-channel realtime into a platform-owned service. `assets/js/platform/realtime/realtime-platform.ts` owns topic validation, reference-counted channel acquisition, bounded channel lifecycle, shared access-token refresh, health snapshots, and disposal. `assets/js/runtime/platform-services.ts` composes that authority once and injects it into feature adapters.

The existing Board realtime domain remains the first production consumer. Its M20 Supabase Broadcast/Presence RLS and database-trigger event authority remain unchanged; only client-side transport ownership moves from the Board feature to the platform. The `module` and `platform` topic namespaces are reserved but disabled until explicit server authorization/event producers are introduced. TimeTracker, FuelTrack+, and TradeLink therefore retain their M26 iframe/local-runtime compatibility boundaries in M27.


## Architecture 36 — Stage F M28 Edge Functions

Stage F M28 establishes a governed Supabase Edge Function boundary for trusted server-only operations. `assets/js/platform/data/edge-function-client.ts` is the only browser invocation authority and permits only typed, registered function names. `supabase/functions/admin-sync-auth-access` provides the first production function: it requires a user JWT, revalidates the caller against the live active Admin/General Manager profile policy, enforces an exact browser-origin allowlist, and uses server-only Supabase Auth administrative credentials to synchronize ban/unban state.

The certified browser user-management RPC remains the role/status mutation authority until the Edge Function is deployed and a production cutover is explicitly certified. This avoids making the static GitHub Pages client depend on an undeployed server function while preserving Architecture 36's trusted server boundary.


## Architecture 37 — Stage F M29 Database/RLS test suite

Stage F M29 establishes a disposable local Supabase + pgTAP authority for database/RLS certification. The schema snapshot is bootstrapped into an isolated local stack; 16 public RLS tables and account/RBAC, module-state, Board, and Realtime authorization behavior are covered by 87 transactional assertions. Sensitive profile/module-role mutations are RPC-only, anonymous SECURITY DEFINER execution is hardened, and Board access fails closed. Production/linked database mutation is forbidden during certification.


## Architecture 38 — Stage F M30 Modern testing stack

Stage F M30 adds a governed modern host-platform test layer based on Vitest 5, jsdom 27.4, React Testing Library 16, Testing Library user-event 14, jest-dom 7, V8 coverage, and Playwright 1.63. The initial baseline covers route-policy decisions, Board virtualization planning, Zustand shell client-state semantics, accessible React button interactions, and a real Work Management login-composition browser smoke through five files, 23 test cases, and 74 explicit assertions. Testing-only tools are exact-pinned and bootstrapped ephemerally with package manifest/lockfile immutability checks, so the certified application package-lock remains unchanged. M29 pgTAP remains an independent database certification authority. Playwright becomes the modern browser-test layer while the bounded-CDP harness remains a temporary parity backstop; M30 does not claim jsdom equivalence to database or browser-runtime behavior.

## Architecture 40 — Stage F M32 Observability

Architecture 40 adds a vendor-neutral client observability authority on top of the certified M31 performance layer. The host runtime owns bounded structured telemetry for logs, counters, histograms, spans, exceptions, and browser performance signals. Diagnostics are bridged into this stream, backend RPC/storage and Edge Function calls emit correlated spans, and browser-level error/performance observers attach at host bootstrap. Telemetry is memory-first, redacted before buffering, not persisted in browser storage, and has no configured production exporter by default. Remote export remains an injectable deployment adapter so telemetry network/CSP policy can be certified separately from the core runtime.


### Architecture 41 — Service worker / update strategy

The host service worker now uses deterministic build-scoped cache identities and explicit user-controlled waiting-worker activation. Browser registration bypasses HTTP cache during worker/import updates, foreground/online checks are throttled, navigation preload is enabled best-effort, and controlled tabs converge through controller-change reload after accepted updates.

## Architecture 44 — Stage F M36 Production cutover certification

Stage F M36 establishes the final governed production-cutover authority without changing business-domain behavior. Architecture 44 binds the exact source baseline to a dependency-locked full release gate, a fail-closed production `dist/` verifier, SHA-256 artifact manifest, cutover provenance record, GitHub Pages dist-only deployment, post-deploy HTTPS smoke, and an explicit last-known-good redeploy rollback model. The M36 artifact verifier uses executable-reference semantics: it rejects real production dependencies on source entrypoints and development hosts while allowing source-identity metadata and localhost/loopback validation/fallback values that do not themselves load a resource. M36 preserves M26 module iframe islands, the M28 protected RPC authority until its Edge Function is externally deployed/enabled, M30 bounded-CDP browser parity, and M34 infrastructure-owned backup/PITR obligations as certified live boundaries rather than deleting or bypassing them.


## Architecture 45 — Functional Regression Baseline

Stage G M37 adds a governed characterization/evidence layer for Boards, Users, Settings, and Account. It does not change their domain authority or claim remediation; it makes runtime, network, auth, route, and DOM ownership failures reproducible before M38+ repair work.

## Stage G M38 — Runtime Configuration & Backend Capability Preflight
Architecture 46 adds an authenticated backend-capability gate before backend-dependent route exposure. Public Supabase configuration is environment-separated and atomic; the checked-in fallback is intentionally unconfigured. `public.wm_runtime_capabilities()` verifies required tables, authenticated-executable RPCs, the private Board Storage bucket, Board Realtime policies/topic authorization, and canonical broadcast triggers. Account, Users, Settings, Boards, TimeTracker, FuelTrack+, and TradeLink are gated independently so a missing capability produces an explicit diagnostic rather than an inert module.
