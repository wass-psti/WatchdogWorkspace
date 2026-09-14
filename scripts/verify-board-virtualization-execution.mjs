import assert from 'node:assert/strict';
import { calculateBoardVirtualColumnWindow, calculateBoardVirtualRowWindow, BOARD_TABLE_VIRTUALIZATION_POLICY } from '../src/features/boards/virtualization/board-table-virtualization.ts';
import { renderBoardTableView } from '../assets/js/features/boards/views/table-view.ts';
import { renderBoardColumnHeader, renderBoardItemRow } from '../assets/js/features/boards/views/board-workspace-view.ts';

const smallRows = calculateBoardVirtualRowWindow({ totalRows: 80, scrollOffset: 0, viewportHeight: 800, rowHeight: 44 });
assert.equal(smallRows.enabled, false);
assert.equal(smallRows.end, 80);
const largeRows = calculateBoardVirtualRowWindow({ totalRows: 1000, scrollOffset: 4400, viewportHeight: 880, rowHeight: 44 });
assert.equal(largeRows.enabled, true);
assert.ok(largeRows.end - largeRows.start < 1000);
assert.equal(largeRows.leadingHeight + (largeRows.end - largeRows.start) * 44 + largeRows.trailingHeight, 44000);
const wrappedFallback = calculateBoardVirtualRowWindow({ totalRows: 1000, scrollOffset: 4400, viewportHeight: 880, rowHeight: 44, forceFull: true });
assert.equal(wrappedFallback.enabled, false);

const widths = Array.from({ length: 30 }, (_, index) => 120 + (index % 3) * 20);
const largeColumns = calculateBoardVirtualColumnWindow({ widths, scrollOffset: 1200, viewportWidth: 900 });
assert.equal(largeColumns.enabled, true);
assert.ok(largeColumns.end - largeColumns.start < widths.length);
const totalWidth = widths.reduce((sum, width) => sum + width, 0);
const mountedWidth = widths.slice(largeColumns.start, largeColumns.end).reduce((sum, width) => sum + width, 0);
assert.equal(largeColumns.leadingWidth + mountedWidth + largeColumns.trailingWidth, totalWidth);
const smallColumns = calculateBoardVirtualColumnWindow({ widths: widths.slice(0, 8), scrollOffset: 0, viewportWidth: 900 });
assert.equal(smallColumns.enabled, false);

const columns = Array.from({ length: 24 }, (_, index) => ({ id: `c${index}`, board_id: 'b', name: `Column ${index}`, data_type: 'text', position: index, required: false, options: [], system_key: null, width: 160 }));
const items = Array.from({ length: 500 }, (_, index) => ({ id: `i${index}`, board_id: 'b', group_id: 'g', title: `Item ${index}`, status: null, assignee_id: null, due_date: null, notes: '', position: index, archived_at: null }));
const state = { itemSearch: '', itemStatus: 'all', boardPrefs: { column_filters: {}, collapsed_groups: [] }, selectedItems: [], itemPanel: { itemId: null } };
const markup = renderBoardTableView({
  state,
  groups: [{ id: 'g', board_id: 'b', title: 'Group', position: 0, accent_color: '#5b7cfa' }],
  items,
  visibleColumns: () => columns,
  allColumns: () => columns,
  canEdit: () => true,
  itemMatches: () => true,
  compareItems: (a, b) => a.position - b.position,
  renderColumnHeader: (column, logicalIndex) => renderBoardColumnHeader({
    column,
    canEdit: true,
    sort: { id: '', direction: 'none' },
    filter: '',
    wrapped: false,
    columnTypeLabel: (type) => type,
    escapeHtml: (value) => String(value),
    logicalColumnIndex: logicalIndex,
  }),
  renderItemRow: (item, group, mountedColumns, context) => renderBoardItemRow({
    state,
    item,
    group,
    columns: mountedColumns,
    canEdit: true,
    isWrapped: () => false,
    formatCell: () => '<span>Value</span>',
    escapeHtml: (value) => String(value),
    isSelected: false,
    ...context,
  }),
  escapeHtml: (value) => String(value),
  rowWindowForGroup: () => calculateBoardVirtualRowWindow({ totalRows: items.length, scrollOffset: 4400, viewportHeight: 880, rowHeight: 44 }),
  columnWindow: calculateBoardVirtualColumnWindow({ widths: columns.map(() => 160), scrollOffset: 1200, viewportWidth: 900 }),
});
assert.match(markup, /data-board-virtualization="conditional-row-column-v1"/);
assert.match(markup, /data-virtualized-rows="true"/);
assert.match(markup, /data-virtual-columns="true"/);
assert.match(markup, /aria-rowcount="501"/);
assert.match(markup, /aria-colcount="28"/);
assert.match(markup, /board-virtual-row-spacer/);
assert.match(markup, /board-virtual-column-spacer/);
assert.ok((markup.match(/class="board-item-row/g) ?? []).length < items.length);
assert.ok((markup.match(/class="board-column-head/g) ?? []).length < columns.length);
assert.match(markup, /data-virtual-row-index="\d+" aria-rowindex="\d+"/);
assert.match(markup, /data-grid-column-index="\d+"/);
assert.match(markup, /class="item-actions" aria-colindex="28"/);
assert.equal(BOARD_TABLE_VIRTUALIZATION_POLICY.rowThreshold, 160);
assert.equal(BOARD_TABLE_VIRTUALIZATION_POLICY.columnThreshold, 18);
console.log('Stage D M18 Board virtualization execution vectors: PASS');
