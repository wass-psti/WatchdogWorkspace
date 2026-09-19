import type { BoardColumn, BoardColumnType, BoardGroup, BoardItem, BoardRecord, StatusLabel } from '../../../../../src/features/boards/contracts/domain.ts';
import type { MutableBoardViewState } from '../../../../../src/features/boards/contracts/view-state.ts';
import type { BoardRealtimeSnapshot } from '../../../../../src/features/boards/contracts/realtime.ts';
import type { BoardColumnId } from '../../../../../src/types/identifiers.ts';
import type { EscapeHtml, IconSet } from '../../../../../src/platform/contracts/ui.ts';
import { BOARD_ROLE_LABELS } from '../board-schema.ts';
import { buttonClass, fieldControlClass, iconButtonClass, toolbarClass } from '../../../platform/ui/primitives.ts';


export interface BoardHistoryPresentationState {
  readonly canUndo?: boolean;
  readonly canRedo?: boolean;
  readonly undoLabel?: string | null;
  readonly redoLabel?: string | null;
}

export interface BoardSortPresentationState {
  readonly id: BoardColumnId | string | null;
  readonly direction: 'asc' | 'desc' | null;
}

export interface BoardHeaderRenderOptions {
  readonly board: BoardRecord;
  readonly canEdit: boolean;
  readonly canManage: boolean;
  readonly icons: IconSet;
  readonly escapeHtml: EscapeHtml;
  readonly realtime?: BoardRealtimeSnapshot | null;
}

export interface BoardControlsRenderOptions {
  readonly state: MutableBoardViewState;
  readonly canEdit: boolean;
  readonly icons: IconSet;
  readonly escapeHtml: EscapeHtml;
  readonly historyState?: BoardHistoryPresentationState;
  readonly statusLabels?: readonly StatusLabel[];
}

export interface BoardItemRowRenderOptions {
  readonly state: MutableBoardViewState;
  readonly item: BoardItem;
  readonly group: BoardGroup;
  readonly columns: readonly BoardColumn[];
  readonly canEdit: boolean;
  readonly canReorder?: boolean;
  readonly isWrapped: (columnId: BoardColumnId | string) => boolean;
  readonly formatCell: (item: BoardItem, column: BoardColumn) => string;
  readonly escapeHtml: EscapeHtml;
  readonly isSelected?: boolean;
  readonly logicalRowIndex?: number;
  readonly logicalColumnStart?: number;
  readonly leadingVirtualColumnWidth?: number;
  readonly trailingVirtualColumnWidth?: number;
  readonly totalLogicalColumns?: number;
}

export interface BoardColumnHeaderRenderOptions {
  readonly column: BoardColumn;
  readonly canEdit: boolean;
  readonly sort: BoardSortPresentationState;
  readonly filter: string;
  readonly wrapped: boolean;
  readonly columnTypeLabel: (columnType: BoardColumnType) => string;
  readonly escapeHtml: EscapeHtml;
  readonly logicalColumnIndex?: number;
}

const COLUMN_TYPE_GLYPHS: Readonly<Record<BoardColumnType, string>> = Object.freeze({
  text: 'T', long_text: '¶', number: '#', status: '●', dropdown: '⌄', date: '□', people: '◉', checkbox: '✓', timeline: '↔', email: '@', url: '↗',
});

function cellActionLabel(column: BoardColumn, itemTitle: string, canEdit: boolean): string {
  if (!canEdit) return `View ${column.name} for ${itemTitle}`;
  switch (column.data_type) {
    case 'checkbox': return `Toggle ${column.name} for ${itemTitle}`;
    case 'people': return `Assign ${column.name} for ${itemTitle}`;
    case 'status': return `Change ${column.name} for ${itemTitle}`;
    case 'date': return `Edit ${column.name} date for ${itemTitle}`;
    case 'timeline': return `Edit ${column.name} timeline for ${itemTitle}`;
    case 'dropdown': return `Choose ${column.name} for ${itemTitle}`;
    case 'email': return `Edit ${column.name} email for ${itemTitle}`;
    case 'url': return `Edit ${column.name} link for ${itemTitle}`;
    case 'number':
    case 'text':
    case 'long_text': return `Edit ${column.name} for ${itemTitle}`;
  }
  throw new Error('Unsupported Board column type.');
}

/** Shared board workspace chrome and Table composition primitives. */
export function renderBoardHeader({ board, canEdit, canManage, icons, escapeHtml, realtime = null }: BoardHeaderRenderOptions): string {
  const esc = escapeHtml;
  const roleLabel = board.member_role ? (BOARD_ROLE_LABELS[board.member_role] ?? board.member_role) : 'Viewer';
  const description = board.description?.trim() || 'Add a description so collaborators understand what this board tracks.';
  const descriptionPlaceholder = !board.description?.trim();
  const action = buttonClass({ tone: 'ghost', size: 'sm' }, 'secondary-btn board-head-action');
  const more = iconButtonClass({ tone: 'ghost', size: 'sm' }, 'secondary-btn board-more-trigger');
  const breadcrumbBack = buttonClass({ tone: 'ghost', size: 'sm' }, 'board-back');
  const activityIcon = '<svg class="board-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2"/><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 4v5h-5"/></svg>';
  const editIcon = '<svg class="board-description-edit-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.75 4.25L7.5 19.5 18.7 8.3a2.12 2.12 0 0 0-3-3L4 16Z"/><path d="m13.9 7.1 3 3"/></svg>';
  const moreIcon = '<svg class="board-more-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>';
  const menu = `${canEdit ? '<button role="menuitem" data-board-edit>Edit board details</button><button role="menuitem" data-board-columns>Manage columns</button><hr><button role="menuitem" data-board-duplicate-current>Duplicate board</button>' : ''}${canManage ? '<button role="menuitem" data-board-archive-current>Archive board</button><button role="menuitem" class="danger-text" data-board-trash-current>Move board to trash</button>' : ''}`;
  const descriptionMarkup = canEdit
    ? `<button type="button" class="board-description-control${descriptionPlaceholder ? ' is-placeholder' : ''}" data-board-edit title="Edit board details" aria-label="Edit board details"><span class="board-description-text">${esc(description)}</span>${editIcon}</button>`
    : `<p class="board-description-static${descriptionPlaceholder ? ' is-placeholder' : ''}">${esc(description)}</p>`;
  const realtimeLabel = (() => {
    if (!realtime) return 'Live unavailable';
    const online = realtime.collaborators.length;
    const suffix = realtime.fallbackPolling ? ' · polling' : '';
    switch (realtime.state) {
      case 'live': return `Live${online > 1 ? ` · ${online} online` : ''}`;
      case 'connecting': return 'Syncing';
      case 'reconnecting': return `Reconnecting${suffix}`;
      case 'offline': return `Offline${suffix}`;
      case 'error': return `Live unavailable${suffix}`;
      case 'idle': return 'Live paused';
    }
  })();
  const realtimeTone = realtime?.state === 'live' ? 'is-live' : realtime?.state === 'connecting' || realtime?.state === 'reconnecting' ? 'is-syncing' : 'is-degraded';

  return `<section class="board-detail-head monday-board-head" data-board-header aria-labelledby="board-workspace-title">
    <nav class="board-breadcrumb" aria-label="Board breadcrumb">
      <button type="button" class="${breadcrumbBack}" data-board-back aria-label="Back to Boards">${icons.back}<span>Boards</span></button>
      <span class="board-breadcrumb-separator" aria-hidden="true">/</span>
      <span class="board-breadcrumb-current" aria-current="page" title="${esc(board.name)}">${esc(board.name)}</span>
    </nav>
    <div class="board-header-main">
      <div class="board-title-copy">
        <div class="board-title-line">
          <h2 id="board-workspace-title" title="${esc(board.name)}">${esc(board.name)}</h2>
          <span class="board-role-badge" aria-label="Your role on this board: ${esc(roleLabel)}">${esc(roleLabel)}</span>
        </div>
        ${descriptionMarkup}
      </div>
      <div class="${toolbarClass('board-head-actions')}" aria-label="Board actions">
        <span class="board-realtime-status ${realtimeTone}" data-board-realtime-status role="status" aria-live="polite" title="Collaborative Board synchronization status"><span class="board-realtime-dot" aria-hidden="true"></span><span>${esc(realtimeLabel)}</span></span>
        ${canManage ? `<button type="button" class="${action}" data-board-members title="Manage board access and member roles">${icons.users ?? ''}<span>Members</span></button>` : ''}
        <button type="button" class="${action}" data-board-activity title="Review recent changes to this board">${activityIcon}<span>Activity</span></button>
        ${menu ? `<span class="board-head-action-divider" aria-hidden="true"></span><span class="board-menu-host board-head-menu-host" data-board-menu-host><button type="button" class="${more}" data-board-menu-trigger="board" aria-label="More actions for this board" aria-haspopup="menu" aria-expanded="false" title="More board actions">${moreIcon}</button><template data-board-menu-template>${menu}</template></span>` : ''}
      </div>
    </div>
  </section>`;
}

export function renderBoardControls({ state, canEdit, icons, escapeHtml, historyState = {}, statusLabels = [] }: BoardControlsRenderOptions): string {
  const esc = escapeHtml;
  const columns = state.board?.columns ?? [];
  const visibleColumns = columns.filter((column) => column.visible !== false);
  const peopleColumn = visibleColumns.find((column) => column.data_type === 'people') ?? null;
  const activeColumnFilters = Object.entries(state.boardPrefs.column_filters ?? {})
    .filter(([, value]) => String(value ?? '').trim());
  const columnFilterCount = activeColumnFilters.length;
  const statusFilterActive = state.itemStatus !== 'all';
  const activeFilterCount = columnFilterCount + (statusFilterActive ? 1 : 0);
  const sorted = Boolean(state.boardPrefs.sort_column_id && state.boardPrefs.sort_direction);
  const view = state.board?.board?.view_mode ?? state.board?.board?.view ?? 'table';
  const firstGroup = state.board?.groups[0]?.id || '';
  const primary = buttonClass({ tone: 'primary' }, 'primary-btn board-new-item');
  const commandButton = buttonClass({ tone: 'secondary' }, 'secondary-btn board-command-button');
  const historyButton = iconButtonClass({ tone: 'ghost', size: 'sm' }, 'icon-btn board-history-button');
  const newItemDisabled = !(canEdit && firstGroup);
  const preferenceStateChanged = columnFilterCount > 0 || sorted;
  const sortColumn = visibleColumns.find((column) => String(column.id) === String(state.boardPrefs.sort_column_id ?? '')) ?? null;
  const peopleFilterActive = peopleColumn
    ? Boolean(String(state.boardPrefs.column_filters?.[String(peopleColumn.id)] ?? '').trim())
    : false;
  const searchActive = Boolean(state.itemSearch.trim());

  const tableIcon = '<svg class="board-command-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v13H4z"/><path d="M4 10h16M9 5.5v13"/></svg>';
  const kanbanIcon = '<svg class="board-command-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="15.5" y="4" width="5" height="14" rx="1.5"/></svg>';
  const plusIcon = '<svg class="board-command-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const chevronIcon = '<svg class="board-command-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
  const statusIcon = '<svg class="board-command-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>';
  const peopleIcon = '<svg class="board-command-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.7-3.2 2.6-5 5.5-5s4.8 1.8 5.5 5M16 7.5a2.5 2.5 0 0 1 0 5M17 14c2.1.5 3.4 2.1 3.8 4.5"/></svg>';
  const filterIcon = '<svg class="board-command-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16l-6.3 7.1v4.8L10.5 20v-6.9z"/></svg>';
  const sortIcon = '<svg class="board-command-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M5 8l3-3 3 3M16 19V5M13 16l3 3 3-3"/></svg>';
  const columnsIcon = '<svg class="board-command-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M10 5v14M15 5v14"/></svg>';
  const undoIcon = '<svg class="board-command-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 8H4v-5"/><path d="M4 8c2-3 5-4.5 8.5-4 4.4.5 7.5 4.5 7 9-.5 4.2-4 7-8.2 7-3 0-5.4-1.4-6.8-3.5"/></svg>';
  const redoIcon = '<svg class="board-command-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 8h5v-5"/><path d="M20 8c-2-3-5-4.5-8.5-4-4.4.5-7.5 4.5-7 9 .5 4.2 4 7 8.2 7 3 0 5.4-1.4 6.8-3.5"/></svg>';
  const moreIcon = '<svg class="board-command-icon board-command-more-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>';
  const clearIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7"/></svg>';

  const statusMenuItems = [
    `<button role="menuitem" data-toolbar-status-value="all" ${state.itemStatus === 'all' ? 'class="is-selected"' : ''}>All statuses${state.itemStatus === 'all' ? '<span aria-hidden="true">✓</span>' : ''}</button>`,
    ...statusLabels
      .filter((label) => label.active || String(label.id) === String(state.itemStatus))
      .map((label) => `<button role="menuitem" data-toolbar-status-value="${esc(label.id)}" ${String(state.itemStatus) === String(label.id) ? 'class="is-selected"' : ''}><span class="board-menu-status-swatch" style="--status-color:${esc(label.color)}"></span><span>${esc(label.name)}${label.active ? '' : ' (inactive)'}</span>${String(state.itemStatus) === String(label.id) ? '<span aria-hidden="true">✓</span>' : ''}</button>`),
  ].join('');

  const filterMenuItems = visibleColumns.length
    ? visibleColumns.map((column) => {
        const active = Boolean(String(state.boardPrefs.column_filters?.[String(column.id)] ?? '').trim());
        return `<button role="menuitem" data-column-filter="${esc(column.id)}" ${active ? 'class="is-selected"' : ''}><span>${active ? 'Edit' : 'Filter'} ${esc(column.name)}</span>${active ? '<span class="board-menu-state-mark" aria-hidden="true">•</span>' : ''}</button>`;
      }).join('')
    : '<button role="menuitem" disabled>No columns available to filter</button>';

  const sortMenuItems = visibleColumns.length
    ? visibleColumns.map((column) => {
        const isActive = String(state.boardPrefs.sort_column_id ?? '') === String(column.id);
        const activeDirection = isActive ? state.boardPrefs.sort_direction : null;
        return `<div class="board-sort-menu-group" role="group" aria-label="Sort by ${esc(column.name)}"><span class="board-sort-menu-label">${esc(column.name)}</span><button role="menuitem" data-column-sort="${esc(column.id)}" data-direction="asc" ${activeDirection === 'asc' ? 'class="is-selected"' : ''}>Ascending${activeDirection === 'asc' ? '<span aria-hidden="true">✓</span>' : ''}</button><button role="menuitem" data-column-sort="${esc(column.id)}" data-direction="desc" ${activeDirection === 'desc' ? 'class="is-selected"' : ''}>Descending${activeDirection === 'desc' ? '<span aria-hidden="true">✓</span>' : ''}</button></div>`;
      }).join('')
    : '<button role="menuitem" disabled>No columns available to sort</button>';

  const responsiveOverflowItems = `${statusMenuItems ? `<div class="board-menu-section-label board-overflow-status-label">Status filter</div>${statusMenuItems}` : ''}${peopleColumn ? `<button role="menuitem" class="board-overflow-people${peopleFilterActive ? ' is-selected' : ''}" data-column-filter="${esc(peopleColumn.id)}">Filter ${esc(peopleColumn.name)}${peopleFilterActive ? '<span aria-hidden="true">•</span>' : ''}</button>` : ''}${sortColumn ? `<button role="menuitem" class="board-overflow-sort-clear" data-column-sort="${esc(sortColumn.id)}" data-direction="none">Clear sorting · ${esc(sortColumn.name)}</button>` : ''}${canEdit ? '<button role="menuitem" class="board-overflow-columns" data-board-columns>Manage columns</button>' : ''}<button role="menuitem" class="board-overflow-history" data-board-undo ${historyState.canUndo ? '' : 'disabled'}>Undo${historyState.undoLabel ? ` · ${esc(historyState.undoLabel)}` : ''}</button><button role="menuitem" class="board-overflow-history" data-board-redo ${historyState.canRedo ? '' : 'disabled'}>Redo${historyState.redoLabel ? ` · ${esc(historyState.redoLabel)}` : ''}</button>`;

  return `<div class="monday-board-control-stack" data-board-command-stack>
    <nav class="board-view-bar" aria-label="Board views">
      <div class="wm-segmented view-switch board-view-tabs" role="tablist" aria-label="Board view">
        <button id="boardViewTab-table" type="button" role="tab" data-board-view="table" class="board-view-tab ${view === 'table' ? 'active' : ''}" aria-selected="${view === 'table'}" aria-controls="boardViewRegion" tabindex="${view === 'table' ? '0' : '-1'}">${tableIcon}<span>Main table</span></button>
        <button id="boardViewTab-kanban" type="button" role="tab" data-board-view="kanban" class="board-view-tab ${view === 'kanban' ? 'active' : ''}" aria-selected="${view === 'kanban'}" aria-controls="boardViewRegion" tabindex="${view === 'kanban' ? '0' : '-1'}">${kanbanIcon}<span>Kanban</span></button>
      </div>
      <div class="board-view-state-summary" aria-live="polite">${activeFilterCount ? `<span>${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}</span>` : ''}${sorted && sortColumn ? `<span>Sorted by ${esc(sortColumn.name)}</span>` : ''}${state.showArchived ? '<span>Archived items shown</span>' : ''}</div>
    </nav>
    <section class="${toolbarClass('board-controls board-controls-rich monday-board-toolbar')}" data-wrap="true" aria-label="Board workspace controls">
      <div class="board-controls-primary">
        <span class="board-new-item-split board-menu-host" data-board-menu-host>
          <button type="button" class="${primary}" ${newItemDisabled ? 'disabled title="Create a group before adding an item"' : `data-inline-add-focus="${esc(firstGroup)}"`}>${plusIcon}<span>New item</span></button>
          ${canEdit ? `<button type="button" class="${primary} board-new-item-menu" data-board-menu-trigger="create" aria-label="More create actions" aria-haspopup="menu" aria-expanded="false" title="More create actions">${chevronIcon}</button><template data-board-menu-template>${firstGroup ? `<button role="menuitem" data-inline-add-focus="${esc(firstGroup)}">Add item</button>` : ''}<button role="menuitem" data-add-group>Add group</button><button role="menuitem" data-add-column-menu>Add column</button></template>` : ''}
        </span>
      </div>
      <div class="board-controls-query" data-board-command-rail>
        <div class="wm-search board-search board-command-search compact${searchActive ? ' is-active' : ''}" role="search">${icons.search}<label class="sr-only" for="boardItemSearch">Search board</label><input id="boardItemSearch" class="${fieldControlClass({ kind: 'search', compact: true })}" type="search" data-item-search value="${esc(state.itemSearch)}" placeholder="Search" aria-label="Search items and field values on this board">${searchActive ? `<button type="button" class="board-search-clear" data-clear-item-search aria-label="Clear board search" title="Clear search">${clearIcon}</button>` : ''}</div>
        <label class="wm-field board-filter board-command-select board-tool-status${statusFilterActive ? ' is-active' : ''}"><span class="wm-field-label">Status filter</span>${statusIcon}<select class="${fieldControlClass({ kind: 'select', compact: true })}" data-item-status aria-label="Filter items by status"><option value="all">All statuses</option>${statusLabels.filter((label) => label.active || String(label.id) === String(state.itemStatus)).map((label) => `<option value="${esc(label.id)}" ${String(state.itemStatus) === String(label.id) ? 'selected' : ''}>${esc(label.name)}${label.active ? '' : ' (inactive)'}</option>`).join('')}</select></label>
        ${peopleColumn ? `<button type="button" class="${commandButton} board-tool board-tool-people${peopleFilterActive ? ' is-active' : ''}" data-column-filter="${esc(peopleColumn.id)}" aria-label="Filter ${esc(peopleColumn.name)}">${peopleIcon}<span class="board-command-label">${esc(peopleColumn.name)}</span>${peopleFilterActive ? '<span class="board-tool-badge" aria-label="People filter active">1</span>' : ''}</button>` : ''}
        <span class="board-menu-host board-filter-command-host" data-board-menu-host><button type="button" class="${commandButton} board-tool board-tool-filter${activeFilterCount ? ' is-active' : ''}" data-board-menu-trigger="filter" aria-label="Filter board items" aria-haspopup="menu" aria-expanded="false">${filterIcon}<span class="board-command-label">Filter</span>${activeFilterCount ? `<span class="board-tool-badge" aria-label="${activeFilterCount} active filters">${activeFilterCount}</span>` : ''}</button><template data-board-menu-template><div class="board-menu-section-label">Filter by column</div>${filterMenuItems}</template></span>
        <span class="board-menu-host board-sort-command-host" data-board-menu-host><button type="button" class="${commandButton} board-tool board-tool-sort${sorted ? ' is-active' : ''}" data-board-menu-trigger="sort" aria-label="Sort board items${sortColumn ? ` by ${esc(sortColumn.name)}` : ''}" aria-haspopup="menu" aria-expanded="false">${sortIcon}<span class="board-command-label">Sort</span>${sorted ? '<span class="board-tool-badge" aria-label="Sorting active">1</span>' : ''}${chevronIcon}</button><template data-board-menu-template>${sortColumn ? `<button role="menuitem" data-column-sort="${esc(sortColumn.id)}" data-direction="none">Clear sorting · ${esc(sortColumn.name)}</button><hr>` : ''}<div class="board-menu-section-label">Sort items</div>${sortMenuItems}</template></span>
        ${canEdit ? `<button type="button" class="${commandButton} board-columns-shortcut board-tool board-tool-columns" data-board-columns>${columnsIcon}<span class="board-command-label">Columns</span></button>` : ''}
      </div>
      <div class="board-controls-secondary">
        <div class="board-history-controls" role="group" aria-label="Undo and redo"><button type="button" class="${historyButton}" data-board-undo ${historyState.canUndo ? '' : 'disabled'} title="${historyState.undoLabel ? `Undo ${esc(historyState.undoLabel)}` : 'Nothing to undo'}" aria-label="Undo">${undoIcon}</button><button type="button" class="${historyButton}" data-board-redo ${historyState.canRedo ? '' : 'disabled'} title="${historyState.redoLabel ? `Redo ${esc(historyState.redoLabel)}` : 'Nothing to redo'}" aria-label="Redo">${redoIcon}</button></div>
        <span class="board-menu-host board-view-options-host" data-board-menu-host><button type="button" class="${commandButton} board-view-options board-tool-more" data-board-menu-trigger="view-options" aria-label="More board view options" aria-haspopup="menu" aria-expanded="false">${moreIcon}<span class="board-command-label board-more-label">More</span>${chevronIcon}</button><template data-board-menu-template><div class="board-menu-section-label">View options</div><button role="menuitem" data-toggle-archived-items>${state.showArchived ? 'Hide archived items' : 'Show archived items'}</button><button role="menuitem" data-reset-board-view ${preferenceStateChanged ? '' : 'disabled'}>Reset view settings</button><div class="board-responsive-overflow-menu"><hr><div class="board-menu-section-label">Compact toolbar</div>${responsiveOverflowItems}</div>${canEdit ? '<hr><div class="board-menu-section-label">Create</div><button role="menuitem" data-add-group>Add group</button><button role="menuitem" data-add-column-menu>Add column</button>' : ''}</template></span>
      </div>
    </section>
  </div>`;
}

export function renderBoardItemRow({
  state,
  item,
  group,
  columns,
  canEdit,
  canReorder = canEdit,
  isWrapped,
  formatCell,
  escapeHtml,
  isSelected = false,
  logicalRowIndex = 0,
  logicalColumnStart = 0,
  leadingVirtualColumnWidth = 0,
  trailingVirtualColumnWidth = 0,
  totalLogicalColumns = columns.length + 4,
}: BoardItemRowRenderOptions): string {
  const esc = escapeHtml;
  const detailOpen = state.itemPanel.itemId === item.id;
  const leadingSpacer = leadingVirtualColumnWidth > 0 ? `<td class="board-virtual-column-spacer" aria-hidden="true" role="presentation" style="width:${leadingVirtualColumnWidth}px;min-width:${leadingVirtualColumnWidth}px;max-width:${leadingVirtualColumnWidth}px"></td>` : '';
  const trailingSpacer = trailingVirtualColumnWidth > 0 ? `<td class="board-virtual-column-spacer" aria-hidden="true" role="presentation" style="width:${trailingVirtualColumnWidth}px;min-width:${trailingVirtualColumnWidth}px;max-width:${trailingVirtualColumnWidth}px"></td>` : '';
  return `<tr class="board-item-row ${detailOpen ? 'is-detail-open' : ''} ${isSelected ? 'is-selected' : ''}" draggable="${canReorder}" data-item-id="${item.id}" data-group-id="${group.id}" data-virtual-row-index="${logicalRowIndex}" aria-rowindex="${logicalRowIndex + 2}" aria-selected="${isSelected}">
    <td class="selection-cell" aria-colindex="1"><input class="wm-checkbox" type="checkbox" data-select-item="${item.id}" ${isSelected ? 'checked' : ''} aria-label="Select item: ${esc(item.title)}"></td>
    <td class="drag-cell" aria-colindex="2">${canReorder ? `<span class="drag-handle" data-item-drag="${item.id}" role="button" tabindex="0" aria-label="Reorder ${esc(item.title)}. Use Arrow Up or Arrow Down." title="Drag or use Arrow Up/Down to reorder item">⋮⋮</span>` : '<span class="drag-handle-spacer" aria-hidden="true"></span>'}</td>
    <td class="board-item-name-cell" data-column-width-key="__item" aria-colindex="3"><div class="board-item-name-shell"><span class="board-item-accent" aria-hidden="true"></span><button type="button" class="item-inline-title" data-open-item="${item.id}" data-grid-column-index="0" title="Open ${esc(item.title)}">${esc(item.title)}</button>${canEdit ? `<button type="button" class="wm-icon-button wm-icon-button--ghost wm-control--sm item-title-edit-button" data-edit-item-title="${item.id}" aria-label="Rename ${esc(item.title)}" title="Rename item">✎</button>` : ''}<button type="button" class="wm-icon-button wm-icon-button--ghost wm-control--sm item-details-bubble" data-open-item="${item.id}" aria-label="Open details for ${esc(item.title)}" title="Open item details">↗</button></div></td>
    ${leadingSpacer}${columns.map((column, offset) => {
      const content = formatCell(item, column);
      const empty = content.includes('board-cell-empty');
      const logicalColumnIndex = logicalColumnStart + offset;
      return `<td class="board-data-cell board-data-cell--${column.data_type} ${empty ? 'is-empty' : ''} ${isWrapped(column.id) ? 'is-wrapped' : ''}" data-column-type="${column.data_type}" data-column-id="${column.id}" data-column-width-key="${column.id}" aria-colindex="${logicalColumnIndex + 4}"><button type="button" class="board-cell-button board-cell-button--${column.data_type}" data-edit-cell="${item.id}" data-column-id="${column.id}" data-grid-column-index="${logicalColumnIndex + 1}" data-cell-state="${empty ? 'empty' : 'value'}" ${canEdit ? '' : 'aria-disabled="true" data-readonly-cell="true"'} aria-label="${esc(cellActionLabel(column, item.title, canEdit))}">${content}</button></td>`;
    }).join('')}${trailingSpacer}
    <td class="item-actions" aria-colindex="${totalLogicalColumns}"><span class="board-menu-host item-menu-host" data-board-menu-host><button type="button" class="wm-icon-button wm-icon-button--ghost wm-control--sm item-more-trigger" data-board-menu-trigger="item" aria-label="More actions for ${esc(item.title)}" aria-haspopup="menu" aria-expanded="false"><span aria-hidden="true">•••</span></button><template data-board-menu-template><button role="menuitem" data-open-item="${item.id}">Open item details</button>${canEdit ? `<button role="menuitem" data-edit-item="${item.id}">Edit item</button><button role="menuitem" data-duplicate-item="${item.id}">Duplicate item</button><button role="menuitem" data-archive-item="${item.id}" data-archive="${item.archived_at ? 'false' : 'true'}">${item.archived_at ? 'Restore item' : 'Archive item'}</button><button role="menuitem" class="danger-text" data-delete-item="${item.id}">Delete item permanently</button>` : ''}</template></span></td>
  </tr>`;
}

export function renderBoardColumnHeader({ column, canEdit, sort, filter, wrapped, columnTypeLabel, escapeHtml, logicalColumnIndex = 0 }: BoardColumnHeaderRenderOptions): string {
  const esc = escapeHtml;
  const sorted = sort.id === column.id;
  const sortDirection = sorted && sort.direction === 'asc' ? 'ascending' : sorted && sort.direction === 'desc' ? 'descending' : 'none';
  const nextDirection = !sorted ? 'asc' : sort.direction === 'asc' ? 'desc' : 'none';
  const sortLabel = !sorted ? `Sort ${column.name} ascending` : sort.direction === 'asc' ? `Sort ${column.name} descending` : `Clear ${column.name} sorting`;
  const typeLabel = columnTypeLabel(column.data_type);
  const typeMeta = `${typeLabel}${filter ? ' · Filtered' : ''}`;
  const typeGlyph = COLUMN_TYPE_GLYPHS[column.data_type];
  return `<th scope="col" aria-sort="${sortDirection}" aria-colindex="${logicalColumnIndex + 4}" data-column-id="${column.id}" data-column-type="${column.data_type}" data-column-width-key="${column.id}" class="board-column-head board-column-head--${column.data_type} ${filter ? 'has-filter' : ''} ${sorted ? 'is-sorted' : ''}"><div class="column-head-shell">${canEdit ? `<span class="column-drag-handle" draggable="true" data-column-drag="${column.id}" role="button" tabindex="0" aria-label="Reorder ${esc(column.name)} column. Use Arrow Left or Arrow Right." title="Drag or use Arrow Left/Right to reorder column">⋮</span>` : '<span class="column-drag-spacer" aria-hidden="true"></span>'}<span class="board-column-type-icon board-column-type-icon--${column.data_type}" aria-hidden="true">${typeGlyph}</span><button type="button" class="column-header-button" data-rename-column-inline="${column.id}" ${canEdit ? '' : 'disabled'} aria-label="${canEdit ? 'Rename' : 'View'} ${esc(column.name)} column"><span class="column-header-title" title="${esc(column.name)}">${esc(column.name)}</span><small class="column-header-meta">${esc(typeMeta)}</small></button><button type="button" class="wm-icon-button wm-icon-button--ghost wm-control--sm column-quick-sort ${sorted ? 'active' : ''}" data-column-quick-sort="${column.id}" data-direction="${nextDirection}" aria-label="${esc(sortLabel)}" title="${esc(sortLabel)}"><span aria-hidden="true">${!sorted ? '↕' : sort.direction === 'asc' ? '↑' : '↓'}</span></button><details class="column-context-menu" data-board-menu-host><summary aria-label="${esc(column.name)} column actions" aria-haspopup="menu" aria-expanded="false" data-board-menu-trigger="column">•••</summary><template data-board-menu-template>${canEdit ? `<button role="menuitem" data-edit-column="${column.id}">Configure column</button>` : ''}<button role="menuitem" data-column-filter="${column.id}">${filter ? 'Edit filter' : 'Filter column'}</button><button role="menuitem" data-column-sort="${column.id}" data-direction="asc">Sort ascending${sorted && sort.direction === 'asc' ? ' ✓' : ''}</button><button role="menuitem" data-column-sort="${column.id}" data-direction="desc">Sort descending${sorted && sort.direction === 'desc' ? ' ✓' : ''}</button>${sorted ? `<button role="menuitem" data-column-sort="${column.id}" data-direction="none">Clear sorting</button>` : ''}<button role="menuitem" data-column-wrap="${column.id}">${wrapped ? 'Unwrap text' : 'Wrap text'}</button>${canEdit ? `<hr><button role="menuitem" data-column-duplicate="${column.id}">Duplicate column</button><button role="menuitem" data-column-add-right="${column.id}">Add column to right</button>${column.system_key ? '' : `<button role="menuitem" data-column-change-type="${column.id}">Change column type</button>`}<button role="menuitem" data-column-hide="${column.id}">Hide column</button><hr><button class="danger-text" role="menuitem" data-column-delete="${column.id}">Delete column permanently</button>` : ''}</template></details>${canEdit ? `<span class="column-resize-handle" data-column-resize="${column.id}" role="separator" aria-orientation="vertical" aria-label="Resize ${esc(column.name)} column" aria-valuemin="96" aria-valuemax="720" tabindex="0"></span>` : ''}</div></th>`;
}

