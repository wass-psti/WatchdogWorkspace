# M69 Data Presentation & Dense-Data UI Architecture

M69 establishes a shared presentation and semantic contract for dense tables and lists without introducing a competing data/state engine.

## Ownership
- Native HTML table/list semantics remain the default authority.
- `.wm-data-region`, `.wm-table`, and `.wm-data-list*` provide shared presentation containment.
- Sorting, filtering, row selection, persistence, virtualization, sticky geometry, drag/drop, editing, and domain state remain feature-owned.
- Boards retains its certified virtualization, sizing, selection, history, drag/drop, and editor authorities.
- Stage D M17 remains authoritative: TanStack Table production adoption is deferred and M69 does not install it.

## Shared contracts
M69 standardizes compact/default density, auto/fixed table layout, start/center/end alignment, wrap/nowrap/truncate presentation, `aria-sort` on native header cells, stable horizontal overflow containment, and list current-row presentation.

## Accessibility
Truncation is visual only and must not replace accessible content. Numeric alignment uses tabular figures. Sort state is exposed on `<th>`, not via presentation-only icons. Native `<table>`, `<th>`, `<td>`, `<ul>`, and `<li>` semantics are preserved.

## Successors
M70 owns dashboard/analytics presentation. M72–M76 own controlled consumer migrations; M73 owns Boards migration. M69 requires no consumer rewrite.
