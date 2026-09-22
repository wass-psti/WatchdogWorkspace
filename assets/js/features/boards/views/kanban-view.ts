import type { BoardGroup, BoardItem, StatusLabel } from '../../../../../src/features/boards/contracts/domain.ts';
import type { MutableBoardViewState } from '../../../../../src/features/boards/contracts/view-state.ts';
import type { UserId } from '../../../../../src/types/identifiers.ts';
import type { DateFormatter, EscapeHtml } from '../../../../../src/platform/contracts/ui.ts';

interface KanbanMember {
  readonly display_name?: string | null;
}

export interface BoardKanbanRenderOptions {
  readonly state: MutableBoardViewState;
  readonly items: readonly BoardItem[];
  readonly groups: readonly BoardGroup[];
  readonly itemMatches: (item: BoardItem) => boolean;
  readonly canEdit: () => boolean;
  readonly memberMap: () => ReadonlyMap<UserId | string | null | undefined, KanbanMember>;
  readonly statusLabels: readonly StatusLabel[] | Readonly<Record<string, string>>;
  readonly escapeHtml: EscapeHtml;
  readonly formatDay: DateFormatter;
}

export interface BoardKanbanLaneModel {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly active: boolean;
  readonly unavailable: boolean;
}

const addIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>';
const openIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5h8v8M15 5l-9 9"/></svg>';
const calendarIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="5" width="13" height="11" rx="2"/><path d="M6.5 3.5v3M13.5 3.5v3M3.5 8.5h13"/></svg>';
const emptyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 9h8M8 13h5"/></svg>';
const dragIcon = '<span aria-hidden="true">⋮⋮</span>';

function memberInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] || ''}${words.at(-1)?.[0] || ''}`.toUpperCase();
}

export function buildBoardKanbanLanes(items: readonly BoardItem[], statusLabels: BoardKanbanRenderOptions['statusLabels']): readonly BoardKanbanLaneModel[] {
  const referenced = new Set(items.map((item) => item.status ? String(item.status) : '').filter(Boolean));
  const configured: BoardKanbanLaneModel[] = Array.isArray(statusLabels)
    ? [...statusLabels]
      .sort((left, right) => Number(left.position ?? 0) - Number(right.position ?? 0) || String(left.id).localeCompare(String(right.id)))
      .map((label) => ({ id: String(label.id), name: String(label.name), color: String(label.color || '#7f8a9a'), active: label.active !== false, unavailable: false }))
    : Object.entries(statusLabels).map(([id, name]) => ({ id, name, color: '#7f8a9a', active: true, unavailable: false }));

  const known = new Set(configured.map((label) => label.id));
  const visible = configured.filter((label) => label.active || referenced.has(label.id));
  for (const id of referenced) {
    if (!known.has(id)) visible.push({ id, name: 'Unavailable status', color: '#a3aab5', active: false, unavailable: true });
  }

  if (configured.length || items.length) visible.push({ id: '', name: 'No status', color: '#a3aab5', active: true, unavailable: false });
  return Object.freeze(visible.map((lane) => Object.freeze({ ...lane })));
}

export function renderBoardKanbanView({
  state,
  items,
  groups,
  itemMatches,
  canEdit,
  memberMap,
  statusLabels,
  escapeHtml,
  formatDay,
}: BoardKanbanRenderOptions): string {
  const esc = escapeHtml;
  const editable = canEdit();
  const visibleItems = items.filter(itemMatches);
  const members = memberMap();
  const groupsById = new Map(groups.map((group) => [String(group.id), group] as const));
  const itemsByStatus = new Map<string, BoardItem[]>();
  for (const item of visibleItems) {
    const key = item.status ? String(item.status) : '';
    const lane = itemsByStatus.get(key);
    if (lane) lane.push(item);
    else itemsByStatus.set(key, [item]);
  }
  for (const lane of itemsByStatus.values()) lane.sort((left, right) => left.position - right.position || String(left.id).localeCompare(String(right.id)));

  const primaryGroup = groups[0]?.id || '';
  const configured = buildBoardKanbanLanes(visibleItems, statusLabels);

  const lanes = configured.map((statusLabel, laneIndex) => {
    const status = statusLabel.id;
    const label = statusLabel.name;
    const lane = itemsByStatus.get(status) ?? [];
    const laneTitleId = `kanban-lane-title-${laneIndex}`;
    const laneCanAccept = statusLabel.active;
    const addAction = editable && primaryGroup && laneCanAccept
      ? `<button type="button" class="kanban-add-item" data-kanban-add-status="${esc(status)}" data-kanban-add-group="${primaryGroup}" aria-label="Add an item with status ${esc(label)}">${addIcon}<span>Add item</span></button>`
      : '';
    const cards = lane.length ? lane.map((item, cardIndex) => {
      const group = groupsById.get(String(item.group_id));
      const member = members.get(item.assignee_id);
      const memberName = String(member?.display_name || 'Unassigned');
      const cardTitleId = `kanban-card-title-${laneIndex}-${cardIndex}`;
      const dueLabel = item.due_date ? formatDay(item.due_date) : 'No due date';
      const dragHandle = editable
        ? `<button type="button" class="kanban-drag-handle" data-kanban-item-drag="${esc(item.id)}" aria-label="Move ${esc(item.title)} between status lanes. Use Arrow Left or Arrow Right, Home, or End." title="Drag card or use Left/Right/Home/End to change status">${dragIcon}</button>`
        : '';
      return `<article class="kanban-card ${state.itemPanel.itemId === item.id ? 'is-detail-open' : ''}" role="listitem" draggable="${editable}" data-item-id="${item.id}" data-group-id="${item.group_id}" aria-labelledby="${cardTitleId}">
        <div class="kanban-card-command-row">${dragHandle}<button type="button" class="kanban-card-open" data-open-item="${item.id}" aria-label="Open ${esc(item.title)}">
          <span class="kanban-card-context"><span class="kanban-card-group" title="${esc(group?.title || 'No group')}">${esc(group?.title || 'No group')}</span><span class="kanban-card-open-mark">${openIcon}</span></span>
          <strong id="${cardTitleId}" title="${esc(item.title)}">${esc(item.title)}</strong>
        </button></div>
        <footer class="kanban-card-meta">
          <span class="kanban-card-assignee" title="Assigned to ${esc(memberName)}"><span class="kanban-avatar" aria-hidden="true">${esc(memberInitials(memberName))}</span><span class="kanban-assignee-name">${esc(memberName)}</span></span>
          <span class="kanban-card-due ${item.due_date ? '' : 'is-empty'}" title="${esc(dueLabel)}">${calendarIcon}<span>${esc(dueLabel)}</span></span>
        </footer>
      </article>`;
    }).join('') : `<div class="kanban-empty" role="note">${emptyIcon}<div class="kanban-empty-copy"><strong>No items in ${esc(label)}</strong><span>${editable && laneCanAccept ? 'Add an item here or drag work into this lane.' : statusLabel.active ? 'Items moved to this status will appear here.' : 'Existing items remain visible here, but inactive statuses cannot receive new items.'}</span></div>${editable && primaryGroup && laneCanAccept ? `<button type="button" class="kanban-empty-add" data-kanban-add-status="${esc(status)}" data-kanban-add-group="${primaryGroup}">${addIcon}<span>Add first item</span></button>` : ''}</div>`;

    const dropAttribute = laneCanAccept ? ` data-drop-status="${esc(status)}"` : '';
    const laneState = statusLabel.active ? '' : `<span class="kanban-lane-state" aria-label="${statusLabel.unavailable ? 'Unavailable status' : 'Inactive status'}">${statusLabel.unavailable ? 'Unavailable' : 'Inactive'}</span>`;
    return `<section class="kanban-column ${statusLabel.active ? '' : 'is-inactive-status'}" data-kanban-lane data-kanban-status="${esc(status)}" data-kanban-lane-name="${esc(label)}"${dropAttribute} style="--lane-color:${esc(statusLabel.color)}" aria-labelledby="${laneTitleId}"${statusLabel.active ? '' : ' aria-disabled="true"'}>
      <header class="kanban-lane-head">
        <div class="kanban-lane-identity"><span class="kanban-lane-swatch configurable-status-dot" aria-hidden="true"></span><div class="kanban-lane-title"><h3 id="${laneTitleId}">${esc(label)}</h3>${laneState}<span class="kanban-lane-count" aria-label="${lane.length} ${lane.length === 1 ? 'item' : 'items'}">${lane.length}</span></div></div>
        <div class="kanban-lane-actions">${addAction}</div>
      </header>
      <div class="kanban-list" role="list" aria-label="${esc(label)} items">${cards}</div>
    </section>`;
  }).join('');

  if (!configured.length) {
    return `<div class="kanban-board kanban-board-empty" role="region" aria-label="Board Kanban view" tabindex="0"><div class="kanban-view-empty">${emptyIcon}<strong>No status lanes are configured</strong><span>Configure a Status column to organize this board in Kanban.</span></div></div>`;
  }

  return `<div class="kanban-board" role="region" aria-label="Board Kanban view. Scroll horizontally to review status lanes." tabindex="0" data-kanban-lane-count="${configured.length}">${lanes}</div>`;
}
