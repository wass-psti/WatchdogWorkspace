# Work Management App v1.43.2 — Shell Milestone 4 Resizing, Pinning and Navigation Microinteractions

## Status

**Shell Milestone 4 implementation: COMPLETE**

This milestone continues from `Work-Management-App-v1.43.2-Shell-M3-Sections-Applications-Resources-RC.zip` and completes the desktop navigation mechanics defined by the Shell M1 foundation and exposed by the M2/M3 sidebar.

The host navigation now supports persisted custom width, pointer and keyboard resizing, pin/unpin behavior, non-layout-shifting unpinned preview, state announcements, responsive interaction guards, and restrained navigation feedback without changing routing, authentication, host application access, embedded-application authorization, Board domain behavior, or Supabase contracts.

The package remains an RC because the current execution environment does not contain the project-local Vite executable required for `build`, `verify:dist`, and `verify:preview`.

## 1. Persisted navigation preference

The existing `wm.platform.shell-navigation.v1` preference has been upgraded from the M2 string-only `expanded` / `compact` value to an object containing:

- navigation state;
- expanded custom width;
- pinned state.

The reader remains backward-compatible with the earlier M2 string format and automatically supplies the semantic default width and pinned behavior when an old value is encountered.

Width is clamped against the existing semantic foundation:

- minimum: **224px**;
- default: **256px**;
- maximum: **360px**.

The preference also synchronizes across browser tabs through the existing `storage` lifecycle boundary.

## 2. Pointer resizing

The M1 resizer primitive is now functional.

Desktop expanded navigation exposes a semantic resize separator with:

- 10px pointer hit region;
- 1px normal divider;
- 3px active/focused divider;
- pointer capture during drag;
- 224–360px clamping;
- live shell/workspace geometry updates;
- transition suppression while actively resizing;
- width persistence when resizing ends;
- polite completion announcement.

Dragging never mutates application data or Board preferences. It updates only host-shell presentation state.

## 3. Keyboard resizing

The resizer is a keyboard-operable vertical separator with:

- `role="separator"`;
- `aria-orientation="vertical"`;
- `aria-valuemin`;
- `aria-valuemax`;
- `aria-valuenow`;
- `aria-valuetext`.

Keyboard commands:

| Key | Result |
| --- | --- |
| Arrow Left | reduce width by 8px |
| Arrow Right | increase width by 8px |
| Shift + Arrow | resize by 24px |
| Home | minimum width, 224px |
| End | maximum width, 360px |

A double click on the resize separator restores the semantic 256px default.

## 4. Pin / unpin behavior

Expanded desktop navigation now has an explicit pin control using `aria-pressed`.

### Pinned

Pinned navigation occupies its saved width and the Work Management workspace is offset by that same width.

### Unpinned

Unpinning returns the persistent layout footprint to the 60px compact rail. Hovering or keyboard-focusing the rail then opens the sidebar at the user's saved expanded width as an overlay preview.

The workspace remains at the 60px offset while the preview is open. This avoids horizontal content jumping, Board reflow, iframe resize churn, and embedded-application layout movement.

Leaving both pointer and focus context collapses the preview back to 60px. Pointer and keyboard focus are reconciled so one input modality does not unexpectedly close navigation while the other is still inside it.

Pinning an open preview converts it back to the normal expanded/persistent layout at the saved custom width.

## 5. Layout-width / panel-width separation

M4 separates two shell concepts that were intentionally identical in M1–M3:

- **layout width** — how much horizontal space the workspace reserves;
- **panel width** — how wide the visible sidebar itself is.

Pinned expanded navigation uses the same value for both.

Unpinned preview uses:

- layout width: 60px;
- panel width: saved expanded width.

This separation is the key architectural boundary that allows Monday-style auto-collapsing navigation without reflowing the application surface.

## 6. Navigation microinteractions

M4 adds restrained host-navigation feedback for:

- pin hover / focus / pressed state;
- resize hover / focus / active state;
- selected navigation press state;
- preview elevation;
- collapse/expand movement;
- width transitions when not actively dragging.

`transition: all` is prohibited.

During active resizing, width/layout transitions are removed so the sidebar tracks the pointer directly rather than lagging behind it.

## 7. Responsive behavior

### Desktop >900px

Full M4 behavior is available:

- expanded / compact;
- custom width;
- pointer resize;
- keyboard resize;
- pin / unpin;
- hover/focus preview.

### 621–900px

The existing M2/M3 compact 60px rail remains authoritative. Pin and resizer controls are removed because forcing arbitrary-width navigation into the tablet workspace would compete with application content.

### <=620px

The M2 vertical off-canvas drawer remains authoritative. Custom desktop width, desktop pinning, and desktop resizer behavior do not leak into mobile navigation.

The mobile drawer continues to provide its established backdrop, focus containment, Escape handling, body-scroll locking, 44px targets, and full M3 resource hierarchy.

## 8. Accessibility and user feedback

M4 adds a polite shell live region for meaningful navigation-state changes.

It announces:

- completed width changes;
- pin state;
- unpin / auto-preview behavior.

The new controls use native buttons, explicit accessible labels, `aria-pressed` for pin state, and separator value semantics for resizing.

Reduced-motion mode collapses navigation transitions to effectively instantaneous feedback.

Forced-colors behavior continues through the established shell focus and border system.

## 9. Compatibility boundaries preserved

### Routing and authorization

No routing, authentication, host RBAC, module registry, or application-access policy was changed.

### Embedded applications

No source changes were made inside:

- TimeTracker;
- FuelTrack+;
- TradeLink.

Their application-scoped authorization remains separate from host authentication/application access.

### Boards

No Board repository, domain service, command service, Supabase schema, RLS, RPC, or persistence contract was changed.

The complete Boards M1–M8 reconstruction continues to pass.

### Mobile navigation

The M2 off-canvas drawer remains the mobile interaction model. M4 intentionally does not attempt to resize or pin a mobile drawer.

### Historical shell CSS

Older shell/mobile declarations remain in lower-priority legacy stylesheets. `assets/css/shell-navigation.css` is authoritative for reconstructed Shell M1–M4 behavior. Safe legacy removal remains Shell M8 scope.

### Account/profile menu

The current Account destination remains unchanged. The Monday-inspired account/profile popover remains correctly deferred to Shell M5.

## 10. Verification

The following gates pass after the final M4 implementation:

- TypeScript `tsc --noEmit` — PASS;
- `verify:types` — PASS;
- Vite static architecture verification — PASS;
- production hardening — PASS;
- Boards M1–M8 verification — PASS;
- Shell M1 foundation — PASS;
- Shell M2 primary sidebar — PASS;
- Shell M3 sections/resources — PASS;
- **Shell M4 resizing/pinning verifier — PASS**;
- `verify:ui` — PASS;
- full `npm run verify` — PASS;
- **full `npm run check` — PASS**;
- Chromium interaction/regression suite — PASS;
- final responsive/light/dark viewport matrix — PASS;
- 200%-zoom-equivalent audit — PASS;
- enlarged-text audit — PASS;
- coarse-pointer audit — PASS;
- Boards regressions — PASS;
- TimeTracker regressions — PASS;
- FuelTrack+ regressions — PASS;
- TradeLink regressions — PASS.

The browser presentation audit explicitly verifies:

- the pin control is present on desktop;
- the resizer has the semantic desktop hit area;
- a 320px custom width expands the sidebar to 320px;
- pinned custom width moves the workspace to the same 320px offset;
- unpinned preview restores the saved 320px panel width;
- unpinned preview keeps the workspace at the 60px compact offset;
- unpinned preview restores expanded navigation content;
- closing the preview returns the panel to 60px.

## 11. Dedicated M4 regression gate

Added:

`verify-v1432-shell-resizing-pinning-sm4.mjs`

It participates in `npm run verify:ui` and protects:

- semantic resize/pin tokens;
- backward-compatible preference migration;
- custom-width persistence;
- min/max enforcement;
- pointer capture/release;
- keyboard resizing;
- double-click reset;
- pin/unpin state;
- hover/focus preview;
- live-region feedback;
- layout-width/panel-width separation;
- responsive exclusions;
- reduced motion;
- forced colors;
- absence of remote Monday/Vibe runtime dependencies.

## 12. Exact M3 -> M4 source delta

Modified:

- `assets/css/foundation/tokens.css`
- `assets/css/shell-navigation.css`
- `assets/js/app.ts`
- `package.json`
- `tests/browser/run-cdp.mjs`
- `verify-v1432-shell-primary-sidebar-sm2.mjs` — compatibility verifier updated for the new layout/panel width architecture
- `CHECKSUMS.sha256` — regenerated for final package

Added:

- `verify-v1432-shell-resizing-pinning-sm4.mjs`
- `RELEASE-STATUS-v1.43.2-SHELL-M4-RESIZING-PINNING.md`

Removed:

- none.

## 13. Remaining shell roadmap

There are no unfinished implementation modules inside Shell Milestone 4.

Remaining shell milestones:

1. **Shell M5 — Account/Profile Menu Reconstruction**
2. **Shell M6 — Global Overlay and Menu Harmonization**
3. **Shell M7 — Responsive and Accessibility Finalization**
4. **Shell M8 — Production Integration and Legacy Cleanup**

## 14. Remaining blocker / unresolved risk

There is no Shell M4 code-level blocker.

The remaining release-environment boundary is the same dependency issue as earlier RCs. An explicit production build attempt returns:

```text
> work-management-app@1.43.2 build
> vite build

sh: 1: vite: not found
```

Therefore this environment cannot truthfully mark the following production-artifact gates as passing:

- `verify:dev`;
- `build`;
- `verify:dist`;
- `verify:preview`;
- `release:check`.

On a dependency-enabled machine, run:

```bash
npm ci
npm run release:check
```

No additional Shell M4 implementation pass is required if that release gate succeeds.

## Milestone verdict

**Shell Milestone 4 — Resizing, Pinning and Navigation Microinteractions: IMPLEMENTATION COMPLETE.**

Source/runtime verification, full project checks, Chromium regression coverage, responsive behavior, and application boundaries all pass. Production Vite artifact verification remains the only external release-environment boundary.
