# Work Management App v1.43.2 — Boards Milestone 4 Main Table Reconstruction

## Milestone verdict

**Milestone 4 — Main Table Reconstruction is implementation-complete at its defined scope.**

The Board Main Table has been reconstructed on top of the Milestone 1 semantic design foundation, Milestone 2 shell/header, and Milestone 3 view/toolbar. The existing Board domain model, Supabase contracts, stable identifiers, RBAC, persistence, command service, inline editing, drag/drop, selection, history, Item Workspace, and embedded applications remain authoritative and unchanged.

The source/runtime/browser gates available in this environment pass. The package remains an **RC** because the environment does not contain the project-local Vite 8.2.2 executable and `npm ci --ignore-scripts` could not complete before the execution transport timeout, so `build`, `verify:dist`, and `verify:preview` cannot be promoted here.

## Implementation scope completed

### 1. Group hierarchy reconstructed

The group header is now one integrated structural row rather than disconnected controls around the table. It includes:

- semantic group accent rail
- collapse/expand control
- drag/reorder affordance
- editable group title using the existing rename workflow
- explicit item count badge, including filtered-visible count semantics
- contextual Add item action
- existing three-dot group action menu
- collapsed-state treatment that remains a valid item drop target

The group title and table are explicitly associated with `aria-labelledby`, and collapse controls expose `aria-controls`/`aria-expanded`.

### 2. Spreadsheet frame and overflow containment

Each group owns a dedicated keyboard-focusable horizontal scroll region. The spreadsheet now has:

- semantic surface border and radius
- group-accent left edge integrated into the table frame
- stable `table-layout: fixed` geometry
- minimum spreadsheet width driven by semantic tokens
- overscroll containment
- no document-level horizontal overflow for wide schemas
- visible focus treatment on the scroll region

### 3. Frozen identity band

Desktop/tablet Main Table layouts now intentionally freeze:

1. selection column
2. drag/reorder column
3. Item identity column

The action column remains frozen at the right edge.

For narrow workspaces, the utility selection/drag columns release from sticky positioning while the Item identity column remains frozen at the left edge. This prevents the utility band from consuming most of a phone-sized viewport while preserving item context during horizontal scrolling.

### 4. Column header reconstruction

Column headers now provide a consistent compact command surface for:

- column title
- drag/reorder lane
- quick sort
- contextual actions
- resize edge
- sorted/filtered active state
- Add column

Sorted columns expose `aria-sort` and sorted/filtered columns receive a visual state marker. Resize handles use a dedicated semantic hit-area token rather than an arbitrary narrow edge.

Existing hooks are preserved for rename/configure, filter, sort, wrap, duplicate, add-right, change type, hide, delete, drag reorder, and resize persistence.

### 5. Row hierarchy and state language

Rows use the established semantic density contract and now have coordinated presentation for:

- 44px default row geometry
- selection checkbox
- drag handle
- group-accent identity marker inside the Item cell
- primary item name navigation
- rename action
- item-details action
- typed data cells
- row action menu
- hover state
- keyboard focus-within state
- selected state
- detail-open state
- drag source opacity
- before/after drop indicators

Rows expose `aria-selected` without replacing the existing selection controller.

### 6. Sticky Item identity and action reachability

The primary Item column is now the explicit frozen identity surface. It retains the configured/persisted item-column width and remains usable during horizontal schema scrolling. The right-side item action column remains reachable even when the user is scrolled far across a wide Board.

### 7. Empty-group state

An empty group no longer presents an undifferentiated blank grid. It now renders an in-grid operational empty state with:

- group-aware visual marker
- clear empty-state title
- concise guidance
- Add first item affordance when editable and not filtered

Filtered empty groups use a separate explanation instead of incorrectly implying the group has no stored items.

### 8. In-grid item creation

The Add item row remains part of the spreadsheet and retains the existing creation workflow:

- `data-inline-add-item`
- Enter to add
- Shift+Enter to add another
- explicit inline focus entry points

Its dimensions, focus state, accent treatment, and helper copy are now coordinated with the reconstructed table geometry.

### 9. Semantic Main Table tokens

The shared Board design foundation was extended only for Main Table roles that did not previously exist:

- `--wm-board-drag-cell-width: 28px`
- `--wm-board-action-cell-width: 44px`
- `--wm-board-column-resize-hit-width: 10px`
- `--wm-board-item-column-min-width: 220px`
- `--wm-board-table-min-width: 820px`
- `--wm-board-empty-state-min-height: 84px`

These are role-based geometry tokens rather than selector-local magic numbers.

## Existing functionality preserved and verified

The reconstruction preserves the existing Board engine and its established hooks for:

- Table/Kanban switching
- Board loading and persistence
- group creation, rename, color, collapse, reorder and deletion
- item creation, open, rename, duplicate, archive, restore and deletion
- typed-cell editing
- explicit Save/Cancel behavior
- Enter confirm and Escape cancel
- no save-on-blur
- group-scoped and range selection
- column creation/configuration
- column resize persistence and history
- column reorder persistence
- column filter/sort/wrap/hide/delete operations
- stable Status IDs and configurable Status lifecycle
- item drag/reorder and cross-group movement
- Undo/Redo
- floating menu portal geometry
- overlay exclusivity and outside-click isolation
- Item Workspace
- Updates / Files / Activity
- RBAC and server-authoritative authorization
- TimeTracker, FuelTrack+, and TradeLink integration boundaries

No Board repository, command-service, Supabase migration, RLS policy, authentication, or host-RBAC modification was required for Milestone 4.

## Verification

The following gates passed after the final M4 implementation:

- `npm run typecheck` — PASS
- `npm run verify:types` — PASS
- `npm run verify:vite` architecture/static migration gate — PASS
- `npm run verify:hardening` — PASS
- `npm run verify:ui` — PASS
- `npm run verify` — PASS
- `npm run check` — PASS
- `verify-v1432-board-monday-integration.mjs` — PASS
- `verify-v1432-board-design-foundation-m1.mjs` — PASS
- `verify-v1432-board-shell-header-m2.mjs` — PASS
- `verify-v1432-board-view-toolbar-m3.mjs` — PASS
- `verify-v1432-board-main-table-m4.mjs` — PASS
- Chromium Board interaction/regression suite — PASS
- Main Table M4 desktop light/dark audit — PASS
- Main Table M4 compact light/dark audit — PASS
- Main Table M4 narrow light/dark audit — PASS
- Main Table M4 coarse-pointer narrow light/dark audit — PASS
- wide-schema containment — PASS
- 44px default row density — PASS
- 40px column-header density — PASS
- sticky desktop utility/Item columns — PASS
- narrow sticky-Item fallback — PASS
- sticky right action column — PASS
- resize hit lane — PASS
- selected-row group identity — PASS
- empty-state geometry — PASS
- in-grid Add item row — PASS
- TimeTracker regressions — PASS
- FuelTrack+ regressions — PASS
- TradeLink regressions — PASS

The Milestone 4 verifier is part of the normal `verify:ui` gate so future milestones cannot silently remove the M4 hierarchy, accessibility associations, sticky geometry, empty-state contract, or semantic table tokens.

## Exact M4 source delta from the Milestone 3 RC

Before release documentation/checksum regeneration, the implementation delta was limited to:

### Modified

- `assets/css/foundation/tokens.css`
- `assets/css/boards-monday.css`
- `assets/js/features/boards/views/table-view.ts`
- `assets/js/features/boards/views/board-workspace-view.ts`
- `tests/browser/run-cdp.mjs`
- `package.json`

### Added

- `verify-v1432-board-main-table-m4.mjs`
- `RELEASE-STATUS-v1.43.2-BOARDS-M4-MAIN-TABLE.md`

### Regenerated for packaging

- `CHECKSUMS.sha256`

No unrelated application files were modified.

## Modules reviewed that did not require behavioral changes

The following modules were explicitly kept behind their existing stable contracts because their behavior already satisfies M4 and passed regression verification:

- `assets/js/features/boards/controllers/group-workflows.ts`
- `assets/js/features/boards/controllers/item-workflows.ts`
- `assets/js/features/boards/controllers/inline-edit-controller.ts`
- `assets/js/features/boards/controllers/column-workflows.ts`
- `assets/js/features/boards/controllers/column-resize-controller.ts`
- `assets/js/features/boards/controllers/structure-drag-controller.ts`
- `assets/js/features/boards/controllers/drag-drop-controller.ts`
- `assets/js/features/boards/controllers/selection-controller.ts`

The milestone therefore reconstructs the Main Table presentation and semantic structure without duplicating or destabilizing already-correct controller logic.

## Temporary compatibility boundaries

### Legacy Board CSS

`assets/css/app.css` still contains historical Board selectors required by surfaces that have not yet completed their reconstruction milestones. `assets/css/boards-monday.css` loads later and is authoritative for the M1–M4 reconstructed surfaces.

This seam should remain until the cell-type system, overlay system, Kanban, and Item Workspace have completed their dedicated migrations. Wholesale deletion now would create unnecessary regressions.

### Existing command/controller hooks

M4 intentionally preserves existing `data-*` hooks and controller ownership. The visual reconstruction does not create parallel item/group/column state or persistence paths.

### Monday/Vibe boundary

Monday/Vibe remains a visual and interaction reference only. No React/Vibe runtime dependency, vendor-specific backend assumption, or Monday-specific persisted model has been introduced.

## Remaining reconstruction roadmap

There are **no unfinished modules inside Milestone 4 itself**.

The next milestone is **Milestone 5 — Cell and Column Visual System**, centered on the rendering/editing presentation of Status, People, Date, Dropdown, Text, Numeric, Checkbox, Link/Email, Timeline, and other typed cells while retaining the M4 table geometry.

After M5:

- M6 — Menus, Popovers, Dialogs and Microinteractions
- M7 — Kanban and Item Workspace Harmonization
- M8 — Responsive, Accessibility and Final Production Polish

## Blocker / unresolved release risk

There is no known M4 source/runtime blocker.

The remaining release-environment limitation is production artifact generation:

```text
npm run build
> vite build
sh: 1: vite: not found
```

An attempt to restore package-local dependencies with `npm ci --ignore-scripts` could not complete before the container transport timeout, and the Vite executable remained unavailable. Therefore this environment cannot truthfully mark the following production-artifact gates as passed:

- `verify:dev`
- `build`
- `verify:dist`
- `verify:preview`

On a normal dependency-enabled local environment, run:

```bash
npm ci
npm run release:check
```

If those gates pass, this exact RC can be promoted without another Milestone 4 implementation pass.
