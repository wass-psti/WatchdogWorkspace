import type { BoardColumn, BoardGroup, BoardItem } from '../../../../../src/features/boards/contracts/domain.ts';
import type { MutableBoardViewState } from '../../../../../src/features/boards/contracts/view-state.ts';
import type { BoardColumnId, BoardItemId } from '../../../../../src/types/identifiers.ts';
import type { EscapeHtml } from '../../../../../src/platform/contracts/ui.ts';
import type { BoardVirtualColumnWindow, BoardVirtualRowWindow } from '../../../../../src/features/boards/virtualization/board-table-virtualization.ts';

export interface BoardTableItemRenderContext {
  readonly logicalRowIndex: number;
  readonly logicalColumnStart: number;
  readonly leadingVirtualColumnWidth: number;
  readonly trailingVirtualColumnWidth: number;
  readonly totalLogicalColumns: number;
}

export interface BoardTableRenderOptions {
  readonly state: MutableBoardViewState;
  readonly groups: readonly BoardGroup[];
  readonly items: readonly BoardItem[];
  readonly visibleColumns: () => readonly BoardColumn[];
  readonly allColumns: () => readonly BoardColumn[];
  readonly canEdit: () => boolean;
  readonly itemMatches: (item: BoardItem) => boolean;
  readonly compareItems: (left: BoardItem, right: BoardItem) => number;
  readonly renderColumnHeader: (column: BoardColumn, logicalColumnIndex: number) => string;
  readonly renderItemRow: (item: BoardItem, group: BoardGroup, columns: readonly BoardColumn[], context: BoardTableItemRenderContext) => string;
  readonly escapeHtml: EscapeHtml;
  readonly isSelected?: (itemId: BoardItemId) => boolean;
  readonly itemNameWidth?: number;
  readonly columnWidth?: (columnId: BoardColumnId) => number;
  readonly rowWindowForGroup?: (groupId: string, totalRows: number) => BoardVirtualRowWindow;
  readonly columnWindow?: BoardVirtualColumnWindow;
}

const GROUP_ACCENTS = Object.freeze(['#5b7cfa', '#7c5ce7', '#e06083', '#dc7a34', '#2f9e73', '#2186a8', '#8b6b45', '#65758b'] as const);
const fullRowWindow = (total: number): BoardVirtualRowWindow => Object.freeze({ enabled: false, start: 0, end: total, leadingHeight: 0, trailingHeight: 0, total });
const fullColumnWindow = (total: number): BoardVirtualColumnWindow => Object.freeze({ enabled: false, start: 0, end: total, leadingWidth: 0, trailingWidth: 0, total });

/** Presentation-only interactive Table renderer for Work Boards. */
export function renderBoardTableView({
  state,
  groups,
  items,
  visibleColumns,
  allColumns,
  canEdit,
  itemMatches,
  compareItems,
  renderColumnHeader,
  renderItemRow,
  escapeHtml,
  isSelected: _isSelected = () => false,
  itemNameWidth = 280,
  columnWidth = () => 160,
  rowWindowForGroup,
  columnWindow,
}: BoardTableRenderOptions): string {
  const esc = escapeHtml;
  const logicalColumns = visibleColumns().filter((column) => column.system_key !== 'title');
  const resolvedColumnWindow = columnWindow ?? fullColumnWindow(logicalColumns.length);
  const renderedColumns = logicalColumns.slice(resolvedColumnWindow.start, resolvedColumnWindow.end);
  const leadingColumnSpacer = resolvedColumnWindow.enabled && resolvedColumnWindow.leadingWidth > 0;
  const trailingColumnSpacer = resolvedColumnWindow.enabled && resolvedColumnWindow.trailingWidth > 0;
  const physicalDynamicColumnCount = renderedColumns.length + Number(leadingColumnSpacer) + Number(trailingColumnSpacer);
  const physicalColumnCount = physicalDynamicColumnCount + 4;
  const totalLogicalColumns = logicalColumns.length + 4;
  const filtered = Boolean(state.itemSearch || state.itemStatus !== 'all' || Object.values(state.boardPrefs.column_filters ?? {}).some(Boolean));
  const selected = new Set((state.selectedItems || []).map(String));
  const collapsed = new Set((state.boardPrefs.collapsed_groups || []).map(String));
  const itemsByGroup = new Map<string, BoardItem[]>();
  for (const item of items) {
    if (!itemMatches(item)) continue;
    const key = String(item.group_id);
    const list = itemsByGroup.get(key);
    if (list) list.push(item);
    else itemsByGroup.set(key, [item]);
  }
  for (const list of itemsByGroup.values()) list.sort(compareItems);

  const safeAccent = (group: BoardGroup, index: number): string => /^#[0-9a-f]{6}$/i.test(String(group.accent_color || ''))
    ? String(group.accent_color)
    : (GROUP_ACCENTS[index % GROUP_ACCENTS.length] ?? '#65758b');
  const spacerCol = (className: string, width: number): string => `<col class="${className}" style="width:${width}px;min-width:${width}px;max-width:${width}px">`;
  const spacerHeader = (className: string, width: number): string => `<th class="board-virtual-column-spacer ${className}" aria-hidden="true" role="presentation" style="width:${width}px;min-width:${width}px;max-width:${width}px"></th>`;

  return `<div class="board-table-view board-sheet-view" role="region" aria-label="Board main table" data-board-virtualization="conditional-row-column-v1">${groups.map((group, groupIndex) => {
    const list = itemsByGroup.get(String(group.id)) ?? [];
    const isCollapsed = collapsed.has(String(group.id));
    const rowWindow = rowWindowForGroup?.(String(group.id), list.length) ?? fullRowWindow(list.length);
    const renderedRows = rowWindow.enabled ? list.slice(rowWindow.start, rowWindow.end) : list;
    const groupVisibleIds = list.map((item) => String(item.id));
    const allGroupSelected = groupVisibleIds.length > 0 && groupVisibleIds.every((id) => selected.has(id));
    const accent = safeAccent(group, groupIndex);
    const countLabel = `${list.length} ${list.length === 1 ? 'item' : 'items'}${filtered ? ' visible' : ''}`;
    const groupId = esc(group.id);
    const groupTitleId = `boardGroupTitle-${groupId}`;
    const emptyTitle = filtered ? 'No items match this view' : 'This group is ready for work';
    const emptyCopy = filtered ? 'Adjust the current search or filters to show matching items.' : 'Add the first item to start tracking work in this group.';
    const leadingRowSpacer = rowWindow.enabled && rowWindow.leadingHeight > 0 ? `<tr class="board-virtual-row-spacer board-virtual-row-spacer--leading" aria-hidden="true" role="presentation"><td colspan="${physicalColumnCount}" style="height:${rowWindow.leadingHeight}px"></td></tr>` : '';
    const trailingRowSpacer = rowWindow.enabled && rowWindow.trailingHeight > 0 ? `<tr class="board-virtual-row-spacer board-virtual-row-spacer--trailing" aria-hidden="true" role="presentation"><td colspan="${physicalColumnCount}" style="height:${rowWindow.trailingHeight}px"></td></tr>` : '';
    const rowMarkup = renderedRows.map((item, offset) => renderItemRow(item, group, renderedColumns, {
      logicalRowIndex: rowWindow.start + offset,
      logicalColumnStart: resolvedColumnWindow.start,
      leadingVirtualColumnWidth: leadingColumnSpacer ? resolvedColumnWindow.leadingWidth : 0,
      trailingVirtualColumnWidth: trailingColumnSpacer ? resolvedColumnWindow.trailingWidth : 0,
      totalLogicalColumns,
    })).join('');
    const inlineAddSpan = physicalDynamicColumnCount + 1;

    return `<section class="board-group board-sheet-group ${isCollapsed ? 'is-collapsed' : ''}" data-group-id="${groupId}" style="--group-accent:${accent}" aria-labelledby="${groupTitleId}">
      <header class="board-group-header board-sheet-group-header" data-group-id="${groupId}" data-drop-group="${group.id}">
        <div class="board-group-identity">
          <span class="group-accent-rail" aria-hidden="true"></span>
          ${canEdit() ? `<span class="group-drag-handle" draggable="true" data-group-drag="${groupId}" role="button" tabindex="0" aria-label="Reorder group ${esc(group.title)}. Use Arrow Up or Arrow Down." title="Drag or use Arrow Up/Down to reorder group">⋮⋮</span>` : ''}
          <button type="button" class="group-collapse" data-toggle-group="${groupId}" aria-expanded="${!isCollapsed}" aria-controls="boardGroupTable-${groupId}" aria-label="${isCollapsed ? 'Expand' : 'Collapse'} ${esc(group.title)}"><span aria-hidden="true">${isCollapsed ? '›' : '⌄'}</span></button>
          <div class="group-heading-copy">
            <button id="${groupTitleId}" type="button" class="group-title-inline" data-rename-group-inline="${groupId}" ${canEdit() ? '' : 'disabled'} title="${canEdit() ? 'Rename group' : esc(group.title)}"><span>${esc(group.title)}</span></button>
            <span class="board-group-count" aria-label="${countLabel}">${countLabel}</span>
          </div>
        </div>
        ${canEdit() ? `<div class="board-group-actions"><button type="button" class="group-add-item-button" data-inline-add-focus="${groupId}"><span aria-hidden="true">+</span><span>Add item</span></button><span class="board-menu-host" data-board-menu-host><button type="button" class="group-more-trigger" data-board-menu-trigger="group" aria-label="More actions for group ${esc(group.title)}" aria-haspopup="menu" aria-expanded="false"><span aria-hidden="true">•••</span></button><template data-board-menu-template><button role="menuitem" data-rename-group="${groupId}">Rename group</button><button role="menuitem" data-group-accent="${groupId}">Change group color</button><hr><button role="menuitem" class="danger-text" data-delete-group="${groupId}">Delete group and items</button></template></span></div>` : ''}
      </header>
      ${isCollapsed ? '' : `<p id="boardGroupHelp-${groupId}" class="wm-visually-hidden">This table can scroll horizontally. Large tables render a moving row and column window while preserving logical row and column positions. Use Tab or arrow keys to move through interactive cells. Column resize handles support Arrow Left and Arrow Right.</p><div id="boardGroupTable-${groupId}" class="board-table-scroll" data-group-table-scroll="${groupId}" role="region" aria-label="${esc(group.title)} table" tabindex="0" aria-describedby="boardGroupHelp-${groupId}"><table class="board-data-table interactive-board-table board-sheet-table" aria-labelledby="${groupTitleId}" aria-rowcount="${list.length + 1}" aria-colcount="${totalLogicalColumns}" data-virtual-columns="${resolvedColumnWindow.enabled ? 'true' : 'false'}"><colgroup><col class="select-col"><col class="drag-col"><col data-column-width-key="__item" style="width:${itemNameWidth}px;min-width:${itemNameWidth}px;max-width:${itemNameWidth}px">${leadingColumnSpacer ? spacerCol('board-virtual-column-spacer-col board-virtual-column-spacer-col--leading', resolvedColumnWindow.leadingWidth) : ''}${renderedColumns.map((column) => { const width = columnWidth(column.id); return `<col data-column-width-key="${column.id}" style="width:${width}px;min-width:${width}px;max-width:${width}px">`; }).join('')}${trailingColumnSpacer ? spacerCol('board-virtual-column-spacer-col board-virtual-column-spacer-col--trailing', resolvedColumnWindow.trailingWidth) : ''}<col class="actions-col"></colgroup><thead><tr aria-rowindex="1"><th scope="col" class="selection-cell" aria-colindex="1"><input class="wm-checkbox board-group-select-all" type="checkbox" data-select-visible="${groupId}" ${allGroupSelected ? 'checked' : ''} aria-label="Select all visible items in ${esc(group.title)}"></th><th scope="col" class="drag-cell" aria-label="Reorder" aria-colindex="2"></th><th scope="col" class="board-item-name-head" data-column-width-key="__item" aria-colindex="3"><div class="identity-column-head"><span>Item</span><span class="board-column-kind">Item name</span>${canEdit() ? `<span class="column-resize-handle" data-column-resize="__item" role="separator" aria-orientation="vertical" aria-label="Resize item column" aria-valuemin="180" aria-valuemax="720" tabindex="0"></span>` : ''}</div></th>${leadingColumnSpacer ? spacerHeader('board-virtual-column-spacer--leading', resolvedColumnWindow.leadingWidth) : ''}${renderedColumns.map((column, offset) => renderColumnHeader(column, resolvedColumnWindow.start + offset)).join('')}${trailingColumnSpacer ? spacerHeader('board-virtual-column-spacer--trailing', resolvedColumnWindow.trailingWidth) : ''}<th scope="col" class="actions-head" aria-colindex="${totalLogicalColumns}">${canEdit() ? '<button type="button" class="add-column-head" data-add-column aria-label="Add column"><span aria-hidden="true">+</span><span>Column</span></button>' : '<span class="board-column-kind">Actions</span>'}</th></tr></thead><tbody class="board-item-list" data-drop-group="${groupId}" data-group-id="${groupId}" data-virtual-row-total="${list.length}" data-virtualized-rows="${rowWindow.enabled ? 'true' : 'false'}">${list.length ? `${leadingRowSpacer}${rowMarkup}${trailingRowSpacer}` : `<tr class="board-empty-row"><td class="group-empty" colspan="${physicalColumnCount}"><div class="board-group-empty-state"><span class="board-empty-mark" aria-hidden="true">${filtered ? '⌕' : '+'}</span><span class="board-empty-copy"><strong>${emptyTitle}</strong><small>${emptyCopy}</small></span>${canEdit() && !filtered ? `<button type="button" class="board-empty-add" data-inline-add-focus="${groupId}">Add first item</button>` : ''}</div></td></tr>`}${canEdit() ? `<tr class="inline-add-row board-group-add-row"><td class="selection-cell" aria-hidden="true"></td><td class="drag-cell" aria-hidden="true"></td><td class="inline-add-cell" colspan="${inlineAddSpan}"><div class="inline-add-shell"><span class="inline-add-plus" aria-hidden="true">+</span><input type="text" data-inline-add-item="${groupId}" maxlength="240" placeholder="Add item" aria-label="Add an item to ${esc(group.title)}"><small>Enter to add · Shift+Enter to add another</small></div></td><td class="item-actions" aria-hidden="true"></td></tr>` : ''}</tbody></table></div>`}
    </section>`;
  }).join('')}${canEdit() ? '<div class="board-add-group-separator"><button type="button" data-add-group><span aria-hidden="true">+</span><span>Add new group</span></button></div>' : ''}${!allColumns().length ? `<div class="board-schema-hint"><span>No custom columns yet.</span>${canEdit() ? '<button type="button" data-add-column>+ Add column</button>' : ''}</div>` : ''}</div>`;
}
