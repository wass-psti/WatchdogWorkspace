import type {
  BoardCellValue,
  BoardColumn,
  BoardEnvelope,
  BoardItem,
  ItemActivityEvent,
  ItemWorkspaceEnvelope,
  ItemWorkspaceUpdate,
  TimelineValue,
} from '../../../../../src/features/boards/contracts/domain.ts';
import type { MutableBoardViewState, ItemWorkspaceTab } from '../../../../../src/features/boards/contracts/view-state.ts';
import type { DateFormatter, EscapeHtml } from '../../../../../src/platform/contracts/ui.ts';
import { STATUS_LABELS } from '../board-schema.ts';
import { normalizeStatusLabels } from '../status-labels.ts';
import { buttonClass, fieldControlClass, iconButtonClass, tabClass } from '../../../platform/ui/primitives.ts';

interface ItemWorkspaceViewOptions {
  readonly state: MutableBoardViewState;
  readonly canEdit: () => boolean;
  readonly escapeHtml: EscapeHtml;
  readonly formatDate: DateFormatter;
  readonly formatDay: DateFormatter;
}

interface ActivityCluster {
  readonly event: ItemActivityEvent;
  readonly key: string | null;
  count: number;
  oldestTimestamp: number;
}

interface UpdateKind { readonly key: 'decision' | 'blocker' | 'handoff' | 'progress'; readonly label: string; readonly icon: string; }
type ActivityPayload = Readonly<Record<string, unknown>>;

const closeIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>';
const moreIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="4" cy="10" r="1.35"/><circle cx="10" cy="10" r="1.35"/><circle cx="16" cy="10" r="1.35"/></svg>';
const overviewIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="3.5" width="5" height="5" rx="1"/><rect x="11.5" y="3.5" width="5" height="5" rx="1"/><rect x="3.5" y="11.5" width="5" height="5" rx="1"/><rect x="11.5" y="11.5" width="5" height="5" rx="1"/></svg>';
const updateIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 5.5h12v8H8l-4 3z"/><path d="M7 9h6"/></svg>';
const fileIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3.5h5l3 3v10H6z"/><path d="M11 3.5v3h3"/></svg>';
const activityIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M10 6.5v4l2.5 1.5"/></svg>';
const calendarIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="5" width="13" height="11" rx="2"/><path d="M6.5 3.5v3M13.5 3.5v3M3.5 8.5h13"/></svg>';
const uploadIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V5M8 9l4-4 4 4"/><path d="M5 14v5h14v-5"/></svg>';
const arrowIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14 14 6M8 6h6v6"/></svg>';
const emptyFileIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7l4 4V20H7z"/><path d="M14 3.5v4h4M10 13h5"/></svg>';
const emptyActivityIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>';

function bytesLabel(value: number | null | undefined): string {
  const n = Number(value || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] || ''}${parts.at(-1)?.[0] || ''}`.toUpperCase();
}

function mentionMarkup(body: string, esc: EscapeHtml): string {
  return esc(body).replace(/(^|\s)(@[A-Za-z0-9._-]+)/g, '$1<span class="item-mention">$2</span>').replace(/\n/g, '<br>');
}

function payloadOf(event: ItemActivityEvent): ActivityPayload {
  return event.payload && typeof event.payload === 'object' ? event.payload : {};
}

function humanActivityLabel(event: ItemActivityEvent): string {
  const payload = payloadOf(event);
  if (event.event_type === 'item.cell_updated') return `${String(payload.column_name || 'Field')} updated`;
  const labels: Readonly<Record<string, string>> = {
    'item.updated': 'Item details updated',
    'item.moved': 'Item moved',
    'item.archived': 'Item archived',
    'item.restored': 'Item restored',
    'item.duplicated': 'Item duplicated',
    'item.update_added': 'Update posted',
    'item.update_deleted': 'Update deleted',
    'item.file_added': 'File attached',
    'item.file_deleted': 'File removed',
  };
  return labels[event.event_type || ''] || event.message || 'Item activity';
}

function activityTone(event: ItemActivityEvent): string {
  if (event.event_type?.includes('file')) return 'file';
  if (event.event_type?.includes('update')) return 'update';
  if (event.event_type === 'item.moved') return 'move';
  if (event.event_type === 'item.archived' || event.event_type === 'item.restored') return 'lifecycle';
  return 'change';
}

function compactItemActivity(events: readonly ItemActivityEvent[]): ActivityCluster[] {
  const output: ActivityCluster[] = [];
  for (const event of events) {
    const isCell = event.event_type === 'item.cell_updated';
    const payload = payloadOf(event);
    const key = isCell ? `${event.actor_id || event.actor_name || ''}:${String(payload.column_id || payload.column_name || '')}` : null;
    const timestamp = Number(new Date(event.created_at || 0));
    const previous = output.at(-1);
    if (isCell && previous?.key === key && Math.abs(previous.oldestTimestamp - timestamp) <= 90000) {
      previous.count += 1;
      previous.oldestTimestamp = timestamp;
      continue;
    }
    output.push({ event, key, count: 1, oldestTimestamp: timestamp });
  }
  return output;
}

function valueFor(board: BoardEnvelope, item: BoardItem, column: BoardColumn): BoardCellValue {
  const record = board.values.find((entry) => String(entry.item_id) === String(item.id) && String(entry.column_id) === String(column.id));
  return record?.value ?? null;
}

function selectOptions(options: readonly Readonly<{ value: string; label: string; disabled?: boolean }>[], current: string, esc: EscapeHtml): string {
  return options.map((option) => `<option value="${esc(option.value)}"${option.value === current ? ' selected' : ''}${option.disabled ? ' disabled' : ''}>${esc(option.label)}</option>`).join('');
}

function propertyControl(board: BoardEnvelope, item: BoardItem, column: BoardColumn, esc: EscapeHtml): string {
  const value = valueFor(board, item, column);
  const cls = fieldControlClass({ kind: column.data_type === 'long_text' ? 'textarea' : 'text' });
  const stringValue = value == null ? '' : String(value);
  if (column.data_type === 'long_text') return `<textarea class="${cls}" name="value" maxlength="5000" rows="3">${esc(stringValue)}</textarea>`;
  if (column.data_type === 'number') return `<input class="${cls}" name="value" type="number" step="any" value="${esc(stringValue)}">`;
  if (column.data_type === 'date') return `<input class="${cls}" name="value" type="date" value="${esc(stringValue)}">`;
  if (column.data_type === 'email') return `<input class="${cls}" name="value" type="email" maxlength="320" value="${esc(stringValue)}">`;
  if (column.data_type === 'url') return `<input class="${cls}" name="value" type="url" maxlength="2000" placeholder="https://" value="${esc(stringValue)}">`;
  if (column.data_type === 'checkbox') return `<select class="${fieldControlClass({ kind: 'select' })}" name="value">${selectOptions([{ value: '', label: 'Not set' }, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], value === true ? 'true' : value === false ? 'false' : '', esc)}</select>`;
  if (column.data_type === 'timeline') {
    const timeline = value && typeof value === 'object' && !Array.isArray(value) ? value as TimelineValue : null;
    return `<div class="item-property-timeline"><label>Start<input class="${cls}" name="start" type="date" value="${esc(timeline?.start || '')}"></label><span aria-hidden="true">→</span><label>End<input class="${cls}" name="end" type="date" value="${esc(timeline?.end || '')}"></label></div>`;
  }
  if (column.data_type === 'status') {
    const labels = normalizeStatusLabels(column).filter((label) => label.active !== false || String(label.id) === stringValue);
    return `<select class="${fieldControlClass({ kind: 'select' })}" name="value">${selectOptions([{ value: '', label: 'No status' }, ...labels.map((label) => ({ value: String(label.id), label: label.name }))], stringValue, esc)}</select>`;
  }
  if (column.data_type === 'dropdown') {
    const configured = Array.isArray(column.config.options) ? column.config.options.map(String) : [];
    const options = stringValue && !configured.includes(stringValue) ? [stringValue, ...configured] : configured;
    return `<select class="${fieldControlClass({ kind: 'select' })}" name="value">${selectOptions([{ value: '', label: 'No selection' }, ...options.map((option) => ({ value: option, label: option }))], stringValue, esc)}</select>`;
  }
  if (column.data_type === 'people') {
    const members = board.members.map((member) => ({ value: String(member.user_id), label: String(member.display_name || member.email || member.user_id) }));
    return `<select class="${fieldControlClass({ kind: 'select' })}" name="value">${selectOptions([{ value: '', label: 'Unassigned' }, ...members], stringValue, esc)}</select>`;
  }
  return `<input class="${cls}" name="value" type="text" maxlength="1000" value="${esc(stringValue)}">`;
}

function propertyForm(label: string, field: string, control: string, esc: EscapeHtml): string {
  return `<form class="item-rich-property" data-item-property-form data-item-property-kind="core" data-item-property-field="${esc(field)}"><label><span>${esc(label)}</span>${control}</label><div class="item-rich-property-actions"><button type="reset" class="${buttonClass({ tone: 'ghost' }, 'item-rich-property-reset')}">Reset</button><button type="submit" class="${buttonClass({ tone: 'secondary' }, 'item-rich-property-save')}">Save</button></div></form>`;
}

function overviewContent(board: BoardEnvelope, item: BoardItem, data: ItemWorkspaceEnvelope, editable: boolean, esc: EscapeHtml, formatDate: DateFormatter, formatDay: DateFormatter): string {
  const group = board.groups.find((entry) => String(entry.id) === String(item.group_id));
  const statusColumn = board.columns.find((column) => column.system_key === 'status') || null;
  const configuredStatuses = statusColumn ? normalizeStatusLabels(statusColumn).filter((label) => label.active !== false || String(label.id) === String(item.status || '')) : [];
  const legacyStatuses = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
  const statusOptions = configuredStatuses.length ? configuredStatuses.map((label) => ({ value: String(label.id), label: label.name })) : legacyStatuses;
  const members = board.members.map((member) => ({ value: String(member.user_id), label: String(member.display_name || member.email || member.user_id) }));
  const member = board.members.find((entry) => String(entry.user_id) === String(item.assignee_id || ''));
  const statusName = configuredStatuses.find((label) => String(label.id) === String(item.status || ''))?.name || (item.status ? STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] : '') || item.status || 'No status';
  const customColumns = board.columns.filter((column) => column.visible !== false && !column.system_key);
  const archived = Boolean(item.archived_at || item.archived);
  const summary = `<section class="item-overview-summary" aria-label="Item summary"><article><span>Group</span><strong>${esc(group?.title || 'No group')}</strong></article><article><span>Status</span><strong>${esc(statusName)}</strong></article><article><span>Owner</span><strong>${esc(member?.display_name || member?.email || 'Unassigned')}</strong></article><article><span>Due date</span><strong>${esc(item.due_date ? formatDay(item.due_date) : 'No due date')}</strong></article><article><span>Updates</span><strong>${data.updates.length}</strong></article><article><span>Files</span><strong>${data.files.length}</strong></article></section>`;
  const recent = data.activity.slice(0, 5).map((event) => `<li><span data-activity-tone="${activityTone(event)}"></span><div><strong>${esc(humanActivityLabel(event))}</strong><small>${esc(event.actor_name || 'Unknown')} · ${esc(formatDate(event.created_at))}</small></div></li>`).join('') || '<li class="is-empty"><div><strong>No recent activity</strong><small>Changes will appear here as work progresses.</small></div></li>';
  if (!editable) {
    const custom = customColumns.map((column) => `<article class="item-overview-readonly-property"><span>${esc(column.name)}</span><strong>${esc(String(valueFor(board, item, column) ?? '—'))}</strong></article>`).join('') || '<p class="item-rich-empty">No custom properties are configured for this item.</p>';
    return `<div class="item-overview">${summary}<section class="item-rich-section"><div class="item-rich-section-head"><div><span>DETAILS</span><h3>Item properties</h3></div><span class="item-panel-readonly">View-only</span></div><div class="item-overview-readonly-grid"><article><span>Item name</span><strong>${esc(item.title)}</strong></article><article><span>Notes</span><strong>${esc(item.notes || 'No notes')}</strong></article>${custom}</div></section><section class="item-rich-section"><div class="item-rich-section-head"><div><span>ACTIVITY</span><h3>Recent changes</h3></div></div><ul class="item-overview-activity">${recent}</ul></section></div>`;
  }
  const title = propertyForm('Item name', 'title', `<input class="${fieldControlClass({ kind: 'text' })}" name="value" required maxlength="240" value="${esc(item.title)}">`, esc);
  const status = propertyForm('Status', 'status', `<select class="${fieldControlClass({ kind: 'select' })}" name="value">${selectOptions([{ value: '', label: 'No status' }, ...statusOptions], String(item.status || ''), esc)}</select>`, esc);
  const assignee = propertyForm('Owner', 'assignee', `<select class="${fieldControlClass({ kind: 'select' })}" name="value">${selectOptions([{ value: '', label: 'Unassigned' }, ...members], String(item.assignee_id || ''), esc)}</select>`, esc);
  const due = propertyForm('Due date', 'due_date', `<input class="${fieldControlClass({ kind: 'text' })}" name="value" type="date" value="${esc(item.due_date || '')}">`, esc);
  const notes = propertyForm('Notes', 'notes', `<textarea class="${fieldControlClass({ kind: 'textarea' })}" name="value" maxlength="5000" rows="4">${esc(item.notes || '')}</textarea>`, esc);
  const custom = customColumns.map((column) => `<form class="item-rich-property" data-item-property-form data-item-property-kind="cell" data-column-id="${esc(column.id)}" data-column-type="${esc(column.data_type)}"><label><span>${esc(column.name)}</span>${propertyControl(board, item, column, esc)}</label><div class="item-rich-property-actions"><button type="reset" class="${buttonClass({ tone: 'ghost' }, 'item-rich-property-reset')}">Reset</button><button type="submit" class="${buttonClass({ tone: 'secondary' }, 'item-rich-property-save')}">Save</button></div></form>`).join('') || '<p class="item-rich-empty">No custom properties are configured yet. Add columns to the Board to extend this workspace.</p>';
  return `<div class="item-overview">${summary}<section class="item-rich-section"><div class="item-rich-section-head"><div><span>CORE DETAILS</span><h3>Work item details</h3><p>Each field saves explicitly. Blur never commits changes.</p></div>${archived ? '<span class="item-panel-archived">Archived</span>' : ''}</div><div class="item-rich-property-grid">${title}${status}${assignee}${due}${notes}</div></section><section class="item-rich-section"><div class="item-rich-section-head"><div><span>BOARD PROPERTIES</span><h3>Custom fields</h3><p>Edit the same typed values used in the Board table.</p></div><span>${customColumns.length} ${customColumns.length === 1 ? 'field' : 'fields'}</span></div><div class="item-rich-property-grid">${custom}</div></section><section class="item-rich-section"><div class="item-rich-section-head"><div><span>ACTIVITY</span><h3>Recent changes</h3></div><span>${data.activity.length} total</span></div><ul class="item-overview-activity">${recent}</ul></section></div>`;
}

function updateComposer(draft: string, esc: EscapeHtml): string {
  const length = draft.length;
  return `<section class="item-update-compose-shell" aria-labelledby="item-update-compose-title">
    <div class="item-update-compose-head"><div class="item-update-compose-titleline"><span class="item-update-compose-kicker">UPDATE</span><h3 id="item-update-compose-title">Share an update</h3><p>Record progress, decisions, blockers, and handoffs with this item.</p></div><span class="item-update-visibility" title="Visible to everyone with board access"><span class="item-update-visibility-dot" aria-hidden="true"></span>Board members</span></div>
    <div class="item-update-typebar" aria-label="Choose an update type"><span class="item-update-type-label">Quick type</span><div class="item-update-prompts" role="group" aria-label="Update type shortcuts"><button type="button" data-update-template="progress" aria-pressed="false"><span aria-hidden="true">↗</span>Progress</button><button type="button" data-update-template="decision" aria-pressed="false"><span aria-hidden="true">◆</span>Decision</button><button type="button" data-update-template="blocker" aria-pressed="false"><span aria-hidden="true">!</span>Blocker</button><button type="button" data-update-template="handoff" aria-pressed="false"><span aria-hidden="true">↔</span>Handoff</button></div></div>
    <form class="item-update-composer" data-item-update-form><div class="item-update-editor-wrap"><textarea class="${fieldControlClass({ kind: 'textarea' })}" name="body" maxlength="5000" rows="4" placeholder="Write an update. Mention a teammate with @name." aria-label="Write an update for this item" data-item-update-input>${esc(draft)}</textarea></div><div class="item-update-compose-footer"><div class="item-update-compose-meta"><span class="item-update-shortcut"><kbd>⌘</kbd><span>/</span><kbd>Ctrl</kbd><span>+</span><kbd>Enter</kbd><span>to post</span></span><span class="item-update-count${length >= 4500 ? ' is-near-limit' : ''}" data-item-update-count>${length} / 5000</span></div><div class="item-update-compose-actions"><button type="button" class="item-update-clear" data-clear-update-draft${length ? '' : ' hidden'}>Clear</button><button type="submit" class="${buttonClass({ tone: 'primary' }, 'primary-btn item-update-submit')}"${draft.trim() ? '' : ' disabled'} data-item-update-submit><span>Post update</span>${arrowIcon}</button></div></div></form>
  </section>`;
}

function updateType(body = ''): UpdateKind | null {
  const value = String(body).trimStart().toLowerCase();
  if (value.startsWith('decision:')) return { key: 'decision', label: 'Decision', icon: '◆' };
  if (value.startsWith('blocker:')) return { key: 'blocker', label: 'Blocker', icon: '!' };
  if (value.startsWith('handoff:')) return { key: 'handoff', label: 'Handoff', icon: '↔' };
  if (value.startsWith('progress update:') || value.startsWith('progress:')) return { key: 'progress', label: 'Progress', icon: '↗' };
  return null;
}

function updateStream(data: ItemWorkspaceEnvelope, esc: EscapeHtml, formatDate: DateFormatter): string {
  const updates: readonly ItemWorkspaceUpdate[] = data.updates;
  const cards = updates.length ? updates.map((update) => {
    const type = updateType(update.body);
    const author = String(update.author_name || 'Unknown');
    return `<article class="item-update${type ? ` is-${type.key}` : ''}"><header><span class="item-avatar" aria-hidden="true">${esc(initials(author))}</span><div class="item-update-author"><strong>${esc(author)}</strong><small>${esc(formatDate(update.created_at))}</small></div>${type ? `<span class="item-update-kind"><i aria-hidden="true">${type.icon}</i>${type.label}</span>` : ''}${update.can_delete ? `<button type="button" class="wm-icon-button wm-icon-button--ghost wm-control--sm item-update-delete" data-delete-item-update="${update.id}" aria-label="Delete this update permanently" title="Delete update permanently">${closeIcon}</button>` : ''}</header><div class="item-update-copy">${mentionMarkup(update.body, esc)}</div></article>`;
  }).join('') : `<div class="item-panel-empty item-update-empty"><span class="item-empty-icon" aria-hidden="true">↗</span><div><strong>No updates yet</strong><p>Share the first update to keep decisions and progress visible to everyone with board access.</p></div><button type="button" class="${buttonClass({ tone: 'secondary' }, 'secondary-btn')}" data-focus-update-composer>Write an update</button></div>`;
  return `<section class="item-update-stream" aria-label="Item updates"><div class="item-update-stream-head"><div><span class="item-update-stream-kicker">UPDATES</span><h3>Update history</h3></div><span class="item-update-stream-count">${updates.length ? `${updates.length} ${updates.length === 1 ? 'update' : 'updates'}` : 'No updates'}</span></div><div class="item-update-list">${cards}</div></section>`;
}

export function renderItemWorkspace({ state, canEdit, escapeHtml, formatDate, formatDay }: ItemWorkspaceViewOptions): string {
  const esc = escapeHtml;
  const board = state.board;
  if (!board) return '';
  const item = board.items.find((entry) => entry.id === state.itemPanel.itemId) || null;
  if (!item) return '';
  const data = state.itemPanel.data;
  const tab = state.itemPanel.tab;
  const group = board.groups.find((entry) => entry.id === item.group_id);
  let content = '';

  if (state.itemPanel.loading) content = '<div class="item-panel-state"><span class="button-spinner"></span><strong>Loading item details</strong><p>Fetching overview, updates, files, and activity…</p></div>';
  else if (state.itemPanel.error) content = `<div class="item-panel-state error"><strong>Item details couldn’t load</strong><p>${esc(state.itemPanel.error)}</p><button class="${buttonClass({ tone: 'secondary' }, 'secondary-btn')}" data-item-panel-retry>Try again</button></div>`;
  else if (tab === 'overview') content = overviewContent(board, item, data, canEdit(), esc, formatDate, formatDay);
  else if (tab === 'updates') content = `<div class="item-updates">${updateComposer(state.itemPanel.updateDraft || '', esc)}${updateStream(data, esc, formatDate)}</div>`;
  else if (tab === 'files') {
    const fileMarkup = data.files.length ? data.files.map((file) => {
      const fileName = String(file.file_name || 'Attachment');
      const extension = (fileName.split('.').pop() || 'FILE').slice(0, 5).toUpperCase();
      return `<article class="item-file"><span class="item-file-type" aria-hidden="true">${esc(extension)}</span><button type="button" class="item-file-open" data-open-item-file="${file.id}"><strong>${esc(fileName)}</strong><small><span>${esc(bytesLabel(file.size_bytes))}</span><span>${esc(file.author_name || 'Unknown')}</span><span>${esc(formatDate(file.created_at))}</span></small></button>${file.can_delete ? `<button type="button" class="wm-icon-button wm-icon-button--ghost wm-control--sm item-file-delete" data-delete-item-file="${file.id}" aria-label="Remove attachment: ${esc(fileName)}">${closeIcon}</button>` : ''}</article>`;
    }).join('') : `<div class="item-panel-empty item-files-empty">${emptyFileIcon}<div><strong>No attachments yet</strong><p>Add documents, images, or other reference files so they stay connected to this item.</p></div></div>`;
    content = `<section class="item-files"><div class="item-panel-section-head"><div><span>FILES</span><h3>Attachments</h3><p>Keep documents and reference files with this item.</p></div><span class="item-panel-section-count">${data.files.length} ${data.files.length === 1 ? 'file' : 'files'}</span></div><label class="item-file-drop ${state.itemPanel.uploading ? 'is-busy' : ''}" data-item-file-drop><input type="file" data-item-file-input multiple ${state.itemPanel.uploading ? 'disabled' : ''}>${uploadIcon}<span class="item-file-drop-copy"><strong>${state.itemPanel.uploading ? 'Uploading files…' : 'Drop files here or browse'}</strong><small>Select one or more files, up to 20 MB each.</small></span><span class="item-file-drop-action">Browse</span></label><div class="item-file-list">${fileMarkup}</div></section>`;
  } else {
    const activity = compactItemActivity(data.activity);
    const activityMarkup = activity.length ? activity.map(({ event, count }) => {
      const payload = payloadOf(event);
      const detail = event.event_type === 'item.cell_updated' ? (payload.column_name ? `Changed field: ${String(payload.column_name)}` : 'Field value changed') : '';
      return `<article data-activity-tone="${activityTone(event)}"><span class="event-dot" aria-hidden="true"></span><div class="activity-copy"><strong>${esc(humanActivityLabel(event))}</strong><p>${esc(event.actor_name || 'Unknown')} · ${esc(formatDate(event.created_at))}</p>${detail ? `<small>${esc(detail)}</small>` : ''}</div>${count > 1 ? `<span class="item-activity-count" title="${count} related changes">×${count}</span>` : ''}</article>`;
    }).join('') : `<div class="item-panel-empty item-activity-empty">${emptyActivityIcon}<div><strong>No activity yet</strong><p>Changes to this item, including moves, updates, and file actions, will appear here.</p></div></div>`;
    content = `<section class="item-activity"><div class="item-panel-section-head"><div><span>ACTIVITY</span><h3>Item activity</h3><p>Review changes made to this item.</p></div><span class="item-panel-section-count">${activity.length} ${activity.length === 1 ? 'event' : 'events'}</span></div><div class="item-activity-list">${activityMarkup}</div></section>`;
  }

  const titleId = `item-panel-title-${esc(item.id)}`;
  const panelId = `item-panel-content-${esc(item.id)}`;
  const tabIcons: Readonly<Record<ItemWorkspaceTab, string>> = { overview: overviewIcon, updates: updateIcon, files: fileIcon, activity: activityIcon };
  const tabId = (id: ItemWorkspaceTab): string => `item-panel-tab-${esc(item.id)}-${id}`;
  const tabButton = (id: ItemWorkspaceTab, label: string, count: number | '' = ''): string => `<button id="${tabId(id)}" type="button" role="tab" aria-selected="${tab === id}" aria-controls="${panelId}" tabindex="${tab === id ? '0' : '-1'}" data-item-panel-tab="${id}" class="${tabClass(tab === id, tab === id ? 'active' : '')}">${tabIcons[id]}<span>${label}</span>${count !== '' ? `<b>${count}</b>` : ''}</button>`;
  const statusColumn: BoardColumn | null = board.columns.find((column) => column.system_key === 'status') || null;
  const configuredStatus = statusColumn ? normalizeStatusLabels(statusColumn).find((label) => String(label.id) === String(item.status || '')) : null;
  const status = configuredStatus?.name || (item.status ? STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] : '') || item.status || 'No status';
  const statusColor = configuredStatus?.color || '#7f8a9a';
  const archived = Boolean(item.archived_at || item.archived);
  const dueLabel = item.due_date ? `Due ${formatDay(item.due_date)}` : 'No due date';

  return `<div class="item-panel-scrim" data-close-item-panel></div><aside class="board-item-panel" role="dialog" aria-modal="true" aria-labelledby="${titleId}" data-item-panel data-item-id="${esc(item.id)}" data-active-tab="${tab}" data-rich-item-workspace="v1">
    <header class="item-panel-head"><button type="button" class="${iconButtonClass({ tone: 'ghost' }, 'item-panel-close')}" data-close-item-panel aria-label="Close item panel">${closeIcon}</button><div class="item-panel-identity"><div class="item-panel-context"><span class="item-panel-context-label">ITEM</span><div class="item-panel-breadcrumb"><span>${esc(group?.title || 'No group')}</span><span aria-hidden="true">/</span><span>${esc(status)}</span></div></div><h2 id="${titleId}" title="${esc(item.title)}">${esc(item.title)}</h2><div class="item-panel-meta"><span class="status-pill ${configuredStatus ? 'configurable-status' : esc(item.status || 'empty')}" style="--status-color:${esc(statusColor)}"><span class="item-panel-status-swatch" aria-hidden="true"></span>${esc(status)}</span><span class="item-panel-due ${item.due_date ? '' : 'is-empty'}">${calendarIcon}<span>${esc(dueLabel)}</span></span>${archived ? '<span class="item-panel-archived">Archived</span>' : ''}</div></div><span class="board-menu-host item-panel-action-host" data-board-menu-host><button type="button" class="${iconButtonClass({ tone: 'ghost' }, 'item-panel-more-trigger')}" data-board-menu-trigger="item-panel" aria-label="More actions for this item" aria-haspopup="menu" aria-expanded="false">${moreIcon}</button><template data-board-menu-template>${canEdit() ? `<button type="button" role="menuitem" data-edit-item="${item.id}">Edit item</button><button type="button" role="menuitem" data-archive-item="${item.id}" data-archive="${archived ? 'false' : 'true'}">${archived ? 'Restore item' : 'Archive item'}</button>` : '<span class="item-panel-readonly" role="note">View-only board access</span>'}</template></span></header>
    <nav class="wm-tabs item-panel-tabs" role="tablist" aria-label="Item details">${tabButton('overview', 'Overview')}${tabButton('updates', 'Updates', data.updates.length)}${tabButton('files', 'Files', data.files.length)}${tabButton('activity', 'Activity', data.activity.length)}</nav>
    <div id="${panelId}" class="item-panel-body" role="tabpanel" aria-labelledby="${tabId(tab)}" tabindex="0" data-item-panel-body><div class="item-panel-tab-stage" data-item-tab-stage data-item-tab-content="${tab}">${content}</div></div>
  </aside>`;
}
