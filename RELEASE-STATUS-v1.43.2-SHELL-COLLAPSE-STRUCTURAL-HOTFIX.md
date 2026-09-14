# Work Management App v1.43.2 — Shell Collapse Control Structural Hotfix

## Status

**IMPLEMENTATION COMPLETE / SOURCE + CHROMIUM VERIFIED / PRODUCTION VITE ARTIFACT GATE PENDING LOCAL DEPENDENCY RESTORE**

This hotfix replaces the two earlier collapse-control positioning strategies that proved incorrect in real use. The collapse/expand control is no longer an independently positioned viewport/sidebar-width affordance. It is now structurally owned by the sidebar header action rail together with the pin control.

## Root cause

The previous implementation positioned the collapse button independently from the sidebar header. The first implementation followed transient sidebar geometry and could fall below the Work Management brand during state changes. The subsequent anchor hotfix used the saved expanded sidebar width as a fixed viewport coordinate, which prevented vertical drift but caused the control to remain stranded over workspace content after the navigation collapsed to the 60px rail.

The underlying problem was architectural: the control had its own positioning model instead of being part of the header layout.

## Corrective implementation

- `shellNavigationToggleMarkup()` is now rendered inside `.shell-sidebar-header-actions`, directly beside the Pin/Unpin control.
- `.shell-sidebar-collapse` is now `position: relative` inside that action rail; it has no independent fixed/absolute desktop `top`, `left`, `right`, or saved-width anchor.
- `.shell-sidebar-header-actions` is the single positioning authority and is vertically centered with `top: 50%` + `translateY(-50%)`.
- The action rail follows the **actual visible sidebar edge**. Expanded/preview sidebar → expanded edge; compact rail → compact edge.
- Disabled Pin is `display:none`, so it cannot reserve horizontal space and displace Expand in compact mode.
- The arrow rotation remains on the SVG icon only. The button itself is never translated/rotated by navigation state.
- Pressed feedback remains visual (shadow only) and cannot move the control.
- Effective sidebar padding is now represented by an inherited shell variable so the header-edge calculation remains correct when compact mode uses tighter padding.
- Mobile drawer keeps its Close navigation control in the same structural header action rail while Pin remains hidden.
- Tablet compact rail retains its existing intentional behavior where the header action rail is hidden.

## Browser contracts added/revised

The Chromium presentation audit now verifies:

1. Collapse is attached to the visible expanded sidebar edge.
2. Collapse is vertically centered in the sidebar header.
3. Collapse stays above the first primary navigation row and cannot drop into Applications.
4. Opening unpinned preview keeps the same vertical header coordinate.
5. During preview the control follows the visible preview edge instead of a stale saved-width viewport coordinate.
6. Returning to compact mode keeps the same vertical header coordinate.
7. Expand is attached to the 60px compact rail edge rather than floating over workspace content.
8. Expand remains in the header after collapse.
9. Existing compact action-tooltip, focus, reduced-motion, forced-colors and responsive contracts remain active.

## Verification

Passed:

- `npm run typecheck`
- `npm run verify:types`
- `npm run verify:vite`
- `npm run verify:hardening`
- `npm run verify:ui`
- `npm run verify`
- complete `npm run check`
- Chromium functional integration
- full responsive/light/dark/coarse-pointer/zoom/enlarged-text matrix
- Boards M1–M8 regression contracts
- Shell M1–M8 regression contracts
- TimeTracker v2 pass 1 + pass 2
- FuelTrack+ integration regressions
- TradeLink integration regressions

### Production artifact boundary

`npm run build` was attempted and cannot run in this execution container because the local Vite executable is unavailable:

```text
> vite build
sh: 1: vite: not found
```

Run locally after restoring dependencies:

```bash
npm ci
npm run release:check
```

## Exact source scope from the previous Collapse Anchor Hotfix RC

Modified:

- `assets/css/shell-navigation.css`
- `assets/js/app.ts`
- `package.json`
- `tests/browser/run-cdp.mjs`
- `verify-v1432-shell-collapse-anchor-hotfix.mjs`
- `CHECKSUMS.sha256` (regenerated for package)

Added:

- `verify-v1432-shell-collapse-structure-hotfix.mjs`
- `RELEASE-STATUS-v1.43.2-SHELL-COLLAPSE-STRUCTURAL-HOTFIX.md`

No source changes were made to TimeTracker, FuelTrack+, TradeLink, authentication, host/module RBAC, Supabase schema/migrations/RLS/RPC, Boards repository/domain services, or application business logic.

## Compatibility boundaries

- The existing 60px compact rail, expanded custom width, pin/unpin, unpinned preview, mobile drawer, sidebar resizing and persisted shell preference contracts are preserved.
- Tooltips continue to use the Shell M6 shared overlay system.
- Monday/Vibe remains reference-only; no runtime dependency was introduced.

## Verdict

The collapse/expand control positioning defect is corrected structurally rather than through another coordinate override. No additional implementation work is required for this defect unless a new real-device reproduction demonstrates a separate issue. Production promotion still requires the dependency-enabled Vite release gate.
