# Work Management App v1.43.2 — Boards Reconstruction
## Milestone 2: Board Shell and Header Reconstruction

**Status:** IMPLEMENTATION COMPLETE — source/runtime/browser verified  
**Release posture:** RC continuation baseline; production Vite build/dist/preview promotion remains environment-dependent.

## Scope completed

Milestone 2 reconstructs the opened-Board shell/header only. It deliberately preserves the Milestone 1 design foundation and the existing Board domain, persistence, RBAC, command, Table/Kanban and Item Workspace behavior.

### 1. Stable Board shell geometry

The Board workspace is now an explicit single-column grid with containment boundaries for the header, controls, view region, selection host and Item Workspace host. This prevents header/control content from growing the document or leaking intrinsic width into unrelated Board surfaces.

The shell remains compatible with the existing persistent view-navigation/toolbar region; Milestone 3 will reconstruct that command surface without requiring another shell rewrite.

### 2. Header surface reconstruction

The previous oversized/loosely composed Board heading has been replaced with a compact, intentional Board surface using the Milestone 1 semantic tokens:

- one-pixel Board border
- shared Board surface radius
- Board surface/elevation roles
- compact semantic padding
- stable horizontal containment
- light/dark theme semantics inherited from the Board foundation

The desktop browser contract now keeps the reconstructed header within the compact production geometry target instead of allowing the old large-card proportions to return.

### 3. Breadcrumb hierarchy

The breadcrumb is now a dedicated navigation row with:

- compact Back-to-Boards action
- semantic separator treatment
- constrained current-Board label
- ellipsis behavior for long Board names
- explicit `aria-current="page"`
- accessible Back-to-Boards label
- consistent icon geometry and hover/focus treatment

Long Board names no longer force the header or page wider.

### 4. Board identity hierarchy

The primary identity area now uses a dedicated `board-header-main` grid separating Board identity from Board actions on wide layouts.

The title treatment now provides:

- a stable `board-workspace-title` heading target
- semantic title scale capped by the Milestone 1 maximum
- controlled tracking/line-height
- single-line truncation on wide layouts
- two-line containment on narrow layouts
- a compact accessible Board-role badge

The role badge exposes the signed-in user's Board role through an explicit accessible label without changing role semantics or authorization.

### 5. Editable description treatment

Editors now receive a subtle inline Board-description affordance rather than a plain paragraph. It routes through the established `data-board-edit` Board-details workflow, so no new persistence contract is introduced.

Behavior:

- existing description is displayed as secondary Board metadata
- empty description shows the established collaborator-oriented guidance
- editable description exposes a restrained edit glyph on hover/focus
- coarse-pointer environments keep the edit affordance discoverable
- wide layouts constrain the description to one line
- narrow layouts allow up to two lines
- viewers receive a non-interactive static description

The Board-details modal remains authoritative for saving the name/description.

### 6. Members / Activity / overflow action cluster

Board header actions now share one compact control language:

- Members retains the existing management command and user icon
- Activity retains the existing activity workflow and now has a dedicated activity/history glyph
- overflow is separated by a subtle divider
- overflow uses an explicit square icon target instead of textual ellipsis
- all actions use shared Board hover/focus/theme semantics
- desktop controls render at the compact 34px target
- coarse-pointer controls expand to the semantic 44px target

Permission behavior remains unchanged: Members is only rendered for Board managers; Activity remains available under the existing runtime policy; the Board overflow menu is omitted entirely when there are no permitted menu actions.

### 7. Responsive header hierarchy

The header now has explicit responsive composition rather than relying on legacy `board-title-row` rules:

- above 900px: Board identity and actions occupy separate grid regions
- at 900px and below: actions move below Board identity without overlap
- at 760px and below: long titles use bounded two-line presentation, the role remains visible, description may use two lines, and actions become a horizontally safe rail
- coarse-pointer narrow layouts retain 44px targets without document overflow

The obsolete `monday-board-title-row` compatibility selector has been removed from the authoritative Board reconstruction stylesheet.

## Files changed from the Milestone 1 RC baseline

- `assets/css/boards-monday.css`
- `assets/js/features/boards/views/board-workspace-view.ts`
- `tests/browser/run-cdp.mjs`
- `package.json`

## Files added

- `verify-v1432-board-shell-header-m2.mjs`
- `RELEASE-STATUS-v1.43.2-BOARDS-M2-SHELL-HEADER.md`

`CHECKSUMS.sha256` is regenerated at packaging time and therefore also differs from the Milestone 1 archive.

## Verification completed

The following were executed successfully after implementation:

- `npm run typecheck` — PASS
- `npm run verify:types` — PASS
- `npm run verify:vite` — PASS
- `npm run verify:hardening` — PASS
- `npm run verify:ui` — PASS
- `verify-v1432-board-shell-header-m2.mjs` — PASS
- existing Monday-style Board integration verifier — PASS
- Milestone 1 Board foundation verifier — PASS
- `npm run verify` — PASS
- Chromium integration suite — PASS
- complete Work Management project verification — PASS
- TimeTracker release checks — PASS
- FuelTrack+ regression/integration checks — PASS
- TradeLink integration/release/UI checks — PASS

### Board shell/header browser matrix

The dedicated Board presentation audit passes in both light and dark themes for:

- 1440×900 desktop
- 820×980 compact workspace
- 390×844 narrow viewport
- 390×844 coarse-pointer narrow viewport

The audit protects:

- no document-level horizontal overflow
- defined Board header surface
- one-pixel framing and shared radius
- title maximum scale
- compact role badge
- compact editable description
- constrained long breadcrumb
- equal Members/Activity geometry
- square overflow action geometry
- desktop identity/action grid separation
- bounded desktop header height
- non-overlapping compact action rail
- 44px coarse-pointer header targets

Existing Board interaction regressions continue to pass, including drag/drop, selection, undo/redo, explicit inline Save/Cancel, Enter/Escape semantics, no implicit blur-save, configurable Status stable IDs/lifecycle, floating menu containment, Item Workspace stale-response isolation, Updates/Files/Activity shell stability, permissions and responsive containment.

## Compatibility boundaries retained

Milestone 2 intentionally does **not** change:

- Supabase schema, migrations, RLS or RPC contracts
- authentication/session identity
- Work Management host RBAC
- Board repositories, DTOs, domain services or command contracts
- Board/group/column/item/Status stable identifiers
- Board persistence or preference formats
- Table/Kanban business behavior
- TimeTracker source/runtime
- FuelTrack+ source/runtime
- TradeLink source/runtime
- Monday/Vibe runtime dependencies (none are introduced)

The legacy Board declarations in `assets/css/app.css` remain as a compatibility layer. `assets/css/boards-monday.css`, loaded after the application/motion cascade, is authoritative for the reconstructed header. Milestone 2 no longer depends on the legacy `board-title-row`/`monday-board-title-row` header structure, but wholesale removal of older Board CSS remains deferred until later milestones have migrated all Board surfaces and regression tests prove those declarations are unused.

## Remaining reconstruction milestones/modules

Milestone 2 itself is complete. The broader Boards reconstruction continues with:

### Milestone 3 — View Navigation and Command Toolbar
Primary modules:
- `assets/js/features/boards/views/board-workspace-view.ts`
- `assets/js/features/boards/controllers/board-menu-controller.ts`
- `assets/js/features/boards/controllers/board-preference-controller.ts`
- `assets/js/features/boards/controllers/selection-controller.ts`
- `assets/js/features/boards/controllers/overlay-coordinator.ts`
- `assets/css/boards-monday.css`

Target: reconstruct Main Table/Kanban navigation and the New Item/Search/filter/sort/Columns/history/More command surface using one coherent toolbar hierarchy.

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
Cross-cutting presentation, browser and release gates.

## Blocker / unresolved release risk

There is no known Milestone 2 implementation blocker.

The current execution environment still does not have the project-local Vite 8.2.2 executable. A direct `npm run build` attempt therefore returns:

```text
sh: 1: vite: not found
```

As a result, these production-artifact gates remain environment-dependent:

- `npm run verify:dev`
- `npm run build`
- `npm run verify:dist`
- `npm run verify:preview`

On a dependency-enabled development machine run:

```bash
npm ci
npm run release:check
```

If those pass, this Milestone 2 source baseline can be promoted without further Milestone 2 implementation work.

## Milestone verdict

**Milestone 2 — Board Shell and Header Reconstruction is implementation-complete and source/runtime/browser verified.**

No unresolved Milestone 2 functional defect is known. Continuation is required only for Milestone 3 and the subsequent planned Boards reconstruction milestones. Production Vite artifact promotion remains the only environment-specific release gate.
