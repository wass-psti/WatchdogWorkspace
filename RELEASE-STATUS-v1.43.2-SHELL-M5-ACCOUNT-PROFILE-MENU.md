# Work Management App v1.43.2 — Shell Milestone 5 Account/Profile Menu Reconstruction

## Status

**Implementation complete at Shell M5 scope.**

Baseline: `Work-Management-App-v1.43.2-Shell-M4-Resizing-Pinning-RC.zip`

This milestone reconstructs the authenticated top-bar account launcher and profile menu while preserving the existing Work Management authentication/session model, host RBAC, platform preferences, application access policies, Boards runtime, and application-scoped authorization boundaries.

## Implemented

### Authenticated account launcher

The previous authenticated account control navigated directly to the Account route. It now opens a dedicated account/profile menu using native button/menu semantics:

- authenticated user initials
- display name
- platform role
- `aria-haspopup="menu"`
- `aria-expanded`
- account menu ownership via `aria-controls`
- compact avatar-only representation on narrow screens

Unauthenticated users retain the existing Sign in action.

### Account identity header

The menu is populated only from authoritative Work Management identity data already available from Supabase Auth/profile state:

- display name
- email
- platform role
- account active/restricted state

No organization name, remote avatar, or other unmodeled identity field is fabricated.

### Supported account actions

The menu exposes only capabilities that exist in Work Management:

- **My profile & security** → existing Account route
- **User management** → existing Users route; visible only when `auth.canManageUsers` is true
- **Platform settings** → existing Settings route
- **Appearance** → child menu using the existing `preferences.v1` global preference model
  - System
  - Light
  - Dark
- **Sign out** → existing authenticated local-session sign-out path

The existing Account page remains authoritative for display-name editing, password changes, access-role mapping, session expiry, refresh access, local sign-out, and global sign-out.

### Appearance submenu

Appearance is implemented as a child menu, not a parallel settings system.

It calls the existing:

- `getPreferences()`
- `savePreferences()`
- `applyTheme()`

and synchronizes the same platform preference state consumed by Settings/Home.

### Keyboard and focus behavior

The account menu supports:

- Arrow Up / Arrow Down
- Home / End
- incremental typeahead
- Arrow Right to open Appearance
- Arrow Left to return from Appearance
- Escape to close the top overlay
- initial focus on the first actionable item
- focus restoration to the submenu trigger / account launcher
- outside-click dismissal through the existing platform overlay manager

### Overlay/placement behavior

The account menu uses the existing platform `createOverlayManager()` lifecycle rather than inventing a second global overlay stack.

M5 adds menu-specific placement that:

- anchors to the account launcher
- aligns to the launcher edge
- flips vertically when required
- flips the Appearance submenu horizontally when required
- respects a semantic viewport gutter
- repositions on window resize/scroll
- remains viewport-contained

Full global overlay visual/lifecycle consolidation remains Shell M6 scope.

### Visual foundation

New Shell M5 semantic roles cover:

- account trigger height/avatar size
- menu/submenu width
- max height
- viewport gutter
- row height
- coarse-pointer row height
- menu radius
- item radius
- avatar size
- icon size
- motion timing
- account surfaces
- text/muted text
- borders
- hover/pressed/selected states
- focus
- elevation

Light, dark, and system-dark theme scopes define the complete account-menu color role set.

### Responsive/accessibility behavior

Verified behavior includes:

- desktop
- tablet
- narrow/mobile
- coarse pointer
- light theme
- dark theme
- reduced motion
- forced colors
- viewport containment
- no document-level horizontal overflow

At `<=620px` the top-bar account launcher becomes avatar-first while retaining its accessible label. Menu actions keep touch-safe geometry.

## Explicitly not introduced

The supplied Monday.com profile menu was used only as an information-architecture/interaction reference. M5 does **not** add unsupported Monday-only concepts such as:

- AI credits
- AI Work Platform upgrade CTA
- App Marketplace
- monday.labs
- mobile-app promotion
- developer portal
- account upgrade/billing CTA
- fabricated organization identity
- remote Monday CDN assets
- working-status / Do Not Disturb state without a corresponding Work Management notification model

No Monday/Vibe runtime package or vendor-specific DOM/CSS contract was added.

## Verification

The following passed in this environment:

- `npm run typecheck`
- `npm run verify:types`
- `npm run verify:vite`
- `npm run verify:hardening`
- `npm run verify:ui`
- all Boards M1–M8 UI contracts
- Shell M1 Navigation Foundation
- Shell M2 Primary Sidebar
- Shell M3 Sections/Applications/Resources
- Shell M4 Resizing/Pinning
- Shell M5 Account/Profile Menu
- TimeTracker v2 presentation gates
- `npm run verify`
- complete Chromium browser integration/presentation matrix
- `npm run check`

### Shell M5 browser coverage

The Chromium suite verifies:

- account launcher opens an accessible menu
- authenticated name/email are present
- User Management is present for an authorized administrator
- first actionable menu item receives focus
- Arrow Down navigation
- Appearance opens as a child menu
- theme changes use the authoritative global preference path
- Escape closes Appearance and restores submenu-trigger focus
- Escape closes the account menu and restores launcher focus
- sign-out calls the existing session action
- account menu width/viewport containment
- identity-header geometry
- semantic avatar geometry
- desktop/touch row sizes
- elevation and themed surface
- desktop/tablet/mobile/coarse-pointer audits in light and dark modes

## Production artifact boundary

`npm run build` was explicitly attempted and returned:

```text
> work-management-app@1.43.2 build
> vite build

sh: 1: vite: not found
```

Therefore the following production artifact gates are **not claimed as passing in this environment**:

- `verify:dev`
- `build`
- `verify:dist`
- `verify:preview`
- `release:check`

On a dependency-enabled development machine:

```bash
npm ci
npm run release:check
```

No additional Shell M5 implementation pass is expected if those artifact gates pass.

## Exact M4 → M5 source delta

### Added

- `assets/css/shell-account-menu.css`
- `assets/js/features/account/profile-menu.ts`
- `verify-v1432-shell-account-menu-sm5.mjs`
- `RELEASE-STATUS-v1.43.2-SHELL-M5-ACCOUNT-PROFILE-MENU.md`

### Modified

- `assets/css/foundation/tokens.css`
- `assets/css/foundation/themes.css`
- `assets/js/app.ts`
- `src/main.ts`
- `package.json`
- `tests/browser/run-cdp.mjs`
- `verify-motion.mjs`
- `verify-v1432-board-monday-integration.mjs`
- `verify-v1432-shell-navigation-foundation-sm1.mjs`
- `CHECKSUMS.sha256` (regenerated during packaging)

### Removed

None.

No application source was modified inside TimeTracker, FuelTrack+, or TradeLink.

No changes were made to Supabase schema/migrations/RLS/RPCs, Board repositories/domain/command services, authentication contracts, or application-scoped authorization models.

## Compatibility boundaries

### Existing Account page remains authoritative

M5 reconstructs the quick account/profile menu. It does not replace the full Account page.

### Existing Settings remains authoritative

Appearance uses the same global preferences. Storage, diagnostics, density, backup/restore, and other Settings behavior remains on the Settings route.

### Shared overlay manager remains a platform primitive

The account menu already consumes `createOverlayManager()` for exclusivity/Escape/outside-click/focus restoration. Shell M6 still owns cross-shell overlay/menu visual and lifecycle harmonization across profile, sidebar, command palette, and future host-level menus.

### Historical account-pill CSS

Historical `.account-pill` rules remain in lower-priority shared styles. `shell-account-menu.css` is authoritative for the M5 authenticated launcher and profile-menu presentation. Safe legacy cleanup remains Shell M8 scope.

## Remaining shell roadmap

There are no unfinished implementation modules inside Shell M5.

Remaining milestones:

1. Shell M6 — Global Overlay and Menu Harmonization
2. Shell M7 — Responsive and Accessibility Finalization
3. Shell M8 — Production Integration and Legacy Cleanup

## Verdict

**Shell Milestone 5 — Account/Profile Menu Reconstruction: IMPLEMENTATION COMPLETE.**

Source/runtime verification, project regression verification, and Chromium interaction/presentation verification pass. Production build/dist/preview promotion remains pending only because the current execution environment does not provide the project-local Vite executable.
