import type { BoardEnvelope, BoardColumn } from '../contracts/domain.ts';
import type { BoardImportDataset } from '../contracts/import.ts';
import type {
  BoardImportWizardColumnChoice,
  BoardImportWizardDraft,
  BoardImportWizardIssue,
  BoardImportWizardPlan,
  BoardImportWizardRowDecision,
} from '../contracts/import-wizard.ts';

const normalize = (value: unknown): string => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const keyOf = (value: unknown): string => value == null || String(value).trim() === ''
  ? '' : typeof value === 'boolean' ? `b:${value}` : `v:${normalize(value)}`;
const RESERVED = new Set(['item id', 'item updated at', 'group id']);

function cellFor(board: BoardEnvelope, itemId: string, column: BoardColumn): unknown {
  if (column.system_key === 'title') return board.items.find((item) => String(item.id) === itemId)?.title;
  if (column.system_key === 'status') return board.items.find((item) => String(item.id) === itemId)?.status;
  if (column.system_key === 'assignee') return board.items.find((item) => String(item.id) === itemId)?.assignee_id;
  if (column.system_key === 'due_date') return board.items.find((item) => String(item.id) === itemId)?.due_date;
  if (column.system_key === 'notes') return board.items.find((item) => String(item.id) === itemId)?.notes;
  return board.values.find((v) => String(v.item_id) === itemId && String(v.column_id) === String(column.id))?.value;
}

/**
 * M141 provides a deterministic read-only plan for the reference three-step
 * importer. It does NOT generate an RPC request or bypass existing M103 guards.
 * Rows are read from parser-preserved `raw` values indexed by `headers`.
 */
export function planBoardImportWizard(
  dataset: BoardImportDataset,
  board: BoardEnvelope,
  draft: BoardImportWizardDraft,
): BoardImportWizardPlan {
  const errors: BoardImportWizardIssue[] = [];
  const cautions: BoardImportWizardIssue[] = [];
  const error = (code: string, message: string, sourceRow?: number, sourceColumn?: string): void => {
    errors.push(Object.freeze({ code, message, ...(sourceRow !== undefined ? { sourceRow } : {}), ...(sourceColumn ? { sourceColumn } : {}) }));
  };
  const caution = (code: string, message: string, sourceColumn?: string): void => {
    cautions.push(Object.freeze({ code, message, ...(sourceColumn ? { sourceColumn } : {}) }));
  };
  if (!board.board) throw new Error('Cannot plan an import without an authoritative Board.');
  if (dataset.selectedWorksheet !== draft.sourceWorksheet) error('WIZARD_WORKSHEET_CHANGED', 'The selected worksheet changed; review mappings again.');
  if (dataset.diagnostics.some((d) => d.severity === 'error')) error('WIZARD_PARSER_ERRORS', 'Resolve source-file parsing diagnostics before importing.');
  if (!board.board.updated_at) error('WIZARD_BOARD_VERSION_MISSING', 'Refresh the Board to obtain a concurrency version.');

  const headers = new Map<string, string>();
  for (const header of dataset.headers) {
    const canonical = normalize(header);
    if (!canonical) error('WIZARD_EMPTY_SOURCE_HEADER', 'A source column header is empty.');
    if (headers.has(canonical)) error('WIZARD_DUPLICATE_SOURCE_HEADER', `Source header “${header}” is ambiguous.`, undefined, header);
    headers.set(canonical, header);
  }
  const mappingByHeader = new Map<string, BoardImportWizardColumnChoice>();
  const existingById = new Map(board.columns.map((c) => [String(c.id), c]));
  const claimedColumns = new Set<string>();
  const newColumnNames = new Set<string>();
  const currentNames = new Set(board.columns.map((c) => normalize(c.name)));
  let itemMapped = 0;
  let created = 0;
  let mapped = 0;
  let skipped = 0;

  for (const choice of draft.mappings) {
    const sourceKey = normalize(choice.source);
    if (!headers.has(sourceKey)) { error('WIZARD_UNKNOWN_SOURCE', `Source column “${choice.source}” does not exist.`, undefined, choice.source); continue; }
    if (mappingByHeader.has(sourceKey)) { error('WIZARD_SOURCE_MAPPED_TWICE', `Source column “${choice.source}” was mapped more than once.`, undefined, choice.source); continue; }
    mappingByHeader.set(sourceKey, choice);
    if (choice.action === 'item') {
      itemMapped += 1;
      mapped += 1;
    } else if (choice.action === 'skip') {
      skipped += 1;
    } else if (choice.action === 'existing') {
      const column = existingById.get(choice.columnId);
      if (!column) error('WIZARD_TARGET_MISSING', `Destination column for “${choice.source}” no longer exists.`, undefined, choice.source);
      if (column?.system_key === 'title') error('WIZARD_ITEM_COLUMN_RESERVED', 'Map the primary Item field using the Item action.', undefined, choice.source);
      if (claimedColumns.has(choice.columnId)) error('WIZARD_TARGET_MAPPED_TWICE', `Multiple source columns target “${column?.name ?? choice.columnId}”.`, undefined, choice.source);
      claimedColumns.add(choice.columnId);
      mapped += 1;
    } else if (choice.action === 'create') {
      const name = choice.name.trim();
      if (!name || name.length > 80) error('WIZARD_COLUMN_NAME_INVALID', 'New column name must contain 1–80 characters.', undefined, choice.source);
      if (RESERVED.has(normalize(name))) error('WIZARD_RESERVED_NAME', 'An internal identity/version field cannot be created as a normal Board column.', undefined, choice.source);
      if (currentNames.has(normalize(name)) || newColumnNames.has(normalize(name))) error('WIZARD_COLUMN_NAME_COLLISION', `New column “${name}” conflicts with another column.`, undefined, choice.source);
      if (!['text','long_text','number','status','dropdown','date','people','checkbox','timeline','email','url'].includes(choice.columnType)) error('WIZARD_COLUMN_TYPE_INVALID', `Unsupported column type for “${name}”.`, undefined, choice.source);
      if (choice.columnType === 'status' || choice.columnType === 'dropdown') caution('WIZARD_COLUMN_OPTIONS_REQUIRE_APPROVAL', `Configure valid labels/options for “${name}” before committing.`, choice.source);
      if (normalize(choice.source) === 'subitems') caution('WIZARD_SUBITEMS_NOT_HIERARCHY', 'A Subitems column is data, not a verified parent-child relationship.', choice.source);
      newColumnNames.add(normalize(name));
      created += 1;
    }
  }
  for (const header of dataset.headers) {
    if (!mappingByHeader.has(normalize(header))) error('WIZARD_UNMAPPED_SOURCE', `Choose a mapping, new column, or exclusion for “${header}”.`, undefined, header);
  }
  if (board.columns.length + created > 30) error('WIZARD_COLUMN_LIMIT', 'Board supports at most 30 total columns.');
  if (dataset.rows.length > 5000) error('WIZARD_ROW_LIMIT', 'Wizard import supports at most 5,000 rows.');
  if (itemMapped !== 1) error('WIZARD_PRIMARY_ITEM_REQUIRED', 'Select exactly one source column for the primary Item field.');

  let targetGroupId = '';
  const chosenGroup = draft.group;
  if (chosenGroup.action === 'existing') {
    const group = board.groups.find((g) => String(g.id) === chosenGroup.groupId);
    if (!group) error('WIZARD_GROUP_NOT_FOUND', 'The selected destination group does not exist.');
    else targetGroupId = String(group.id);
  } else {
    const name = chosenGroup.name.trim();
    if (!name || name.length > 120) error('WIZARD_GROUP_NAME_INVALID', 'New group name must contain 1–120 characters.');
    if (board.groups.some((g) => normalize(g.title) === normalize(name))) error('WIZARD_GROUP_NAME_COLLISION', 'A group with that name exists; select the existing group.');
  }

  const matched = draft.matches;
  let matchMapping: BoardImportWizardColumnChoice | undefined;
  let matchColumn: BoardColumn | undefined;
  if (matched.behavior !== 'add-new') {
    if (draft.group.action === 'create' && matched.behavior === 'update') error('WIZARD_UPDATE_NEW_GROUP', 'Updates cannot match items in a group that does not exist.');
    matchMapping = draft.mappings.find((m) => matched.matchColumnId === 'item' ? m.action === 'item' : m.action === 'existing' && m.columnId === matched.matchColumnId);
    if (!matchMapping) error('WIZARD_MATCH_MAPPING_REQUIRED', 'Select a mapped existing target column to identify matches.');
    if (matched.matchColumnId !== 'item') {
      matchColumn = existingById.get(matched.matchColumnId);
      if (!matchColumn) error('WIZARD_MATCH_COLUMN_MISSING', 'The chosen matching column is not present on this Board.');
      if (matchColumn && ['long_text', 'timeline', 'people'].includes(matchColumn.data_type)) error('WIZARD_MATCH_TYPE_UNSUPPORTED', 'Choose a scalar, single-valued matching column.');
    }
  }

  const decisions: BoardImportWizardRowDecision[] = [];
  const sourceItemMapping = draft.mappings.find((m) => m.action === 'item');
  const sourceMatch = matched.behavior !== 'add-new' ? matchMapping?.source : sourceItemMapping?.source;
  const matchIndex = sourceMatch ? dataset.headers.findIndex((h) => normalize(h) === normalize(sourceMatch)) : -1;
  const itemsByKey = new Map<string, string[]>();
  if (matched.behavior !== 'add-new' && targetGroupId) {
    for (const item of board.items.filter((i) => !i.archived_at && String(i.group_id) === targetGroupId)) {
      const value = matched.matchColumnId === 'item' ? item.title : matchColumn ? cellFor(board, String(item.id), matchColumn) : null;
      const key = keyOf(value);
      if (key) itemsByKey.set(key, [...(itemsByKey.get(key) ?? []), String(item.id)]);
    }
  }
  const sourceMatchKeys = new Set<string>();
  for (const row of dataset.rows) {
    const itemIndex = sourceItemMapping ? dataset.headers.findIndex((h) => normalize(h) === normalize(sourceItemMapping.source)) : -1;
    const title = itemIndex < 0 ? '' : String(row.raw[itemIndex] ?? '').trim();
    if (!title || title.length > 240) {
      error('WIZARD_ITEM_NAME_INVALID', 'Item names must contain 1–240 characters.', row.sourceRow);
      decisions.push(Object.freeze({ sourceRow: row.sourceRow, decision: 'blocked', reason: 'Item name invalid' }));
      continue;
    }
    if (matched.behavior === 'add-new') {
      decisions.push(Object.freeze({ sourceRow: row.sourceRow, decision: 'create' }));
      continue;
    }
    const key = matchIndex < 0 ? '' : keyOf(row.raw[matchIndex]);
    if (!key) {
      error('WIZARD_MATCH_VALUE_REQUIRED', 'The chosen matching field must not be blank.', row.sourceRow, sourceMatch);
      decisions.push(Object.freeze({ sourceRow: row.sourceRow, decision: 'blocked', reason: 'Missing match key' }));
      continue;
    }
    if (sourceMatchKeys.has(key)) {
      error('WIZARD_MATCH_SOURCE_AMBIGUOUS', 'Multiple source rows use the same match value.', row.sourceRow, sourceMatch);
      decisions.push(Object.freeze({ sourceRow: row.sourceRow, decision: 'blocked', reason: 'Ambiguous source match' }));
      continue;
    }
    sourceMatchKeys.add(key);
    const existing = itemsByKey.get(key) ?? [];
    if (existing.length > 1) {
      error('WIZARD_MATCH_TARGET_AMBIGUOUS', 'More than one existing item matches this value.', row.sourceRow, sourceMatch);
      decisions.push(Object.freeze({ sourceRow: row.sourceRow, decision: 'blocked', reason: 'Ambiguous target match' }));
    } else if (existing.length === 1) {
      decisions.push(Object.freeze({ sourceRow: row.sourceRow, decision: matched.behavior === 'skip' ? 'skip' : 'update', existingItemId: existing[0]! }));
    } else {
      decisions.push(Object.freeze({ sourceRow: row.sourceRow, decision: matched.behavior === 'skip' ? 'create' : 'skip', reason: 'No existing match' }));
    }
  }
  if (draft.matches.behavior === 'add-new') caution('WIZARD_ADD_NEW_DUPLICATE_POLICY', 'Existing server constraints may reject duplicate Item names in the same group. A new backend contract is required.');
  if (draft.matches.behavior === 'update') caution('WIZARD_UPDATE_REQUIRES_CONCURRENCY', 'Matches alone do not authorize edits; item-version compare-and-swap is still required.');
  return Object.freeze({
    sourceWorksheet: draft.sourceWorksheet,
    boardId: String(board.board.id),
    boardVersion: String(board.board.updated_at ?? ''),
    mappings: Object.freeze([...draft.mappings]),
    plannedColumnCount: created,
    mappedColumnCount: mapped,
    excludedColumnCount: skipped,
    group: Object.freeze({ ...draft.group }),
    matches: Object.freeze({ ...draft.matches }),
    decisions: Object.freeze(decisions),
    errors: Object.freeze(errors),
    cautions: Object.freeze(cautions),
    configurationValid: errors.length === 0,
    // Even a pure item import remains blocked from committing via this new API
    // until the reviewed M143 adapter is explicitly integrated and verified.
    requiresExtendedBackend: created > 0 || draft.group.action === 'create' || draft.matches.behavior !== 'skip',
    mutationAllowed: false as const,
  });
}
