# Work Management App v1.43.2 — Shell Milestone 2 Primary Sidebar Reconstruction

## Status

Shell Milestone 2 is implementation-complete against the Shell Milestone 1 Navigation Foundation RC.

The host navigation is now a real persistent primary sidebar with expanded/compact desktop states, a compact tablet state, and an off-canvas mobile drawer. Embedded TimeTracker, FuelTrack+, and TradeLink routes now render inside the same host shell instead of replacing the Work Management sidebar with a separate module-only shell.

The full source/runtime/project regression gate (`npm run check`) passes. The only unexecuted production-artifact gates are Vite build/dist/preview because this execution environment does not contain the project-local Vite executable (`vite: not found`).

## Implemented scope

### Persistent host shell
- Rebuilt the actual `sidebarNavMarkup()`, `shell()`, and shell synchronization layer rather than creating a parallel navigation prototype.
- Work Management shell remains mounted while switching among native routes.
- Embedded application routes now also render inside the persistent host shell.
- Existing iframe isolation, identity publication, module authorization, module-host attachment, reload behavior, and route ownership remain authoritative.

### Desktop expanded/compact navigation
- Expanded state uses the Shell M1 semantic 256px default width.
- Compact state uses the semantic 60px rail.
- Explicit collapse/expand control is anchored at the sidebar boundary.
- Expanded/compact preference persists in `localStorage` under `wm.platform.shell-navigation.v1`.
- Workspace margin/width remain synchronized with sidebar width.
- Compact mode hides text/shortcuts while retaining accessible labels and native title tooltips.

### Primary navigation
The existing supported destinations remain authoritative:
- Applications
- Boards
- Search
- Users (permission-sensitive)
- Settings
- Account (cloud-mode sensitive)

No unsupported `My Work` route was invented.

### Tablet behavior
- 621–900px uses the compact 60px rail regardless of the stored desktop preference.
- Labels and nonessential sidebar metadata collapse to protect application workspace width.
- Primary route and authorization behavior is unchanged.

### Mobile drawer
The historical bottom navigation rail is no longer the authoritative mobile shell presentation.

At <=620px:
- workspace remains full width;
- a 44px fixed navigation trigger opens the sidebar;
- sidebar becomes a bounded vertical off-canvas drawer;
- backdrop closes the drawer;
- Escape closes the drawer;
- focus moves into the drawer when opened and restores to the launcher when closed;
- Tab/Shift+Tab are contained while the workspace is inert;
- route activation closes the drawer;
- body scrolling is locked while open;
- drawer respects safe-area insets;
- coarse-pointer navigation rows remain at least 44px.

A legacy shell-stability contract forces `transform:none!important` on persistent chrome. Rather than remove that guarantee, the mobile drawer uses fixed off-canvas positioning, preserving the historical no-transform shell invariant.

### Embedded application persistence
`renderModule()` now renders through `renderWorkspace()` instead of replacing `#app` with an isolated `module-shell` root.

This means the Work Management primary navigation remains visible on desktop/tablet and remains available through the mobile drawer while TimeTracker, FuelTrack+, or TradeLink is open.

The embedded iframe remains isolated and continues to use the existing module host, identity, authorization, and cloud-data bridge.

## Verification

Passed:
- `npm run typecheck`
- `npm run verify:types`
- `npm run verify:vite`
- `npm run verify:hardening`
- `npm run verify:ui`
- Shell M1 verifier
- Shell M2 verifier
- Boards M1–M8 verifiers
- TimeTracker v2 pass 1 and pass 2 verifiers
- full `npm run verify`
- full `npm run check`
- Chromium browser integration suite
- desktop 1600/1366/1120 layouts
- tablet 820 layout
- 720px 200%-zoom-equivalent layout
- enlarged 20px root text
- 390px narrow layout
- coarse-pointer narrow layout
- light and dark themes
- reduced motion
- forced colors
- explicit 256px expanded sidebar geometry
- explicit 60px compact sidebar geometry
- synchronized compact workspace offset
- vertical mobile drawer geometry
- mobile full-width workspace geometry
- 44px mobile launcher target
- open backdrop behavior
- closed off-canvas/hidden drawer state
- Board regressions
- TimeTracker regressions
- FuelTrack+ regressions
- TradeLink regressions

## New regression protection

Added:
- `verify-v1432-shell-primary-sidebar-sm2.mjs`

It is included in `npm run verify:ui` and protects:
- expanded/compact state runtime contracts;
- persisted shell state;
- primary sidebar markup and semantics;
- mobile drawer/open-dismiss behavior;
- persistent embedded-application shell integration;
- responsive/sidebar geometry;
- reduced-motion/forced-colors contracts;
- browser audit coverage;
- no Monday/Vibe runtime coupling;
- no remote visual dependencies;
- no `transition: all` introduction.

Historical compatibility verifiers were updated only where they encoded superseded markup/presentation assumptions:
- `verify-v1190-work-boards.mjs` now detects the Boards entry through the current typed navigation renderer instead of literal `<b>Boards</b>` HTML.
- `verify-v1432-ui-final-quality.mjs` now recognizes the vertical mobile drawer instead of requiring the retired horizontal bottom rail.
- `verify-v1432-shell-navigation-foundation-sm1.mjs` retains the Shell M1 foundation guarantees without requiring the old mobile-rail implementation.

## Compatibility boundaries retained

### Shell M3 boundary
Shell M2 intentionally does not yet create the Monday-style section/resource hierarchy. Favorites, application/resource section headers, application lists, contextual section search/actions, and Board/resource child navigation remain Shell M3 work.

### Shell M4 boundary
The M1 resizer primitive remains presentation-only. Pointer/keyboard sidebar width resizing, pinning, custom-width persistence, and higher-order navigation microinteractions remain Shell M4 work.

The Shell M2 expanded/compact preference is persisted separately from future arbitrary width persistence.

### Shell M5 boundary
Account remains an ordinary route entry. The Monday-inspired account/profile popover is not implemented in this milestone.

### Legacy CSS
Historical shell geometry remains in:
- `assets/css/app.css`
- `assets/css/foundation/application-migration.css`
- `assets/css/motion-design.css`

`assets/css/shell-navigation.css` loads later and is authoritative for Shell M1–M2 presentation. These older declarations remain for compatibility until the final shell cleanup milestone proves them removable.

### Application authorization
Work Management remains authoritative for authentication, user identity, and whether a user can access an embedded application.

TimeTracker, FuelTrack+, and TradeLink retain their existing independent application-scoped authorization models. No embedded-app RBAC was moved into the host sidebar.

### Monday/Vibe boundary
The supplied monday.com code remains design/interaction reference material only. No Monday/Vibe runtime, hashed vendor classes, CDN assets, React dependency, or vendor persistence model was introduced.

## Exact Shell M1 -> Shell M2 source scope

Modified:
- `assets/css/foundation/themes.css`
- `assets/css/foundation/tokens.css`
- `assets/css/shell-navigation.css`
- `assets/js/app.ts`
- `package.json`
- `tests/browser/run-cdp.mjs`
- `verify-v1190-work-boards.mjs`
- `verify-v1432-shell-navigation-foundation-sm1.mjs`
- `verify-v1432-ui-final-quality.mjs`
- `CHECKSUMS.sha256` (regenerated during packaging)

Added:
- `verify-v1432-shell-primary-sidebar-sm2.mjs`
- `RELEASE-STATUS-v1.43.2-SHELL-M2-PRIMARY-SIDEBAR.md`

Removed:
- none

No source modifications were made inside:
- `apps/time-tracker/`
- `apps/fueltrack-plus/`
- `apps/tradelink/`
- Supabase migrations/schema/RLS/RPCs
- Board repositories/domain services/command service
- authentication services
- module authorization policy

## Remaining shell roadmap

1. Shell M3 — Sections, Applications and Resource Navigation
2. Shell M4 — Resizing, Pinning and Navigation Microinteractions
3. Shell M5 — Account/Profile Menu Reconstruction
4. Shell M6 — Global Overlay and Menu Harmonization
5. Shell M7 — Responsive and Accessibility Finalization
6. Shell M8 — Production Integration and Legacy Cleanup

## Blockers / unresolved risk

There is no Shell M2 code-level blocker.

Production artifact generation remains environment-limited. `npm run build` currently returns:

```text
> work-management-app@1.43.2 build
> vite build

sh: 1: vite: not found
```

Therefore `build`, `verify:dist`, and `verify:preview` are not represented as passing in this environment.

On a dependency-enabled development machine run:

```bash
npm ci
npm run release:check
```

If that succeeds, no additional Shell M2 implementation pass is required.

## Milestone verdict

Shell Milestone 2 — Primary Sidebar Reconstruction: **IMPLEMENTATION COMPLETE**.

Source/runtime verification: **PASS**.
Full project regression: **PASS**.
Chromium responsive/accessibility regression: **PASS**.
Production Vite artifact validation: **pending dependency-enabled execution only**.
