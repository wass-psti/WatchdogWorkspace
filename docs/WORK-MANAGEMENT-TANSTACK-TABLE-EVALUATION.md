# Work Management — Stage D M17 TanStack Table Evaluation

## Scope
M17 evaluates **@tanstack/react-table 9.2.4** against the certified Work Management Board Table contracts. It is deliberately an evaluation milestone, not a production table migration.

The current production Board Table continues to use `assets/js/features/boards/views/table-view.ts` behind `assets/js/boards-ui.ts`. M17 adds a typed, executable compatibility profile that distinguishes what TanStack Table can provide natively, what requires a Work Management adapter, and what must remain outside the table library.

## Decision
**`defer-production-adoption`**

The evaluated package is the observed current `@tanstack/react-table` **9.2.4** release on 2026-09-07. Its documented React compatibility is React 18 or newer, so React 19.2 is within the supported range. The package is MIT licensed. M17 still records a maturity risk because v9 is a recent major line and the Work Management Board surface has unusually deep interaction semantics.

TanStack Table is a strong candidate for a future React Board Table state/model layer because it is headless and provides configurable columns, row identity, sorting/filtering, selection, sizing, ordering, and related table-state primitives. It is **not** a drop-in replacement for the current Board implementation.

## Capability matrix
| Work Management requirement | Evaluation | Production implication |
| --- | --- | --- |
| React 19.2 compatibility | Native fit | Supported adapter range includes React 19.2. |
| Product-owned markup/styling | Native fit | Headless model can preserve Monday-style DOM/CSS. |
| Stable item IDs / dynamic columns | Native fit | Candidate can model stable rows and configurable columns. |
| Sorting/filtering/selection | Adapter required | Existing Board preferences/selection remain authoritative. |
| Column sizing/order/sticky identity | Adapter required | Candidate state can assist, but persistence/keyboard/sticky geometry remain product code. |
| Board group sections | External | Current group header/collapse/drop semantics must remain outside generic row grouping. |
| Typed inline editors | External | Explicit Enter/Escape/save/cancel and no-save-on-blur remain Work Management logic. |
| Item/group/column drag-drop | External | Candidate does not replace the certified drag/drop/reorder controllers. |
| Optimistic persistence + history | External | Domain service, command service, rollback, undo/redo remain authoritative. |
| Keyboard/accessibility contracts | External | Existing grid navigation, resize/reorder, focus restoration, ARIA remain product-owned. |
| TanStack Query server state | External | Table must consume resolved Board data; it cannot become fetch/cache authority. |
| Zustand/client preferences | Adapter required | Table state must be controlled or translated, not become a competing store. |
| Item Workspace / overlays | External | M11 and existing Board workspace/overlay authorities remain unchanged. |

The critical behaviors that remain product-owned include:
- Board groups as independent collapsible sections with group actions and drop targets.
- Typed inline editors with explicit Enter/Escape/save/cancel and no save-on-blur.
- Item/group/column drag/drop and keyboard structural reordering.
- Optimistic command orchestration, rollback, undo/redo, and persistence ordering.
- Work Management keyboard-grid/accessibility behavior.
- M11 overlays, menus, dialogs, and Item Workspace.
- TanStack Query server state and Zustand/client preference ownership.

## Evaluation authorities
- `src/app/boards/evaluation/board-table-requirements.ts` — product requirements and support classification.
- `src/app/boards/evaluation/tanstack-table-evaluation.ts` — candidate metadata, support counts, decision, and next adoption gate.
- `scripts/verify-tanstack-table-evaluation-execution.mjs` — executable decision vectors.

## Dependency boundary
M17 does **not** add `@tanstack/react-table` to `dependencies`, `devDependencies`, or the lockfile. This prevents an evaluation-only milestone from increasing the certified production dependency surface. A later adoption/spike milestone must explicitly govern any package installation.

## Compatibility boundary
The certified M16 React Board component decomposition remains intact. `BoardPresentationFacade`, `BoardPresentationRouteBoundary`, and `BoardPresentationSurface` do not import the evaluation code. The production compatibility host and imperative Board engine remain unchanged.

## Adoption gate for a later milestone
A production spike should occur only after all of the following are defined and browser-tested:
1. controlled table-state adapters that preserve Zustand and Board preference authority;
2. stable Board item/group/column ID mapping;
3. grouped-section composition that preserves current DOM/ARIA/drop behavior;
4. typed cell-editor integration with explicit save/cancel semantics;
5. drag/drop and keyboard reorder parity;
6. sticky identity/action column and horizontal-scroll parity;
7. full M6-M16 regression and browser accessibility parity;
8. a separately governed package/version and lockfile change.

## Data / backend impact
No Supabase migration. No database schema, RPC, RLS, transport DTO, repository, query-key, authorization, or persisted Board-data change.
