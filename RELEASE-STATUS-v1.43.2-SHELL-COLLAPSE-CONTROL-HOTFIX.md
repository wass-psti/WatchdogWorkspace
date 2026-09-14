# Work Management App v1.43.2 — Shell Collapse Navigation Control Hotfix

## Scope
Targeted post-Shell-M8 correction for the primary sidebar Collapse/Expand Navigation control based on visual QA feedback. No routing, authentication, RBAC, Supabase, Board domain, or embedded-application behavior was changed.

## Corrections
- Added a compact `action` tooltip variant for short shell actions such as Collapse/Expand Navigation and Pin/Unpin Navigation.
- Limited action-tooltip width to 180px, enforced single-line presentation, reduced internal padding/height, and kept viewport collision handling.
- Action tooltips now dismiss immediately when their trigger is activated, including keyboard activation that synthesizes a click.
- Reduced Collapse Navigation button elevation from the previous heavy floating shadow to a restrained 2px/8px shadow.
- Corrected the navigation live-status element to use the established `wm-visually-hidden` primitive. The previous `sr-only` class had no corresponding CSS definition in the current foundation and could expose messages such as “Navigation unpinned…” as persistent visible sidebar copy.
- Preserved distinct Collapse/Expand versus Pin/Unpin semantics and all existing ARIA labels/state synchronization.

## Verification
- `npm run check`: PASS
  - TypeScript: PASS
  - Type/runtime architecture: PASS
  - Vite static architecture: PASS
  - production hardening: PASS
  - Boards M1–M8 contracts: PASS
  - Shell M1–M8 contracts: PASS
  - new collapse-control hotfix verifier: PASS
  - full project verification: PASS
  - Chromium integration/responsive/accessibility matrix: PASS
  - TimeTracker regressions: PASS
  - FuelTrack+ regressions: PASS
  - TradeLink regressions: PASS
- New Chromium assertions verify:
  - Collapse Navigation uses the compact action-tooltip treatment.
  - Tooltip remains <=32px high and <=180px wide in the audited fixture.
  - Tooltip closes immediately on trigger activation.
  - Navigation status remains assistive-only and does not become visible persistent sidebar copy.

## Production artifact boundary
`npm run build` cannot execute in this environment because the project-local Vite executable is unavailable (`vite: not found`). Run `npm ci && npm run release:check` in the dependency-enabled local environment before production promotion.

## Exact source delta from Shell M8 RC
Modified:
- `assets/css/foundation/tokens.css`
- `assets/css/shell-navigation.css`
- `assets/css/shell-overlays.css`
- `assets/js/app.ts`
- `assets/js/platform/ui/tooltip-controller.ts`
- `package.json`
- `tests/browser/run-cdp.mjs`
- `CHECKSUMS.sha256` (regenerated)

Added:
- `verify-v1432-shell-collapse-control-hotfix.mjs`
- `RELEASE-STATUS-v1.43.2-SHELL-COLLAPSE-CONTROL-HOTFIX.md`

Removed: none.

## Compatibility boundaries
- Shell M1–M8 architecture remains authoritative.
- Mobile drawer, tablet compact rail, resizing/pinning persistence, resource navigation, Account/Profile menu, and global overlay coordination are unchanged except for the shared tooltip activation-dismiss behavior.
- Boards retain their independent presentation/overlay styling while using the same platform overlay lifecycle.
- TimeTracker, FuelTrack+, and TradeLink remain isolated application runtimes with unchanged application-scoped authorization.

## Verdict
The Collapse Navigation visual/interaction defect is corrected and verified at source/runtime/browser level. No additional implementation work is required for this hotfix; only the dependency-enabled production build/dist/preview release gates remain before final production promotion.
