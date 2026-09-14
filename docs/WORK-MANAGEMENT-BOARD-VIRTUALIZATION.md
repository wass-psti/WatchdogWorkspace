# Work Management Board Virtualization — Stage D M18

Milestone 18 introduces conditional **row and column windowing** for the existing Work Management Board Table while preserving the M17 decision to defer production adoption of TanStack Table.

## Authorities

- Planner: `src/features/boards/virtualization/board-table-virtualization.ts`
- Runtime viewport/navigation controller: `assets/js/features/boards/controllers/board-table-virtualization-controller.ts`
- Production Table renderer: `assets/js/features/boards/views/table-view.ts`
- Existing Board interaction engine: `assets/js/boards-ui.ts`

Architecture Version 27 declares `conditional-row-column-windowing-v1`.

## Policy

Row virtualization activates at 160 logical rows, uses 16-row overscan, and chunk-aligns windows in blocks of 8. Column virtualization activates at 18 dynamic columns and uses 320px pixel overscan. Small Boards retain complete semantic rendering.

The 40/44/48px Board density contract remains authoritative. When any visible Board column is configured for wrapped text, row virtualization is disabled because those rows may become variable-height. Column virtualization remains available.

Native drag keeps its currently mounted window frozen so the drag source cannot be destroyed during browser drag ownership. Keyboard structural reordering remains state-driven and is not limited by mounted DOM rows.

## Accessibility and interaction

Virtualized tables publish complete logical `aria-rowcount` and `aria-colcount` values. Mounted data rows and cells publish logical `aria-rowindex` and `aria-colindex` coordinates. Arrow-key navigation operates on Board state rather than DOM enumeration; unmounted logical targets are revealed before focus moves.

Sticky selection, drag, Item identity, and action columns remain mounted. Horizontal Board group scrollers remain synchronized.

## Scope boundary

M18 reduces DOM/rendering cost for Board data that is already present in client memory. It does not replace the data-layer roadmap for very large Boards. **Server-side pagination**, filtering, sorting, incremental loading, and selective realtime subscriptions remain separate scalability work.

No `@tanstack/react-table` or external virtualization package is introduced. TanStack Query remains server-state authority and Zustand remains scoped client-state authority.

**No Supabase migration** is required.

The data-layer follow-up explicitly includes server-side pagination, filtering, sorting, incremental loading, and selective realtime subscriptions.
