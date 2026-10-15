import type { BoardEnvelope, BoardColumn, BoardColumnType } from '../contracts/domain.ts';
import type { BoardImportDataset } from '../contracts/import.ts';
import type { BoardImportWizardDraft } from '../contracts/import-wizard.ts';
import type { BoardImportWizardRpcRequest, WizardWireCell, WizardWireColumn, WizardWireRow } from '../contracts/import-wizard-commit.ts';
import { planBoardImportWizard } from './board-import-wizard-plan.ts';

const normalize = (value: unknown): string => String(value ?? '').trim();
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXCEL_DAY_MS = 86_400_000;
/** Excel 1900 dates contain a fictitious 1900-02-29 (serial 60).
 * Accept calendar-day serials only; never round a fractional time into another day. */
function excelDate(raw: unknown): string | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  const serial = Math.floor(raw);
  if (serial < 1 || serial === 60 || serial > 2_958_465) throw new Error(`Invalid Excel calendar serial: ${raw}`);
  const ms = Date.UTC(1899, 11, 30) + (serial < 60 ? serial + 1 : serial) * EXCEL_DAY_MS;
  const parsed = new Date(ms);
  if (!Number.isFinite(parsed.getTime())) throw new Error(`Invalid Excel calendar serial: ${raw}`);
  return parsed.toISOString().slice(0, 10);
}

/** Reuse the Board's configured choice IDs/options, never introduce unapproved values. */
function choiceValue(text: string, type: 'status' | 'dropdown', column: BoardColumn | undefined): string {
  if (!column) throw new Error(`New ${type} columns require approved options in the backend import contract.`);
  const key = text.toLocaleLowerCase();
  if (type === 'status' && column.system_key === 'status') {
    const ids = ['not_started', 'in_progress', 'blocked', 'done'];
    const matches = ids.filter(id => id === key || id.replaceAll('_', ' ') === key);
    if (matches.length === 1) return matches[0]!;
    throw new Error(`Unsupported Status label: ${text}`);
  }
  if (type === 'status') {
    const config = column.config as { readonly labels?: readonly { id: string; name: string; active?: boolean }[] };
    const labels = Array.isArray(config?.labels) ? config.labels : [];
    const matches = labels.filter(label => label.active !== false &&
      (label.name.trim().toLocaleLowerCase() === key || label.id.toLocaleLowerCase() === key));
    if (matches.length === 1) return matches[0]!.id;
    if (matches.length > 1) throw new Error(`Ambiguous Status label: ${text}`);
    throw new Error(`Unsupported Status label: ${text}`);
  }
  const config = column.config as { readonly options?: readonly string[] };
  const options = Array.isArray(config?.options) ? config.options : [];
  const matches = options.filter(option => option.trim().toLocaleLowerCase() === key);
  if (matches.length === 1) return matches[0]!;
  if (matches.length > 1) throw new Error(`Ambiguous Dropdown option: ${text}`);
  throw new Error(`Unsupported Dropdown option: ${text}`);
}

const date = (value: string): boolean => {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
};

function normalizeCell(raw: unknown, type: BoardColumnType, column: BoardColumn | undefined, board: BoardEnvelope): WizardWireCell {
  if (raw === null || raw === undefined || normalize(raw) === '') return null;
  const text = normalize(raw);
  switch (type) {
    case 'number': {
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) throw new Error(`Invalid decimal value: ${text}`);
      const value = Number(text);
      if (!Number.isFinite(value)) throw new Error('Numbers must be finite.');
      return value;
    }
    case 'checkbox': {
      if (typeof raw === 'boolean') return raw;
      if (['true','yes','1','v','x','checked','✓','✔'].includes(text.toLowerCase())) return true;
      if (['false','no','0','unchecked'].includes(text.toLowerCase())) return false;
      throw new Error(`Invalid checkbox value: ${text}`);
    }
    case 'date': { const day = excelDate(raw) ?? text; if (!date(day)) throw new Error(`Invalid calendar date: ${text} (expected YYYY-MM-DD or Excel date serial)`); return day; }
    case 'timeline': {
      const match = /^(\d{4}-\d{2}-\d{2})\s*\/\s*(\d{4}-\d{2}-\d{2})$/.exec(text);
      if (!match || !date(match[1]!) || !date(match[2]!) || match[2]! < match[1]!) throw new Error(`Invalid timeline: ${text}`);
      return { start: match[1]!, end: match[2]! };
    }
    case 'people': {
      if (!UUID.test(text) || !board.members.some(m => String(m.user_id) === text)) throw new Error(`People must reference a Board member UUID: ${text}`);
      return text;
    }
    case 'email': if (text.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new Error(`Invalid email: ${text}`); return text.toLowerCase();
    case 'url': {
      if (text.length > 2000) throw new Error('URL exceeds 2000 characters.');
      try { const url = new URL(text); if (!['http:','https:'].includes(url.protocol)) throw new Error(); }
      catch { throw new Error(`Invalid HTTP/HTTPS URL: ${text}`); }
      return text;
    }
    case 'status': case 'dropdown': return choiceValue(text, type, column);
    case 'long_text': if (text.length > 5000) throw new Error('Long text exceeds 5000 characters.'); return text;
    case 'text': if (text.length > 1000) throw new Error('Text exceeds 1000 characters.'); return text;
  }
}

/** Pure fail-closed request construction. Does not call a backend or write state. */
export function createBoardImportWizardRpcRequest(
  dataset: BoardImportDataset,
  board: BoardEnvelope,
  draft: BoardImportWizardDraft,
): BoardImportWizardRpcRequest {
  if (!dataset.rows.length || dataset.rows.length > 5000) throw new Error('A reviewed wizard import must contain 1–5,000 rows.');
  const plan = planBoardImportWizard(dataset, board, draft);
  if (!plan.configurationValid || plan.errors.length || !board.board) throw new Error('Correct import mapping, matching and row validation errors before committing.');
  if (board.columns.length + plan.plannedColumnCount > 30) throw new Error('Board column limit is 30; exclude excess columns.');
  const byId = new Map(board.columns.map(column => [String(column.id), column]));
  const columns: WizardWireColumn[] = [];
  for (const mapping of draft.mappings) {
    if (mapping.action !== 'create') continue;
    if (!normalize(mapping.name) || normalize(mapping.name).length > 80) throw new Error('New Board column names must contain 1–80 characters.');
    // The reference screenshots provide no choice-option approval UI. Refuse silent/default labels.
    if (['status','dropdown'].includes(mapping.columnType)) throw new Error('New status/dropdown columns require explicit options approval before import. Map an existing column or select Text.');
    columns.push(Object.freeze({ source: mapping.source, name: normalize(mapping.name), type: mapping.columnType, config: Object.freeze({}) }));
  }
  if (draft.matches.behavior !== 'add-new' && draft.matches.matchColumnId !== 'item') {
    const match = byId.get(draft.matches.matchColumnId);
    if (!match || !['text','email','url','status','dropdown'].includes(match.data_type)) throw new Error('Matching supports primary Item, Text, Email, URL, Status or Dropdown columns.');
  }
  const sources = new Map(dataset.headers.map((header,index) => [header,index]));
  const titleColumn = draft.mappings.find(m => m.action === 'item');
  if (!titleColumn) throw new Error('Exactly one primary Item mapping is required.');
  const rows: WizardWireRow[] = [];
  for (const parsed of dataset.rows) {
    const titleIndex = sources.get(titleColumn.source);
    if (titleIndex === undefined) throw new Error('Primary Item source column is missing.');
    const title = normalize(parsed.raw[titleIndex]);
    if (!title || title.length > 240) throw new Error(`Invalid Item name at source row ${parsed.sourceRow}.`);
    const cells: Record<string, WizardWireCell> = {};
    for (const mapping of draft.mappings) {
      if (mapping.action !== 'create' && mapping.action !== 'existing') continue;
      const index = sources.get(mapping.source);
      if (index === undefined) throw new Error('Mapped source column is missing.');
      const column = mapping.action === 'existing' ? byId.get(mapping.columnId) : undefined;
      if (mapping.action === 'existing' && !column) throw new Error('An existing target column was removed; refresh and review.');
      const kind = mapping.action === 'existing' ? column!.data_type : mapping.columnType;
      try { cells[mapping.source] = normalizeCell(parsed.raw[index],kind,column,board); }
      catch (error) { throw new Error(`Source row ${parsed.sourceRow}, ${mapping.source}: ${error instanceof Error ? error.message : 'Invalid value'}`); }
    }
    const decision = plan.decisions.find(d => d.sourceRow === parsed.sourceRow);
    if (!decision || decision.decision === 'blocked') throw new Error(`Source row ${parsed.sourceRow} cannot be committed.`);
    const target = decision.decision === 'update' ? board.items.find(i => String(i.id) === decision.existingItemId) : undefined;
    if (decision.decision === 'update' && !target?.updated_at) throw new Error(`Source row ${parsed.sourceRow} requires a current Item Updated At value.`);
    rows.push(Object.freeze({ source_row: parsed.sourceRow, title, values: Object.freeze(cells),
      ...(target?.updated_at ? { expected_item_updated_at: String(target.updated_at) } : {}) }));
  }
  const output = {
    contract:'m143-v1' as const,
    worksheet: draft.sourceWorksheet,
    group: Object.freeze({ ...draft.group }),
    matches: Object.freeze({ ...draft.matches }),
    mappings: Object.freeze(draft.mappings.map(m => Object.freeze({...m}))),
    newColumns: Object.freeze(columns),
    rows: Object.freeze(rows),
  };
  return Object.freeze({ boardId: plan.boardId, expectedBoardVersion: plan.boardVersion, payload: Object.freeze(output) });
}

/** Compose one atomic grouped RPC; never issue one HTTP request per spreadsheet group.
 * Reuse the reviewed M143 planner and cell-normalization on every section. */
export function createGroupedBoardImportWizardRpcRequest(
  dataset: BoardImportDataset,
  board: BoardEnvelope,
  draft: BoardImportWizardDraft,
): BoardImportWizardRpcRequest {
  const sections=dataset.groupSections ?? [];
  const targets=draft.sectionTargets ?? [];
  if(sections.length<2 || sections.length>25 || targets.length!==sections.length) throw new Error('Review every detected spreadsheet group before importing.');
  const seen=new Set<number>();
  const usedNames=new Set<string>();
  const grouped: { heading_row:number;name:string;group:BoardImportWizardDraft['group'];rows:readonly WizardWireRow[] }[]=[];
  for(const section of sections){
    const selected=targets.find(target=>target.headingRow===section.headingRow);
    if(!selected || seen.has(section.headingRow) || selected.name!==section.name) throw new Error('Spreadsheet group mapping changed; review the import again.');
    seen.add(section.headingRow);
    const key=section.name.trim().toLocaleLowerCase();
    if(usedNames.has(key)) throw new Error('Repeated group names cannot be mapped ambiguously.');
    usedNames.add(key);
    const filtered=dataset.rows.filter(row=>row.sourceRow>=section.firstDataRow&&row.sourceRow<=section.lastDataRow);
    if(filtered.length===0) throw new Error(`Group “${section.name}” has no importable Item rows.`);
    const partial=Object.freeze({...dataset,groupSections:Object.freeze([]),rows:Object.freeze(filtered)});
    const single=createBoardImportWizardRpcRequest(partial,board,{...draft,group:selected.destination});
    grouped.push(Object.freeze({heading_row:section.headingRow,name:section.name,group:selected.destination,rows:single.payload.rows}));
  }
  const rowCount=grouped.reduce((sum,section)=>sum+section.rows.length,0);
  if(rowCount!==dataset.rows.length || rowCount>5000) throw new Error('Some spreadsheet rows are outside the detected groups. Review exclusions.');
  const all=grouped.flatMap(section=>section.rows);
  if(new Set(all.map(row=>row.source_row)).size!==all.length) throw new Error('A source row belongs to more than one group.');
  const exemplar=createBoardImportWizardRpcRequest(
    Object.freeze({...dataset,groupSections:Object.freeze([]),rows:Object.freeze(dataset.rows.filter(row=>row.sourceRow>=sections[0]!.firstDataRow&&row.sourceRow<=sections[0]!.lastDataRow))}),
    board,{...draft,group:targets[0]!.destination},
  );
  return Object.freeze({boardId:exemplar.boardId,expectedBoardVersion:exemplar.expectedBoardVersion,
    payload:Object.freeze({...exemplar.payload,contract:'m14417-v1' as const,rows:Object.freeze(all),groups:Object.freeze(grouped)})});
}
