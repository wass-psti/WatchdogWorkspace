# Work Management App v1.43.2 — Shell Milestone 3 Release Status

## Milestone

**Shell Milestone 3 — Sections, Applications and Resource Navigation**

Baseline: `Work-Management-App-v1.43.2-Shell-M2-Primary-Sidebar-RC.zip`

## Verdict

**IMPLEMENTATION COMPLETE at the Shell M3 boundary.**

The primary host sidebar is no longer a flat route list. It now has a structured, Monday-inspired but Work-Management-native resource-navigation hierarchy while preserving the existing router, authentication, host application-access authorization, Board service/RLS boundary, embedded module runtimes, and application-scoped RBAC.

Production Vite artifact verification remains environment-blocked because the project-local Vite executable is not present in this container. `npm run build` returns `vite: not found`. Source/runtime/browser verification is otherwise green.

## Implemented scope

### Persistent primary navigation

The M2 top-level destinations remain authoritative and unchanged in capability:

- Applications
- Boards
- Search / command palette
- Users when the authenticated host role can manage users
- Settings
- Account when cloud account mode is enabled

No unsupported `My Work` route or Monday-specific product destination was introduced.

### Collapsible resource sections

The expanded/mobile sidebar now has three persisted resource sections:

1. **Favorites**
2. **Applications**
3. **Boards**

Section open/collapsed state is stored under:

`wm.platform.shell-sections.v1`

This is host presentation state only. It is not Board state, module business state, authentication state, or RBAC state.

### Favorites

Favorites reuse the existing Work Management platform preference model (`preferences.v1`) and the same application IDs already used by the Applications workspace.

No second favorites store was introduced.

Current favorite support therefore applies to registered applications because the existing preference contract stores module IDs. Board favorites were not fabricated.

### Applications resource navigation

The Applications section renders directly from the authoritative `config/modules.ts` registry.

Each application row uses:

- registered application identity/name
- registered accent/icon
- application eyebrow/context
- current host-level module role
- host `auth.canAccessModule(...)` access decision
- direct route to the existing isolated module host
- favorite indicator from the existing preference store

Restricted applications remain visible as disabled/discoverable resources with `aria-disabled="true"`; visual hiding is not used as authorization.

Opening TimeTracker, FuelTrack+, or TradeLink continues to use the persistent M2 Work Management shell and the existing iframe/module-host runtime.

The active embedded application now receives an explicit active resource state in the sidebar.

### Board resource navigation

The Boards section uses the existing typed Board domain service:

`platformServices.boards.service.list('active')`

This means the sidebar does not introduce a parallel Board transport, local mirror, or client-side authorization model. The existing backend/RLS/user scope remains authoritative.

The section shows up to ten recently updated accessible Boards and guarantees inclusion of the currently open Board when it is outside that first window. The top-level Boards destination remains available for the complete Board collection.

Board resource loading has explicit states for:

- signed-out/cloud-unavailable
- loading
- empty
- loaded
- recoverable failure

The existing query-client caching/invalidation remains authoritative, so normal Board mutation invalidation can refresh the sidebar resource view without creating a second cache.

### Sidebar-local resource search

A dedicated compact search field filters the current sidebar application and Board resources.

It intentionally does **not** replace or duplicate the global Work Management command palette/search command.

Search behavior:

- filters application and Board resource labels locally
- exposes a clear control
- temporarily expands matching collapsed sections
- restores the user's persisted collapse state after the search is cleared
- shows an explicit no-navigation-matches state

### Compact/tablet strategy

At the semantic 60px compact width, the sidebar avoids duplicate/crushed information:

- resource search is hidden
- Favorites is hidden
- Board child resources are hidden
- Applications remains directly launchable as icon-first resources
- persistent top-level Boards/Search/Settings/etc. remain available

The same strategy is used by the 621–900px tablet rail.

### Mobile drawer strategy

The M2 off-canvas mobile drawer restores the full M3 hierarchy:

- search
- Favorites
- Applications
- Boards
- metadata/copy
- touch-safe resource rows

The existing M2 focus containment, backdrop, Escape handling, workspace inertness, body-scroll locking, and focus restoration remain intact.

## Semantic foundation added

Shell M3 adds roles for:

- 32px section header
- 40px desktop resource row
- 48px coarse-pointer resource row
- 24px resource icon
- 34px desktop resource search
- 14px section chevron
- semantic section-count geometry

These extend the Shell M1 foundation rather than creating component-local geometry.

## Accessibility

M3 includes:

- native buttons for section toggles and resources
- `aria-expanded` + `aria-controls` for collapsible sections
- `aria-current="page"` for the active application/Board resource
- `aria-disabled="true"` plus disabled native controls for restricted applications
- visible focus rings
- 44px+ coarse-pointer controls and 48px resource rows
- reduced-motion handling
- forced-colors selected/focus treatment
- ellipsis/overflow containment for long application and Board names

## Verification

The following gates pass in this source tree:

- `npm run typecheck` — PASS
- `npm run verify:types` — PASS
- `npm run verify:vite` static architecture — PASS
- `npm run verify:hardening` — PASS
- Boards M1–M8 verification — PASS
- Shell M1 verification — PASS
- Shell M2 verification — PASS
- **Shell M3 verification — PASS**
- TimeTracker v2 pass 1 — PASS
- TimeTracker v2 pass 2 — PASS
- `npm run verify:ui` — PASS
- `npm run verify` — PASS
- **`npm run check` — PASS**
- Chromium functional/regression suite — PASS
- 1600px / 1366px / 1120px desktop — PASS
- 820px tablet compact rail — PASS
- 720px 200%-zoom equivalent — PASS
- enlarged text — PASS
- 390px narrow mobile drawer — PASS
- coarse pointer — PASS
- light/dark — PASS
- reduced motion — PASS
- forced colors — PASS
- Boards regression suite — PASS
- TimeTracker regression suite — PASS
- FuelTrack+ regression suite — PASS
- TradeLink regression suite — PASS

### Shell M3 browser assertions

The browser suite specifically protects:

- semantic M3 search height
- semantic desktop resource-row height
- semantic section-header height
- current-resource semantics
- compact search removal
- compact duplicate-section removal
- compact direct application access
- icon-first compact resource rendering
- tablet direct application access
- mobile restoration of resource search
- mobile Favorites/Boards sections
- touch-safe mobile resource rows

## Production artifact boundary

This container does not contain `node_modules/.bin/vite`.

Explicit build attempt:

```text
> work-management-app@1.43.2 build
> vite build

sh: 1: vite: not found
```

Therefore the following are **not** claimed as passing here:

- `verify:dev`
- `build`
- `verify:dist`
- `verify:preview`
- complete `release:check`

Run on a dependency-enabled local environment:

```bash
npm ci
npm run release:check
```

## Exact M2 → M3 source delta

### Added

- `verify-v1432-shell-sections-resources-sm3.mjs`
- `RELEASE-STATUS-v1.43.2-SHELL-M3-SECTIONS-APPLICATIONS-RESOURCES.md`

### Modified

- `assets/css/foundation/tokens.css`
- `assets/css/shell-navigation.css`
- `assets/js/app.ts`
- `package.json`
- `tests/browser/run-cdp.mjs`
- `verify-rbac-user-management.mjs`
- `verify-v1432-shell-primary-sidebar-sm2.mjs`
- `CHECKSUMS.sha256` (regenerated during packaging)

### Removed

None.

The two historical verifier updates preserve their original guarantees while recognizing the newer route-aware Shell M3 markup; they do not weaken RBAC or M2 persistent-shell requirements.

## Unmodified architecture boundaries

No source changes were made to:

- TimeTracker application source
- FuelTrack+ application source
- TradeLink application source
- Supabase schema/migrations/RLS/RPC definitions
- Board repository
- Board domain service
- Board command service
- authentication transport/session implementation
- module authorization policy
- module data bridge

## Temporary compatibility boundaries

### Legacy shell CSS

Historical shell/mobile rules remain in lower-priority legacy stylesheets. `assets/css/shell-navigation.css` remains authoritative for Shell M1–M3. Final safe removal remains Shell M8 work.

### Favorites data model

The existing platform preference contract favorites registered **applications** only. Board favorites were not added as a frontend-only approximation. A future Board-favorites feature would require an explicit persistence/product decision.

### Board resource window

The sidebar intentionally renders a bounded recent Board window rather than virtualizing an unbounded list. The complete Board collection remains available through the top-level Boards route. Virtualization is unnecessary at the current sidebar scale and is not an M3 blocker.

### Add actions

No fake `Add application` or workspace-creation action was introduced. The application registry is static/configured, and Board creation remains owned by the Boards feature where its authorization and configured-schema workflow already exist.

### Resizing/pinning

Arbitrary-width resizing, pinning behavior, keyboard resize, and persistence beyond M2 expanded/compact state remain Shell M4 scope.

### Account menu

The Account destination remains the existing route. The Monday-inspired avatar/profile popup remains Shell M5 scope.

## Remaining shell roadmap

Shell M3 has no unfinished modules inside its defined scope.

Remaining milestones:

1. Shell M4 — Resizing, Pinning and Navigation Microinteractions
2. Shell M5 — Account/Profile Menu Reconstruction
3. Shell M6 — Global Overlay and Menu Harmonization
4. Shell M7 — Responsive and Accessibility Finalization
5. Shell M8 — Production Integration and Legacy Cleanup

## Blockers / unresolved risks

There is no code-level blocker for Shell M3.

The only current release blocker is the missing local Vite dependency in this execution environment. Production artifact promotion remains conditional on successful `npm ci && npm run release:check` in a dependency-enabled environment.
