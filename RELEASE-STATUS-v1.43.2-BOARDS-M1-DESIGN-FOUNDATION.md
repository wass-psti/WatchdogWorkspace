# Work Management App v1.43.2 — Boards Reconstruction
## Milestone 1: Board Design Foundation

**Status:** SOURCE/RUNTIME COMPLETE — browser/regression verified  
**Release posture:** RC continuation baseline; production Vite build/dist/preview promotion remains environment-dependent.

## Scope completed

Milestone 1 establishes one semantic design foundation for the Work Boards presentation layer without changing Board business behavior, persistence, permissions, or application boundaries.

### 1. Semantic spacing foundation

Board presentation now consumes role-based spacing aliases backed by the product 4px system:

- micro: 2px
- tight: 4px
- compact: 8px
- control: 12px
- standard: 16px
- section: 24px
- major: 32px

Core Board selectors were migrated from repeated local spacing values to these semantic roles where applicable.

### 2. Typography hierarchy

Added Board typography roles for:

- metadata
- labels
- controls/body copy
- card titles
- group titles
- Board title minimum/maximum scale
- Board-specific weights, line-height, and title/group tracking

The Board presentation consumes these roles instead of maintaining independent selector-level font sizes for its core hierarchy.

### 3. Control and density geometry

The foundation now defines:

- compact control: 30px
- small control: 34px
- standard Board control: 36px
- coarse-pointer/touch target: 44px
- view tab: 42px
- Board toolbar: 56px minimum
- group header: 44px
- column header: 40px
- compact/default/comfortable row density: 40/44/48px
- inline creation row: 38px
- Status target: 32px
- checkbox: 18px
- stable Board selection/column utility widths
- Board card/search/Kanban minimum geometry

Default spreadsheet rows now render at the semantic 44px density. Optional `data-board-density="compact"` and `data-board-density="comfortable"` contracts are established for later runtime preference work without changing the current default behavior.

### 4. Radius, border, elevation and surface system

Added Board semantic roles for:

- control/card/surface/status/pill radii
- Board border/focus widths
- resting/card/raised/popover/overlay elevation
- elevated Board surface
- strong Board border

Floating Board menus now consume the elevated-surface/elevation roles rather than bespoke shadow/surface values.

### 5. Theme semantics

Board light, explicit dark, and system-dark modes now each define exactly one complete set of Board color roles:

- primary / hover / soft / contrast
- primary and muted text
- disabled foreground
- normal / strong / grid borders
- base / subtle / elevated surfaces
- hover / pressed / selected states
- focus color
- overlay color

This also fixes two baseline defects discovered during the milestone:

1. the explicit dark theme contained a duplicated Board token block;
2. the `data-theme="system"` dark branch did not define the Board-specific semantic palette and was relying on fallback behavior.

The dark Board primary action now uses a theme-specific high-contrast foreground token instead of an unconditional white foreground.

### 6. Interaction-state and motion foundation

Persistent Board buttons, inputs, selects and summaries now share state transitions for background, border, foreground, shadow and opacity using Board motion tokens. Broad `transition: all` remains prohibited.

Reduced-motion behavior explicitly compresses Board transition duration while preserving state changes. Coarse-pointer Board controls receive a semantic 44px minimum target where compact desktop geometry would otherwise be too small.

### 7. Checkbox/row containment correction

Chromium verification found a legacy checkbox minimum-size interaction that expanded a nominal 44px Board row to 52px. Milestone 1 adds a dedicated checkbox-size token and a Board-scoped checkbox geometry reset. This makes the semantic default row density real in rendered layout rather than merely declarative.

## Files changed from the Boards Monday Integration RC baseline

- `assets/css/foundation/tokens.css`
- `assets/css/foundation/themes.css`
- `assets/css/boards-monday.css`
- `tests/browser/run-cdp.mjs`
- `verify-v1432-board-monday-integration.mjs`
- `package.json`

## Files added

- `verify-v1432-board-design-foundation-m1.mjs`
- `RELEASE-STATUS-v1.43.2-BOARDS-M1-DESIGN-FOUNDATION.md`

`CHECKSUMS.sha256` is regenerated at packaging time and therefore also differs from the input archive.

## Verification completed

The following were executed successfully after the implementation:

- global TypeScript `tsc --noEmit` — PASS
- `npm run verify:types` — PASS
- `npm run verify:hardening` — PASS
- `npm run verify:ui` — PASS
- `verify-v1432-board-design-foundation-m1.mjs` — PASS
- existing Monday-style Board integration verifier — PASS
- `npm run verify` — PASS
- Chromium browser integration suite — PASS
- final viewport/accessibility audits — PASS across wide desktop, desktop, laptop, tablet, narrow viewport, 200%-zoom equivalent, enlarged text, and coarse-pointer scenarios in light/dark themes
- Monday-style Board visual geometry audit — PASS at desktop and narrow viewport in light/dark themes

Existing Board interaction regressions continue to pass, including drag/drop, selection, history/undo-redo, inline explicit Save/Cancel editing, Enter/Escape semantics, no implicit blur-save, Status stable IDs/lifecycle, floating menu containment, Item Workspace stale-response isolation, Updates/Files/Activity shell stability, permissions, and responsive containment.

Unrelated embedded application checks for TimeTracker, FuelTrack+ and TradeLink also continue to pass.

## Compatibility boundaries retained

Milestone 1 intentionally does **not** change:

- Supabase schema, migrations, RLS or RPC contracts
- authentication/session identity
- Work Management host RBAC
- Board repositories, DTOs, domain services or command contracts
- stable Board/group/column/item/Status identifiers
- Board persistence behavior
- TimeTracker source/runtime
- FuelTrack+ source/runtime
- TradeLink source/runtime
- Monday/Vibe runtime dependencies (none are introduced)

The legacy `app.css` Board rules remain present as a compatibility layer. `boards-monday.css`, loaded last in the presentation cascade, remains the authoritative Board reconstruction layer. Removing the older compatibility CSS wholesale is deliberately deferred until later visual milestones have migrated all remaining Board surfaces and regression coverage proves the old declarations are no longer required.

## Remaining reconstruction milestones/modules

Milestone 1 itself is complete. The overall Boards reconstruction continues with:

### Milestone 2 — Board Shell and Header Reconstruction
Primary module:
- `assets/js/features/boards/views/board-workspace-view.ts`

Presentation modules:
- `assets/css/boards-monday.css`
- shared Board primitives only where required

Target: breadcrumb/title/owner/description/member/activity/action hierarchy, header proportions, baseline alignment, stable shell geometry, and view-header relationship.

### Milestone 3 — View Navigation and Command Toolbar
Primary modules:
- `board-workspace-view.ts`
- `board-menu-controller.ts`
- `board-preference-controller.ts`
- `selection-controller.ts`
- `overlay-coordinator.ts`

### Milestone 4 — Main Table Reconstruction
Primary modules:
- `table-view.ts`
- `group-workflows.ts`
- `item-workflows.ts`
- `inline-edit-controller.ts`
- `column-workflows.ts`
- `column-resize-controller.ts`
- `structure-drag-controller.ts`
- `drag-drop-controller.ts`

### Milestone 5 — Cell and Column Visual System
Primary modules:
- `table-view.ts`
- `inline-edit-controller.ts`
- Status/column renderer and workflow modules

### Milestone 6 — Menus, Popovers, Dialogs and Microinteractions
Primary modules:
- `overlay-coordinator.ts`
- `board-menu-controller.ts`
- `dialog-controller.ts`
- related workflow controllers

### Milestone 7 — Kanban and Item Workspace Harmonization
Primary modules:
- `kanban-view.ts`
- `item-workspace-view.ts`

### Milestone 8 — Responsive, Accessibility and Production Polish
Cross-cutting presentation, browser and regression gates.

## Blocker / unresolved release risk

The container does not currently have the project-local Vite 8.2.2 binary. `npm run build` therefore returns `vite: not found`. An attempted dependency restore could not complete in the available execution environment and was removed before packaging, so no partial `node_modules` tree is included.

Because of that environmental limitation, the following production artifact gates were not executable here:

- `npm run verify:dev`
- `npm run build`
- `npm run verify:dist`
- `npm run verify:preview`

On a dependency-enabled development machine, run:

```bash
npm ci
npm run release:check
```

If those pass, this Milestone 1 source baseline can be promoted without further Milestone 1 implementation work.

## Milestone verdict

**Milestone 1 — Board Design Foundation is implementation-complete and source/runtime/browser verified.**

Continuation is required only because the broader Boards reconstruction intentionally proceeds to Milestone 2 and later milestones. No unresolved Milestone 1 functional defect is known. Production build promotion remains the only environment-dependent release gate.
