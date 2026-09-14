# Work Management — Stage D M19 Drag-and-Drop Evaluation

## Scope
M19 evaluates whether Work Management should replace or wrap its certified native Board drag/drop controllers with dnd-kit. It is deliberately an **evaluation milestone**, not a production drag/drop migration.

The certified production authorities remain:

- `assets/js/features/boards/controllers/drag-drop-controller.ts` for item reorder, cross-group movement and Kanban status movement;
- `assets/js/features/boards/controllers/structure-drag-controller.ts` for group and column reorder;
- `assets/js/boards-ui.ts` for Board lifecycle integration, command/history wiring and the M18 virtualization drag freeze.

No dnd-kit package is added to `package.json` or `package-lock.json` in M19.

## Evaluated candidates
### Strategic React adapter
- `@dnd-kit/react 0.5.0`
- Modern framework adapter over the current dnd-kit DOM/abstract architecture
- React peer range: React 18 or React 19
- MIT licensed
- Current stable line is still 0.x and is under active development

### DOM bridge candidate
- `@dnd-kit/dom 0.5.0`
- Framework-agnostic DOM implementation that is a closer architectural fit for the current Board DOM presentation island
- Useful as a possible migration bridge, but adopting it while a React drag provider is planned later could create temporary dual ownership

### Legacy reference line
- `@dnd-kit/core 6.3.1`
- `@dnd-kit/sortable 10.0.0`
- Mature and widely deployed, but represents the older dnd-kit package architecture rather than the newer `@dnd-kit/react` / `@dnd-kit/dom` direction

## Existing certified Work Management drag/drop contract
The existing runtime already supports:

- item reordering within Table groups;
- cross-group item movement;
- Kanban status-lane movement;
- group reordering;
- column reordering;
- keyboard reorder commands with Arrow/Home/End semantics;
- focus restoration and live-region announcements;
- optimistic local movement;
- command-service persistence;
- rollback on failed persistence;
- undo/redo history integration;
- explicit listener disposal using `AbortController`;
- protection against drag activation from interactive controls;
- same-target/no-op suppression;
- M18 virtualization window freezing while an item drag owns a mounted source row.

Any library migration must prove parity for all of these behaviors rather than merely reproduce pointer dragging.

## Evaluation result
**`defer-production-adoption`**

dnd-kit is a strong strategic fit. Its sensor model, keyboard/accessibility infrastructure, collision primitives, sortable helpers, drag overlay support and multi-framework architecture are materially better foundations than expanding bespoke native drag code indefinitely.

M19 does not approve immediate production adoption because the migration boundary is not yet safe:

1. **Current surface ownership:** the Board route has a React presentation facade, but the actual item/group/column drag surfaces are still rendered and bound inside the certified DOM Board engine.
2. **Domain command ownership:** movement persistence must continue through `BoardCommandService`, not through a UI library.
3. **Optimistic history:** existing local mutation, rollback, undo and redo semantics are product-owned and must survive any sensor/provider migration.
4. **Virtualization coupling:** M18 freezes virtual-window rerenders while a native drag source row is mounted; a dnd-kit adapter must reproduce equivalent source stability.
5. **Accessibility parity:** generic keyboard support is insufficient unless the existing Arrow/Home/End behavior, focus recovery and Work Management live announcements remain intact.
6. **Interaction isolation:** menus, inline editors, links, resize handles and global overlays must not become accidental drag activators.
7. **Release maturity:** the modern React/DOM package line is 0.5.x, so a production migration should be preceded by an isolated browser-parity spike rather than performed directly in the certified Board path.

## Recommended next gate
A later milestone may create an isolated adapter spike. That spike should choose exactly one ownership model:

- a React `DragDropProvider` after the relevant Board drag surfaces are React-owned; or
- a temporary `@dnd-kit/dom` bridge with an explicit removal boundary.

The spike must prove Table item reorder, cross-group movement, Kanban status movement, group reorder, column reorder, keyboard operation, screen-reader announcements, touch/pointer behavior, overlay/editor isolation, command/history rollback, route cleanup and M18 virtualization stability before production adoption can be reconsidered.

## Architecture and backend boundary
M19 is evaluation-only and keeps **Architecture Version 27**. It introduces no runtime architecture ownership change, no production dependency, and **No Supabase migration**.
