# Work Management App v1.43.2 — Shell Milestone 8 Production Integration and Legacy Cleanup

## Verdict

**Shell Milestone 8 implementation is complete at source/runtime level.** The complete Shell M1–M8 reconstruction passes the project TypeScript, architecture, hardening, UI, full regression and Chromium browser gates available in this environment.

The package remains an **RC** rather than a production cutover artifact because the execution environment does not contain the project-local Vite 8.2.2 package. `npm run verify:dev` and `npm run build` therefore cannot start the Vite server/build, and `npm ci --offline --ignore-scripts` confirms that the Vite tarball is not cached. Production `verify:dev → build → verify:dist → verify:preview` must be executed after dependency restoration in a network/dependency-enabled environment.

## Milestone 8 scope completed

### 1. Retired superseded host-shell CSS ownership

The pre-reconstruction host shell used overlapping declarations across `assets/css/app.css`, `assets/css/foundation/application-migration.css`, and `assets/css/motion-design.css`. M8 removes the obsolete shell-specific geometry and presentation ownership that has already been replaced by Shell M1–M7, including the historical fixed sidebar widths, mobile bottom-navigation rail geometry, duplicate sidebar/navigation presentation, and historical shell entrance/structural rules.

The reconstructed host shell now has explicit ownership boundaries:

- `shell-navigation.css` — host layout, sidebar geometry, resource navigation, resizing, pinning and mobile drawer.
- `shell-overlays.css` — host floating surfaces/tooltips.
- `shell-account-menu.css` — authenticated account launcher and profile menu presentation.
- `shell-accessibility.css` — final responsive/accessibility adaptations.
- `boards-monday.css` — Board-specific presentation, still intentionally later than shell layers.

Generic application, feature, auth, module and embedded-runtime styling remains in the historical shared files where it is still live; M8 removes only shell rules proven to be superseded.

### 2. Final navigation geometry integration

`shell-navigation.css` now directly owns the complete shell structure instead of depending on legacy declarations for baseline display/layout behavior. It explicitly owns:

- fixed desktop sidebar positioning;
- semantic expanded/custom/compact panel widths;
- semantic workspace offset and width;
- host-shell containment/isolation;
- brand/header geometry;
- navigation/resource rows;
- footer/status geometry;
- desktop resize interactions;
- unpinned overlay preview;
- tablet compact rail;
- mobile off-canvas drawer.

The M8 pass also adds semantic brand-mark foundation tokens so the final shell does not inherit the historical generic 34/36px brand geometry.

### 3. Account launcher integration cleanup

`shell-account-menu.css` now owns the generic host account-pill baseline as well as the authenticated M5 launcher. This preserves the unauthenticated Sign in control and authenticated account launcher without relying on the old app-level account-pill rule.

### 4. Historical regression contracts migrated to modern ownership

Older verification scripts that were intentionally protecting previous stability guarantees have been migrated to assert the modern shell implementation rather than requiring obsolete CSS selectors. Their behavioral guarantees remain intact:

- persistent shell does not inherit scroll transforms/compositor instability;
- workspace/sidebar isolation remains enforced;
- desktop expanded/compact width contracts remain deterministic;
- mobile navigation remains stable and does not reintroduce the old bottom rail;
- final presentation and interaction boundaries remain protected.

No verifier was weakened to allow a regression; historical implementation-specific selectors were replaced by M8 semantic ownership assertions.

### 5. Direct-route and session-restoration integration

The M8 release gate explicitly protects the existing host runtime contracts:

- authentication initializes before the requested workspace route renders;
- auth callback/return-to state continues to use `wm.platform.auth.return-to.v1`;
- hash-route changes rerender and transfer focus to the new main content;
- embedded TimeTracker/FuelTrack+/TradeLink routes remain inside the persistent Work Management shell;
- legacy `"expanded"` / `"compact"` navigation preferences migrate into the structured M4 preference format;
- the established `wm.platform.shell-navigation.v1` preference key remains stable.

### 6. Final browser integration cleanup

Removing the old global shell `transition-property:none` rule exposed the intended M4 sidebar width animation. The browser geometry fixture was corrected to disable only its own transition while asserting final dimensions; production motion remains enabled. This avoids restoring the obsolete workaround while keeping custom-width, pinned, unpinned-preview and compact geometry deterministic in the audit.

The M8 browser contract also verifies:

- the desktop sidebar is owned as a fixed shell surface;
- semantic 40px shell brand geometry is active;
- the mobile drawer remains fixed/off-canvas without legacy bottom-rail workspace offsets.

## New M8 release gate

Added `verify-v1432-shell-production-integration-sm8.mjs` and integrated it into `npm run verify:ui`.

The verifier protects:

- authoritative modern shell ownership;
- absence of historical fixed host widths/mobile bottom-rail geometry;
- semantic navigation tokens;
- final shell stylesheet ordering;
- direct-route/session restoration contracts;
- persistent embedded-app host integration;
- navigation preference migration;
- M8 Chromium audit markers;
- no `transition: all` regression;
- no remote shell visual dependency;
- no Monday/Vibe runtime package dependency.

## Verification completed

The following completed successfully in the M8 source tree:

- `npm run typecheck` — PASS
- `npm run verify:types` — PASS
- `npm run verify:vite` — PASS (static Vite architecture verification)
- `npm run verify:hardening` — PASS
- `npm run verify:ui` — PASS, including Boards M1–M8 and Shell M1–M8
- `npm run verify` — PASS
- `npm run check` — **PASS**
- Chromium browser integration — **PASS**
- desktop/tablet/mobile shell matrix — PASS
- 320px minimum supported width — PASS
- 200%-zoom-equivalent viewport — PASS
- enlarged text — PASS
- coarse pointer — PASS
- light/dark — PASS
- reduced motion — PASS
- forced colors — PASS
- Boards M1–M8 regressions — PASS
- TimeTracker v2 regressions — PASS
- FuelTrack+ regressions — PASS
- TradeLink regressions — PASS

## Production artifact boundary

The production-only gate cannot complete in this container because dependencies cannot be restored offline:

```text
npm run verify:dev
Error: Vite is not installed. Run npm install first.
```

```text
npm run build
> vite build
sh: 1: vite: not found
```

```text
npm ci --offline --ignore-scripts
npm ERR! code ENOTCACHED
... vite-8.2.2.tgz ... no cached response is available
```

Therefore the following are **not claimed as passing**:

- `verify:dev`
- `build`
- `verify:dist`
- `verify:preview`
- complete `release:check`

On a dependency-enabled workstation, the final promotion gate is:

```bash
npm ci
npm run release:check
```

If that succeeds, no additional Shell M8 implementation pass is required.

## Compatibility boundaries after M8

### Historical shared CSS remains, but no longer owns host navigation

`app.css`, `application-migration.css`, and `motion-design.css` remain because they still contain live generic application, feature, auth, module, Board-compatibility and embedded-runtime presentation. The obsolete Work Management shell geometry/navigation ownership has been retired from those files.

The remaining shell-specific motion declaration in `motion-design.css` concerns the modern motion-orchestrator indicator/topbar behavior, not legacy sidebar geometry.

### Boards remain presentation-isolated

`boards-monday.css` continues to load after the host shell layers and remains authoritative for Boards. M8 does not flatten the mature Boards M1–M8 design system into shell CSS.

### Embedded applications remain authorization-isolated

TimeTracker, FuelTrack+ and TradeLink remain hosted inside the persistent Work Management shell. Their internal runtime and application-scoped authorization models are unchanged.

### Account/Settings remain authoritative destinations

The M5 profile menu remains a quick-access surface. Full profile/security and platform-settings behavior remains in the existing Account and Settings routes.

## Remaining modules

There are **no unfinished implementation modules inside Shell Milestone 8** and no additional Shell milestone is required by the M1–M8 reconstruction roadmap.

## Cutover status

**Boards M1–M8 reconstruction:** complete and source/runtime verified.  
**Shell M1–M8 reconstruction:** complete and source/runtime verified.  
**Cross-application regression suite:** passing.  
**Production cutover:** pending only the Vite dependency-enabled `verify:dev → build → verify:dist → verify:preview` release gate.

TradeLink itself was not rebuilt in Shell M8; its existing integration/regression suite passes and its application-scoped authorization boundary remains intact.

## Exact Shell M7 → M8 change scope

### Added

- `RELEASE-STATUS-v1.43.2-SHELL-M8-PRODUCTION-INTEGRATION.md`
- `verify-v1432-shell-production-integration-sm8.mjs`

### Modified

- `assets/css/app.css`
- `assets/css/foundation/application-migration.css`
- `assets/css/foundation/tokens.css`
- `assets/css/motion-design.css`
- `assets/css/shell-account-menu.css`
- `assets/css/shell-navigation.css`
- `package.json`
- `tests/browser/run-cdp.mjs`
- `verify-interactions.mjs`
- `verify-layout-stability.mjs`
- `verify-ui-stability-v1175.mjs`
- `verify-v1178-sidebar-stability.mjs`
- `verify-v1432-shell-navigation-foundation-sm1.mjs`
- `verify-v1432-ui-final-quality.mjs`
- `verify-v1432-ui-foundation-phase1.mjs`
- `CHECKSUMS.sha256` (regenerated for the final package)

### Removed

None.

No source changes were made to TimeTracker, FuelTrack+, TradeLink, authentication contracts, host/module authorization, Supabase schema/migrations/RLS/RPCs, Board repositories, Board domain services, or Board command services.
