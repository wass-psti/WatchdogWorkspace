import type { BoardColumn, BoardEnvelope, BoardItem, TimelineValue } from '../contracts/domain.ts';
import type { BoardImportDataset, BoardImportDiagnostic, BoardImportPrimitive, BoardImportSource } from '../contracts/import.ts';
import type { BoardImportCommitRequest, BoardImportNormalizedValue, BoardImportPreview, BoardImportPreviewOptions, BoardImportPreviewRow } from '../contracts/import-preview.ts';
import { createBoardImportSchema } from '../contracts/import.ts';
import { parseBoardImport } from './board-import-parser.ts';

const canonical = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const comparable = (value: unknown) => value && typeof value === 'object' ? JSON.stringify(value) : canonical(value);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/i;

const validIsoDate = (value: string): boolean => {
  const match = ISO_DATE_RE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const validIsoTimestamp = (value: string): boolean => ISO_TIMESTAMP_RE.test(value) && Number.isFinite(Date.parse(value));

interface DiagnosticInput {
  readonly code: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly row?: number;
  readonly field?: string;
  readonly rule?: string;
  readonly importedValue?: unknown;
  readonly expected?: string;
  readonly acceptedValues?: readonly string[];
  readonly duplicateSource?: BoardImportDiagnostic['duplicateSource'];
  readonly conflictSource?: BoardImportDiagnostic['conflictSource'];
  readonly blocking?: boolean;
}

const diag = (input: DiagnosticInput): BoardImportDiagnostic => Object.freeze({
  code: input.code,
  severity: input.severity,
  message: input.message,
  ...(input.row !== undefined ? { row: input.row } : {}),
  ...(input.field ? { field: input.field, header: input.field } : {}),
  ...(input.rule ? { rule: input.rule } : {}),
  ...(input.importedValue !== undefined ? { importedValue: input.importedValue } : {}),
  ...(input.expected ? { expected: input.expected } : {}),
  ...(input.acceptedValues ? { acceptedValues: Object.freeze([...input.acceptedValues]) } : {}),
  ...(input.duplicateSource ? { duplicateSource: Object.freeze({ ...input.duplicateSource }) } : {}),
  ...(input.conflictSource ? { conflictSource: Object.freeze({ ...input.conflictSource }) } : {}),
  blocking: input.blocking ?? input.severity === 'error',
});

function normalizeForColumn(board: BoardEnvelope, column: BoardColumn, value: BoardImportPrimitive): { value: BoardImportNormalizedValue; diagnostic?: Omit<DiagnosticInput, 'row'|'field'> } {
  if (value == null || value === '') return { value: null };
  const text = String(value).trim();
  switch (column.data_type) {
    case 'number': {
      const n = typeof value === 'number' ? value : Number(text);
      return Number.isFinite(n)
        ? { value: n }
        : { value: null, diagnostic: { code: 'IMPORT_NUMBER_INVALID', severity: 'error', message: `${column.name} must be a finite decimal number.`, rule: 'number.finite', importedValue: value, expected: 'Finite decimal number using . as decimal separator.' } };
    }
    case 'checkbox': {
      if (typeof value === 'boolean') return { value };
      if (/^(true|yes|1)$/i.test(text)) return { value: true };
      if (/^(false|no|0)$/i.test(text)) return { value: false };
      return { value: null, diagnostic: { code: 'IMPORT_BOOLEAN_INVALID', severity: 'error', message: `${column.name} must be true/false, yes/no, or 1/0.`, rule: 'boolean.token', importedValue: value, expected: 'Supported boolean token.', acceptedValues: ['true','false','yes','no','1','0'] } };
    }
    case 'date':
      return validIsoDate(text)
        ? { value: text }
        : { value: null, diagnostic: { code: 'IMPORT_DATE_INVALID', severity: 'error', message: `${column.name} must be a real calendar date using YYYY-MM-DD.`, rule: 'date.iso-calendar', importedValue: value, expected: 'Valid Gregorian calendar date in YYYY-MM-DD format.' } };
    case 'email':
      return text.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ? { value: text.toLocaleLowerCase() }
        : { value: null, diagnostic: { code: 'IMPORT_EMAIL_INVALID', severity: 'error', message: `${column.name} must be a valid email address of at most 320 characters.`, rule: 'email.syntax-length', importedValue: value, expected: 'Valid local@domain address, maximum 320 characters.' } };
    case 'url': {
      if (text.length > 2000) return { value: null, diagnostic: { code: 'IMPORT_URL_TOO_LONG', severity: 'error', message: `${column.name} must contain at most 2000 characters.`, rule: 'url.max-length', importedValue: value, expected: 'Maximum 2000 characters.' } };
      try {
        const url = new URL(text);
        return /^https?:$/.test(url.protocol)
          ? { value: url.toString() }
          : { value: null, diagnostic: { code: 'IMPORT_URL_PROTOCOL_INVALID', severity: 'error', message: `${column.name} must use HTTP or HTTPS.`, rule: 'url.protocol', importedValue: value, expected: 'Absolute HTTP or HTTPS URL.', acceptedValues: ['http:','https:'] } };
      } catch {
        return { value: null, diagnostic: { code: 'IMPORT_URL_INVALID', severity: 'error', message: `${column.name} must be a valid URL.`, rule: 'url.syntax', importedValue: value, expected: 'Absolute HTTP or HTTPS URL.' } };
      }
    }
    case 'dropdown': {
      const options = Array.isArray(column.config?.options) ? column.config.options.map(String) : [];
      if (options.length && !options.includes(text)) return { value: null, diagnostic: { code: 'IMPORT_DROPDOWN_UNSUPPORTED', severity: 'error', message: `${column.name} contains an unsupported option.`, rule: 'dropdown.accepted-value', importedValue: value, expected: 'Exact configured option.', acceptedValues: options } };
      if (text.length > 1000) return { value: null, diagnostic: { code: 'IMPORT_DROPDOWN_TOO_LONG', severity: 'error', message: `${column.name} must contain at most 1000 characters.`, rule: 'dropdown.max-length', importedValue: value, expected: 'Maximum 1000 characters.' } };
      return { value: text };
    }
    case 'status': {
      const labels = Array.isArray(column.config?.labels) ? column.config.labels : [];
      const accepted = labels.flatMap((entry) => [String((entry as {id?:unknown}).id ?? ''), String((entry as {name?:unknown}).name ?? '')]).filter(Boolean);
      const found = labels.find((entry) => canonical((entry as {id?:unknown;name?:unknown}).id) === canonical(text) || canonical((entry as {name?:unknown}).name) === canonical(text));
      return found
        ? { value: String((found as {id?:unknown}).id ?? text) }
        : { value: null, diagnostic: { code: 'IMPORT_STATUS_UNSUPPORTED', severity: 'error', message: `${column.name} contains an unsupported status.`, rule: 'status.accepted-value', importedValue: value, expected: 'Configured status label ID or exact label name.', acceptedValues: accepted } };
    }
    case 'people': {
      if (!UUID_RE.test(text)) return { value: null, diagnostic: { code: 'IMPORT_PEOPLE_UUID_INVALID', severity: 'error', message: `${column.name} must resolve to a valid user identifier.`, rule: 'people.uuid', importedValue: value, expected: 'UUID of a current Board member.' } };
      const member = board.members.find((entry) => String(entry.user_id) === text);
      return member
        ? { value: text }
        : { value: null, diagnostic: { code: 'IMPORT_PEOPLE_RELATIONSHIP_INVALID', severity: 'error', message: `${column.name} references a user who is not a current member of this Board.`, rule: 'people.board-member', importedValue: value, expected: 'UUID of a current Board member.', conflictSource: { kind: 'relationship', relationshipId: text } } };
    }
    case 'timeline': {
      const match = /^(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})$/.exec(text);
      if (!match) return { value: null, diagnostic: { code: 'IMPORT_TIMELINE_FORMAT_INVALID', severity: 'error', message: `${column.name} must use YYYY-MM-DD/YYYY-MM-DD with both endpoints.`, rule: 'timeline.format', importedValue: value, expected: 'YYYY-MM-DD/YYYY-MM-DD with both start and end dates.' } };
      const start = match[1]!;
      const end = match[2]!;
      if (!validIsoDate(start) || !validIsoDate(end)) return { value: null, diagnostic: { code: 'IMPORT_TIMELINE_DATE_INVALID', severity: 'error', message: `${column.name} contains an invalid calendar date.`, rule: 'timeline.iso-calendar', importedValue: value, expected: 'Both endpoints must be real Gregorian calendar dates in YYYY-MM-DD format.' } };
      if (end < start) return { value: null, diagnostic: { code: 'IMPORT_TIMELINE_ORDER_INVALID', severity: 'error', message: `${column.name} end date cannot be before its start date.`, rule: 'timeline.order', importedValue: value, expected: 'Timeline end must be on or after timeline start.' } };
      return { value: Object.freeze({ start, end }) as TimelineValue };
    }
    case 'long_text':
      return text.length <= 5000
        ? { value: text }
        : { value: null, diagnostic: { code: 'IMPORT_LONG_TEXT_TOO_LONG', severity: 'error', message: `${column.name} must contain at most 5000 characters.`, rule: 'long-text.max-length', importedValue: value, expected: 'Maximum 5000 characters.' } };
    default:
      return text.length <= 1000
        ? { value: text }
        : { value: null, diagnostic: { code: 'IMPORT_TEXT_TOO_LONG', severity: 'error', message: `${column.name} must contain at most 1000 characters.`, rule: 'text.max-length', importedValue: value, expected: 'Maximum 1000 characters.' } };
  }
}

function itemValue(board: BoardEnvelope, item: BoardItem, column: BoardColumn): BoardImportNormalizedValue {
  if (column.system_key === 'title') return item.title;
  if (column.system_key === 'status') return item.status ?? null;
  if (column.system_key === 'assignee') return item.assignee_id ?? null;
  if (column.system_key === 'due_date') return item.due_date ?? null;
  if (column.system_key === 'notes') return item.notes ?? '';
  return (board.values.find((value) => value.item_id === item.id && value.column_id === column.id)?.value ?? null) as BoardImportNormalizedValue;
}

export function createBoardImportPreview(dataset: BoardImportDataset, board: BoardEnvelope, excludedSourceRows: readonly number[] = []): BoardImportPreview {
  if (!board.board) throw new Error('Board import preview requires an authoritative board envelope.');
  const excluded = new Set(excludedSourceRows);
  const groupsByName = new Map<string, string[]>();
  for (const group of board.groups) groupsByName.set(canonical(group.title), [...(groupsByName.get(canonical(group.title)) ?? []), String(group.id)]);
  const defaultGroup = board.groups[0]?.id ? String(board.groups[0].id) : undefined;
  const columnByKey = new Map<string, BoardColumn>();
  for (const column of board.columns) { columnByKey.set(String(column.column_key || column.id), column); columnByKey.set(String(column.id), column); }
  const seenIdentity = new Map<string, number>();
  const seenItemIds = new Map<string, number>();
  const rows: BoardImportPreviewRow[] = [];

  for (const row of dataset.rows) {
    const diagnostics: BoardImportDiagnostic[] = [];
    const normalized: Record<string, BoardImportNormalizedValue> = {};
    const itemId = String(row.values.item_id ?? '').trim();
    const itemUpdatedAt = String(row.values.item_updated_at ?? '').trim();
    const groupIdHint = String(row.values.group_id ?? '').trim();
    const itemName = String(row.values.item_name ?? '').trim();
    const groupName = String(row.values.group ?? '').trim();

    if (itemId && !UUID_RE.test(itemId)) diagnostics.push(diag({ code:'IMPORT_ITEM_ID_INVALID', severity:'error', message:'Item ID must be a UUID when provided.', row:row.sourceRow, field:'item_id', rule:'item-id.uuid', importedValue:row.values.item_id, expected:'UUID.' }));
    if (itemUpdatedAt && !validIsoTimestamp(itemUpdatedAt)) diagnostics.push(diag({ code:'IMPORT_ITEM_VERSION_INVALID', severity:'error', message:'Item Updated At must be an ISO-8601 timestamp with timezone when provided.', row:row.sourceRow, field:'item_updated_at', rule:'item-version.iso-timestamp', importedValue:row.values.item_updated_at, expected:'ISO-8601 timestamp with Z or numeric timezone offset.' }));
    if (groupIdHint && !UUID_RE.test(groupIdHint)) diagnostics.push(diag({ code:'IMPORT_GROUP_ID_INVALID', severity:'error', message:'Group ID must be a UUID when provided.', row:row.sourceRow, field:'group_id', rule:'group-id.uuid', importedValue:row.values.group_id, expected:'UUID.' }));
    if (!itemName || itemName.length > 240) diagnostics.push(diag({ code:'IMPORT_ITEM_NAME_INVALID', severity:'error', message:'Item Name must contain 1-240 characters.', row:row.sourceRow, field:'item_name', rule:'item-name.required-length', importedValue:row.values.item_name, expected:'Nonblank UTF-8 text, 1-240 characters.' }));
    if (groupName.length > 120) diagnostics.push(diag({ code:'IMPORT_GROUP_NAME_INVALID', severity:'error', message:'Group must contain at most 120 characters.', row:row.sourceRow, field:'group', rule:'group.max-length', importedValue:row.values.group, expected:'Maximum 120 characters.' }));

    normalized.item_id = itemId || null;
    normalized.item_name = itemName || null;
    normalized.item_updated_at = itemUpdatedAt || null;
    normalized.group_id = groupIdHint || null;
    normalized.group = groupName || null;

    if (itemId) {
      const priorIdRow = seenItemIds.get(itemId);
      if (priorIdRow !== undefined) diagnostics.push(diag({ code:'IMPORT_ITEM_ID_DUPLICATE', severity:'error', message:`Item ID duplicates import row ${priorIdRow}.`, row:row.sourceRow, field:'item_id', rule:'item-id.unique', importedValue:itemId, expected:'Item ID must be unique within the import file.', duplicateSource:{kind:'import-row',row:priorIdRow}, blocking:true }));
      else seenItemIds.set(itemId, row.sourceRow);
    }

    const hintedGroup = groupIdHint ? board.groups.find((group) => String(group.id) === groupIdHint) : undefined;
    const groupMatches = hintedGroup ? [String(hintedGroup.id)] : groupName ? (groupsByName.get(canonical(groupName)) ?? []) : (defaultGroup ? [defaultGroup] : []);
    if (groupMatches.length === 0) diagnostics.push(diag({ code:'IMPORT_GROUP_UNRESOLVED', severity:'error', message:groupName ? `Group “${groupName}” does not exist on this board.` : 'The board has no group available for imported items.', row:row.sourceRow, field:groupIdHint?'group_id':'group', rule:'group.relationship', importedValue:groupIdHint || groupName, expected:'Group ID belonging to this Board or an unambiguous existing Group name.', conflictSource:{kind:'relationship',relationshipId:groupIdHint || groupName} }));
    if (hintedGroup && groupName && canonical(hintedGroup.title) !== canonical(groupName)) diagnostics.push(diag({ code:'IMPORT_GROUP_REFERENCE_MISMATCH', severity:'error', message:'Group ID and Group name refer to different groups.', row:row.sourceRow, field:'group_id', rule:'group.id-name-consistency', importedValue:{groupId:groupIdHint,group:groupName}, expected:'Group ID and Group must identify the same Board group.', conflictSource:{kind:'relationship',relationshipId:groupIdHint} }));
    if (groupMatches.length > 1) diagnostics.push(diag({ code:'IMPORT_GROUP_AMBIGUOUS', severity:'error', message:`Group “${groupName}” resolves to multiple board groups.`, row:row.sourceRow, field:'group', rule:'group.unambiguous', importedValue:groupName, expected:'Group name that resolves to exactly one Board group.' }));
    const groupId = groupMatches.length === 1 ? groupMatches[0] : undefined;

    for (const [key, raw] of Object.entries(row.values)) {
      if (['item_id','item_name','item_updated_at','group_id','group'].includes(key)) continue;
      const column = columnByKey.get(key);
      if (!column) {
        diagnostics.push(diag({ code:'IMPORT_COLUMN_UNRESOLVED', severity:'error', message:`Mapped column “${key}” no longer exists on this board.`, row:row.sourceRow, field:key, rule:'column.relationship', importedValue:raw, expected:'A current Board column key or ID.', conflictSource:{kind:'relationship',relationshipId:key} }));
        continue;
      }
      const normalizedCell = normalizeForColumn(board, column, raw);
      normalized[key] = normalizedCell.value;
      if (normalizedCell.diagnostic) diagnostics.push(diag({ ...normalizedCell.diagnostic, row:row.sourceRow, field:key }));
      if (column.required && normalizedCell.value == null) diagnostics.push(diag({ code:'IMPORT_REQUIRED_VALUE_MISSING', severity:'error', message:`${column.name} is required.`, row:row.sourceRow, field:key, rule:'column.required', importedValue:raw, expected:`Nonblank ${column.data_type} value.` }));
    }

    const identity = `${canonical(itemName)}\u0000${String(groupId ?? '')}`;
    const priorRow = seenIdentity.get(identity);
    if (priorRow !== undefined) diagnostics.push(diag({ code:'IMPORT_DUPLICATE_ROW', severity:'warning', message:`Duplicates import row ${priorRow}.`, row:row.sourceRow, field:'item_name', rule:'row.identity-unique', importedValue:{itemName,groupId}, expected:'Unique normalized Item Name + resolved Group within the file.', duplicateSource:{kind:'import-row',row:priorRow}, blocking:false }));
    else seenIdentity.set(identity,row.sourceRow);

    const existingById = itemId ? board.items.find((item) => String(item.id) === itemId && !item.archived_at) : undefined;
    const existingByIdentity = groupId ? board.items.find((item) => String(item.group_id) === groupId && canonical(item.title) === canonical(itemName) && !item.archived_at && (!existingById || String(item.id) !== String(existingById.id))) : undefined;
    let operation: BoardImportPreviewRow['operation'] = existingById ? 'update' : 'create';

    let differs = false;
    if (existingById) {
      differs = String(existingById.group_id) !== String(groupId ?? '') || canonical(existingById.title) !== canonical(itemName) || Object.entries(normalized).some(([key,value]) => {
        if (['item_id','item_name','item_updated_at','group_id','group'].includes(key)) return false;
        const column = columnByKey.get(key);
        return column ? comparable(itemValue(board, existingById, column)) !== comparable(value) : false;
      });
      if (existingByIdentity) diagnostics.push(diag({ code:'IMPORT_UPDATE_TARGET_CONFLICT', severity:'error', message:'Updating this Item ID would collide with another item in the target Group.', row:row.sourceRow, field:'item_name', rule:'update.target-identity-unique', importedValue:{itemName,groupId}, expected:'No other active item may have the same normalized Item Name + Group.', conflictSource:{kind:'persisted-item',itemId:String(existingByIdentity.id)} }));
      if (differs && !itemUpdatedAt) diagnostics.push(diag({ code:'IMPORT_UPDATE_VERSION_REQUIRED', severity:'error', message:'Existing Item ID changes require Item Updated At from a current export before they can be updated.', row:row.sourceRow, field:'item_updated_at', rule:'update.version-required', importedValue:row.values.item_updated_at, expected:'Current exported Item Updated At timestamp.', conflictSource:{kind:'persisted-item',itemId:String(existingById.id)} }));
      if (differs && itemUpdatedAt && String(existingById.updated_at ?? '') !== itemUpdatedAt) diagnostics.push(diag({ code:'IMPORT_UPDATE_VERSION_STALE', severity:'error', message:'This item changed after the exported snapshot. Export/refresh and review the edit again.', row:row.sourceRow, field:'item_updated_at', rule:'update.compare-and-swap', importedValue:itemUpdatedAt, expected:String(existingById.updated_at ?? ''), conflictSource:{kind:'persisted-item',itemId:String(existingById.id)} }));
    }

    let disposition: BoardImportPreviewRow['disposition'] = 'valid';
    if (excluded.has(row.sourceRow)) disposition = 'skipped';
    else if (diagnostics.some((entry) => entry.severity === 'error')) disposition = 'invalid';
    else if (priorRow !== undefined) disposition = 'duplicate';
    else if (existingById) {
      if (differs) {
        disposition = 'valid';
        diagnostics.push(diag({ code:'IMPORT_EXISTING_UPDATE_READY', severity:'info', message:'Existing item changes are ready for compare-and-swap update.', row:row.sourceRow, field:'item_id', rule:'update.reviewed', importedValue:itemId, expected:'Current Item ID + Item Updated At.', conflictSource:{kind:'persisted-item',itemId:String(existingById.id)}, blocking:false }));
      } else {
        disposition = 'duplicate';
        operation = undefined;
        diagnostics.push(diag({ code:'IMPORT_EXISTING_DUPLICATE', severity:'warning', message:'An identical item already exists on this board.', row:row.sourceRow, field:'item_id', rule:'existing.duplicate', importedValue:itemId, expected:'No mutation for identical existing rows.', duplicateSource:{kind:'persisted-item',itemId:String(existingById.id)}, blocking:false }));
      }
    } else if (existingByIdentity) {
      const identityDiffers = Object.entries(normalized).some(([key,value]) => {
        if (['item_id','item_name','item_updated_at','group_id','group'].includes(key)) return false;
        const column = columnByKey.get(key);
        return column ? comparable(itemValue(board, existingByIdentity, column)) !== comparable(value) : false;
      });
      disposition = identityDiffers || Boolean(itemId) ? 'conflict' : 'duplicate';
      operation = undefined;
      diagnostics.push(diag({ code:disposition==='conflict'?'IMPORT_EXISTING_CONFLICT':'IMPORT_EXISTING_DUPLICATE', severity:disposition==='conflict'?'error':'warning', message:disposition==='conflict'?'An existing item with the same name/group conflicts with this imported row.':'An identical item already exists on this board.', row:row.sourceRow, field:'item_name', rule:disposition==='conflict'?'existing.identity-conflict':'existing.duplicate', importedValue:{itemName,groupId,itemId:itemId||null}, expected:disposition==='conflict'?'Use the existing Item ID and current Item Updated At to perform an explicit reviewed update.':'No mutation for identical existing rows.', ...(disposition==='conflict'?{conflictSource:{kind:'persisted-item' as const,itemId:String(existingByIdentity.id)}}:{duplicateSource:{kind:'persisted-item' as const,itemId:String(existingByIdentity.id)}}), blocking:disposition==='conflict' }));
    }

    rows.push(Object.freeze({
      sourceRow: row.sourceRow,
      disposition,
      excluded: excluded.has(row.sourceRow),
      normalized: Object.freeze(normalized),
      diagnostics: Object.freeze(diagnostics),
      ...(existingById || existingByIdentity ? { existingItemId: String((existingById ?? existingByIdentity)!.id) } : {}),
      ...(groupId ? { groupId } : {}),
      ...(operation && disposition === 'valid' ? { operation } : {}),
    }));
  }

  const summary = { valid:0, invalid:0, duplicate:0, conflict:0, skipped:0, excluded:0, committable:0, creates:0, updates:0 };
  for (const row of rows) {
    summary[row.disposition] += 1;
    if (row.excluded) summary.excluded += 1;
    if (row.disposition === 'valid' && !row.excluded) {
      summary.committable += 1;
      if (row.operation === 'update') summary.updates += 1;
      else summary.creates += 1;
    }
  }
  const blocking = rows.some((row) => !row.excluded && (row.disposition === 'invalid' || row.disposition === 'conflict')) || dataset.diagnostics.some((entry) => entry.severity === 'error');
  return Object.freeze({ boardId: board.board.id, boardVersion: String(board.board.updated_at ?? ''), dataset, mapping: dataset.mapping, rows: Object.freeze(rows), summary: Object.freeze(summary), blocking, mutationAllowed: false as const });
}

export async function remapBoardImport(source: BoardImportSource, board: BoardEnvelope, options: BoardImportPreviewOptions): Promise<BoardImportPreview> {
  const dataset = await parseBoardImport(source, { ...options, schema: options.schema ?? createBoardImportSchema(board.columns) });
  return createBoardImportPreview(dataset, board, options.excludedSourceRows);
}

export function createBoardImportCommitRequest(preview: BoardImportPreview): BoardImportCommitRequest {
  if (preview.blocking) throw new Error('Resolve or exclude all invalid/conflicting rows before importing.');
  if (!preview.boardVersion) throw new Error('The board version is unavailable; refresh the board before importing.');
  const rows = preview.rows.filter((row) => row.disposition === 'valid' && !row.excluded).map((row) => {
    const itemId = String(row.normalized.item_id ?? '').trim();
    const expectedItemUpdatedAt = String(row.normalized.item_updated_at ?? '').trim();
    const operation = row.operation ?? 'create';
    return Object.freeze({
      sourceRow: row.sourceRow,
      operation,
      ...(itemId ? { itemId } : {}),
      ...(operation === 'update' && expectedItemUpdatedAt ? { expectedItemUpdatedAt } : {}),
      itemName: String(row.normalized.item_name ?? ''),
      groupId: String(row.groupId ?? ''),
      values: Object.freeze(Object.fromEntries(Object.entries(row.normalized).filter(([key]) => !['item_id','item_name','item_updated_at','group_id','group'].includes(key)))),
    });
  });
  const skipped = preview.rows.length - preview.summary.committable;
  return Object.freeze({ boardId: preview.boardId, expectedBoardVersion: preview.boardVersion, rows: Object.freeze(rows), reviewSummary: Object.freeze({ skipped, rejected: 0 }) });
}
