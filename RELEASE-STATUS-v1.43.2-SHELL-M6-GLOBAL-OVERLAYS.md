# Work Management App v1.43.2 — Shell M6 Global Overlay and Menu Harmonization

## Release status

**Milestone:** Shell Milestone 6 — Global Overlay and Menu Harmonization  
**Baseline:** `Work-Management-App-v1.43.2-Shell-M5-Account-Profile-Menu-RC.zip`  
**Implementation status:** **COMPLETE within Shell M6 scope**  
**Source/runtime verification:** **PASS**  
**Production artifact verification:** **PENDING — local Vite executable unavailable in this execution environment**

Shell M6 harmonizes the Work Management host shell's transient UI without changing routing, authentication, host RBAC, embedded-application authorization, Board domain behavior, or Supabase persistence contracts. The milestone establishes one host-level floating-surface system for menus, submenus, account/profile overlays, and compact-navigation tooltips while preserving explicit parent/child overlay branches and existing feature-owned presentation where appropriate.

## Implemented

### Shared host floating-surface system

Added `assets/js/platform/ui/floating-surface.ts` as the host-level geometry/focus utility for anchored floating UI. It provides:

- viewport-aware fixed positioning;
- top/bottom and left/right collision flipping;
- semantic viewport gutter and anchor-gap handling;
- bounded width and height;
- placement metadata for presentation/motion;
- shared menu-item discovery;
- shared focus movement;
- shared typeahead behavior.

The corresponding `assets/css/shell-overlays.css` layer owns the generic host floating-surface presentation rather than duplicating menu shell geometry in individual features.

### Account/Profile and Appearance harmonization

The Shell M5 Account/Profile menu and Appearance submenu now consume the shared host floating-surface classes and positioning utility. Account-specific content remains owned by `shell-account-menu.css`, while generic positioning, border, radius, elevation, clipping, motion, reduced-motion, and forced-colors behavior are owned by the M6 overlay layer.

The existing authenticated identity, host RBAC, Account page, Settings theme preference store, and sign-out service remain authoritative.

### Accessible compact-navigation tooltips

Added `assets/js/platform/ui/tooltip-controller.ts` and migrated compact navigation affordances to a host-owned accessible tooltip system.

The tooltip controller provides:

- one shared tooltip surface;
- `role="tooltip"`;
- trigger linkage through `aria-describedby`;
- immediate keyboard/focus presentation;
- delayed pointer-hover presentation;
- viewport-aware positioning;
- compact-navigation eligibility;
- dismissal on focus loss, pointer exit, Escape, pointer down, scroll/resize, route changes, and opening another overlay;
- restoration of any previous `aria-describedby` value.

This replaces reliance on browser-native `title` behavior for the reconstructed shell controls while preserving accessible names.

### Cross-scope overlay exclusivity

Enhanced `assets/js/platform/ui/overlay-manager.ts` so independent root overlays are mutually exclusive across separately instantiated platform overlay managers.

When a root overlay opens it emits the host-level `wm:overlay-open` event. Other overlay-manager instances close their active root stack without restoring stale trigger focus. Explicit parent/child overlays inside the same manager do not emit a competing root event and remain open as a valid branch.

This prevents combinations such as an unrelated host menu and another feature root menu remaining simultaneously open, while preserving legitimate nested menu behavior.

### Shared menu interaction helpers

Account/Profile and Appearance now use the shared floating-surface menu helpers for:

- menu item discovery;
- Arrow-key focus movement;
- Home/End movement;
- incremental typeahead.

This reduces duplicated menu-navigation logic without replacing the account feature's business actions or the shared overlay manager's lifecycle ownership.

## Semantic foundation additions

Shell M6 adds semantic contracts for:

- overlay viewport gutter;
- anchor gap;
- floating-surface padding;
- radius;
- z-index;
- motion timing/easing;
- tooltip gap;
- tooltip maximum width;
- tooltip radius;
- overlay surface/text/border/shadow roles;
- tooltip surface/text/shadow roles.

Light, explicit dark, and system-dark scopes define the required M6 theme roles.

## Presentation and accessibility behavior

The shared host overlay layer supports:

- light and dark themes;
- viewport collision handling;
- responsive clipping protection;
- keyboard focus treatment;
- reduced motion;
- forced colors/high contrast;
- coarse-pointer-compatible account menu geometry;
- placement-aware motion origins;
- no `transition: all` usage;
- no remote visual assets or Monday/Vibe runtime dependencies.

## Verification

| Gate | Result |
|---|---|
| TypeScript `tsc --noEmit` | **PASS** |
| `verify:types` | **PASS** |
| Vite static architecture verification | **PASS** |
| Production hardening | **PASS** |
| Boards M1–M8 contracts | **PASS** |
| Shell M1–M5 contracts | **PASS** |
| **Shell M6 overlay harmonization verifier** | **PASS** |
| `npm run verify:ui` | **PASS** |
| Full `npm run verify` | **PASS** |
| **Full `npm run check`** | **PASS** |
| Chromium browser integration | **PASS** |
| Accessible compact-navigation tooltip | **PASS** |
| Tooltip `aria-describedby` linkage | **PASS** |
| Tooltip viewport containment | **PASS** |
| Tooltip dismissed when menu opens | **PASS** |
| Cross-scope root-overlay exclusivity | **PASS** |
| Parent/child overlay branches | **PASS** |
| Account/Profile shared surface | **PASS** |
| Appearance submenu behavior | **PASS** |
| Keyboard menu/typeahead behavior | **PASS** |
| Escape/focus restoration | **PASS** |
| Mobile/tablet/desktop regressions | **PASS** |
| Light/dark | **PASS** |
| Coarse pointer | **PASS** |
| Reduced motion | **PASS** |
| Forced colors | **PASS** |
| Boards overlay regressions | **PASS** |
| TimeTracker regressions | **PASS** |
| FuelTrack+ regressions | **PASS** |
| TradeLink regressions | **PASS** |

The dedicated M6 gate is `verify-v1432-shell-overlay-harmonization-sm6.mjs` and is incorporated into `npm run verify:ui`.

## Production artifact boundary

An explicit `npm run build` attempt was made in this environment and returned:

```text
> work-management-app@1.43.2 build
> vite build

sh: 1: vite: not found
```

Therefore the following production-artifact gates are **not** claimed as passing here:

- `verify:dev`;
- `build`;
- `verify:dist`;
- `verify:preview`;
- `release:check`.

Run in a dependency-enabled local environment:

```bash
npm ci
npm run release:check
```

No additional Shell M6 implementation pass is required if that production release gate succeeds.

## Exact Shell M5 → Shell M6 source change scope

Compared directly with `Work-Management-App-v1.43.2-Shell-M5-Account-Profile-Menu-RC.zip`:

### Added

- `RELEASE-STATUS-v1.43.2-SHELL-M6-GLOBAL-OVERLAYS.md`
- `assets/css/shell-overlays.css`
- `assets/js/platform/ui/floating-surface.ts`
- `assets/js/platform/ui/tooltip-controller.ts`
- `verify-v1432-shell-overlay-harmonization-sm6.mjs`

### Modified

- `CHECKSUMS.sha256`
- `assets/css/foundation/themes.css`
- `assets/css/foundation/tokens.css`
- `assets/css/shell-account-menu.css`
- `assets/js/app.ts`
- `assets/js/features/account/profile-menu.ts`
- `assets/js/platform/ui/overlay-manager.ts`
- `assets/js/runtime/index.ts`
- `config/runtime-assets.js`
- `package.json`
- `src/main.ts`
- `tests/browser/run-cdp.mjs`
- `verify-motion.mjs`
- `verify-v1432-board-monday-integration.mjs`
- `verify-v1432-shell-account-menu-sm5.mjs`
- `verify-v1432-shell-navigation-foundation-sm1.mjs`

### Removed

**None.**

No source files were modified inside TimeTracker, FuelTrack+, or TradeLink. No changes were made to Supabase schema/migrations/RLS/RPCs, Board repository/domain/command services, authentication contracts, host application-access policy, or embedded-application authorization models.

## Compatibility boundaries intentionally retained

### Board overlays remain feature-owned visually

Boards already have a mature M6 overlay/menu/dialog presentation layer. Shell M6 strengthens the shared overlay-manager lifecycle but does not replace Board-specific visual classes with host-shell classes. Board overlay regressions pass unchanged.

### Account and Settings pages remain authoritative

The profile menu remains a quick-access shell surface. Full profile/password/session behavior stays on Account, while persistent global appearance/preferences remain owned by Settings and the existing preference service.

### Historical generic overlay CSS remains lower priority

Older generic context-menu/modal declarations still exist in historical stylesheets. Shell M6 does not remove them globally because unrelated legacy surfaces may still consume them. Safe retirement belongs to Shell M8 after the final responsive/accessibility pass.

### Host tooltip ownership is intentionally bounded

The new tooltip controller owns Work Management host-shell controls. Embedded application runtimes retain their own independent tooltip/overlay systems and are not coupled to the host implementation.

### No fabricated contextual menu functionality

Shell M6 harmonizes the menus and tooltips that the host actually supports. It does not invent sidebar section menus, commands, marketplace actions, AI controls, DND state, or other Monday-specific product functionality that has no Work Management business contract.

### Monday/Vibe remains reference-only

No Monday/Vibe package, React component runtime, vendor-specific DOM architecture, CDN asset, backend integration, or persistence dependency was introduced.

## Remaining shell roadmap

There are **no unfinished modules inside Shell Milestone 6**.

The remaining planned shell reconstruction is:

1. **Shell M7 — Responsive and Accessibility Finalization**
2. **Shell M8 — Production Integration and Legacy Cleanup**

## Blockers and unresolved risks

There is **no Shell M6 code-level blocker** and no known unresolved M6 functional regression.

The only current release blocker is environmental: the project-local Vite executable is unavailable in this execution environment, preventing production build/dist/preview validation here.

## Milestone verdict

**Shell Milestone 6 — Global Overlay and Menu Harmonization: IMPLEMENTATION COMPLETE.**

The Work Management shell is ready to proceed to **Shell Milestone 7 — Responsive and Accessibility Finalization**, subject only to the existing production-artifact verification boundary described above.
