import type { BoardColumn, BoardEnvelope, BoardItem, BoardCellValue, TimelineValue } from '../contracts/domain.ts';
import type { BoardExportArtifact, BoardExportFormat, BoardExportOptions, BoardPortableColumnSpecification, BoardPortableSpecification } from '../contracts/export.ts';

const encoder = new TextEncoder();
const xmlEscape = (v: unknown) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const csvCell = (v: unknown) => { const s=String(v ?? ''); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
const sanitizeFile = (v: string) => v.trim().replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,100) || 'board';
const colHeader = (column: BoardColumn) => String(column.column_key || column.id);
const isTimeline = (v: unknown): v is TimelineValue => Boolean(v && typeof v === 'object' && !Array.isArray(v) && ('start' in (v as object) || 'end' in (v as object)));
const timelineText = (v: TimelineValue | null) => v ? `${v.start ?? ''}/${v.end ?? ''}` : '';

function valueFor(board: BoardEnvelope, item: BoardItem, column: BoardColumn): BoardCellValue | null {
  if (column.system_key === 'title') return item.title;
  if (column.system_key === 'status') return item.status ?? null;
  if (column.system_key === 'assignee') return item.assignee_id ?? null;
  if (column.system_key === 'due_date') return item.due_date ?? null;
  if (column.system_key === 'notes') return item.notes ?? '';
  return board.values.find((entry) => entry.item_id === item.id && entry.column_id === column.id)?.value ?? null;
}

function portableValue(value: BoardCellValue | null): string | number | boolean {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (isTimeline(value)) return timelineText(value);
  if (Array.isArray(value)) return value.join(';');
  return String(value);
}

function specForColumn(column: BoardColumn): BoardPortableColumnSpecification {
  const accepted = column.data_type === 'status' && Array.isArray(column.config?.labels)
    ? column.config.labels.flatMap((label) => [String(label.id), String(label.name)])
    : column.data_type === 'dropdown' && Array.isArray(column.config?.options)
      ? column.config.options.map(String) : [];
  const common = { key:String(column.column_key || column.id), header:colHeader(column), label:column.name, dataType:column.data_type, required:Boolean(column.required), unique:false, nullable:!column.required, blankAllowed:!column.required, duplicateBehavior:'Rows are deduplicated by normalized Item Name + resolved Group; identical existing rows are skipped and differing existing rows are conflicts.' } as const;
  switch(column.data_type) {
    case 'number': return Object.freeze({...common,acceptedValues:[],format:'Finite decimal number using . as decimal separator.',maxLength:null,example:'1250.5',normalization:'Numeric strings are converted to finite numbers.',relationship:'None.',validation:'Must parse as a finite number.'});
    case 'checkbox': return Object.freeze({...common,acceptedValues:['true','false','yes','no','1','0'],format:'Boolean token.',maxLength:5,example:'true',normalization:'true/yes/1 → true; false/no/0 → false.',relationship:'None.',validation:'Must use one supported boolean representation.'});
    case 'date': return Object.freeze({...common,acceptedValues:[],format:'YYYY-MM-DD',maxLength:10,example:'2026-10-05',normalization:'Trimmed ISO calendar date is preserved.',relationship:'None.',validation:'Must be a real Gregorian calendar date matching YYYY-MM-DD.'});
    case 'timeline': return Object.freeze({...common,acceptedValues:[],format:'YYYY-MM-DD/YYYY-MM-DD with both endpoints required when nonblank.',maxLength:21,example:'2026-10-01/2026-10-31',normalization:'Serialized range is normalized to {start,end} ISO dates; partial ranges are rejected to match the authoritative database contract.',relationship:'None.',validation:'Both endpoints must be real Gregorian calendar dates and end must be on or after start.'});
    case 'people': return Object.freeze({...common,acceptedValues:[],format:'UUID',maxLength:36,example:'11111111-1111-4111-8111-111111111111',normalization:'Trimmed UUID is preserved.',relationship:'References a current member of this Board.',validation:'Must be a UUID belonging to a current Board member before commit.'});
    case 'status': return Object.freeze({...common,acceptedValues:Object.freeze(accepted),format:'Status label ID (preferred) or exact configured label name.',maxLength:null,example:String((column.config?.labels?.[0] as {id?:unknown}|undefined)?.id ?? ''),normalization:'Accepted label names/IDs normalize to the stable status label ID.',relationship:'References a label configured on this status column.',validation:'Must resolve to a configured status label.'});
    case 'dropdown': return Object.freeze({...common,acceptedValues:Object.freeze(accepted),format:'Exact configured option text.',maxLength:1000,example:String(column.config?.options?.[0] ?? ''),normalization:'Trim surrounding whitespace; preserve option text.',relationship:'References this column’s configured option set.',validation:'Must equal a configured option when options exist.'});
    case 'email': return Object.freeze({...common,acceptedValues:[],format:'RFC-style email address.',maxLength:320,example:'name@example.com',normalization:'Trim surrounding whitespace.',relationship:'None.',validation:'Must contain a valid local@domain structure.'});
    case 'url': return Object.freeze({...common,acceptedValues:[],format:'Absolute HTTP or HTTPS URL.',maxLength:2000,example:'https://example.com/',normalization:'Parsed URL is serialized to its normalized URL string.',relationship:'None.',validation:'Only http: and https: protocols are accepted.'});
    case 'long_text': return Object.freeze({...common,acceptedValues:[],format:'UTF-8 text; CSV quoting rules apply.',maxLength:5000,example:'Long-form notes',normalization:'Normalize CRLF/CR to LF and trim outer whitespace on import.',relationship:'None.',validation:'Maximum 5000 characters.'});
    default: return Object.freeze({...common,acceptedValues:[],format:'UTF-8 text.',maxLength:1000,example:'Example text',normalization:'Normalize CRLF/CR to LF and trim outer whitespace on import.',relationship:'None.',validation:'Maximum 1000 characters.'});
  }
}

export function createBoardPortableSpecification(board: BoardEnvelope): BoardPortableSpecification {
  if(!board.board) throw new Error('Board export requires an authoritative board envelope.');
  const core: BoardPortableColumnSpecification[] = [
    {key:'item_id',header:'Item ID',label:'Item ID',dataType:'item_id',required:false,acceptedValues:[],format:'UUID',unique:true,nullable:true,blankAllowed:true,maxLength:36,example:'11111111-1111-4111-8111-111111111111',normalization:'Trimmed. Existing IDs identify explicit updates; globally unused IDs are preserved for reconstruction.',relationship:'Existing Board item identifier for updates or preserved reconstruction identifier for creates.',validation:'If present, must be a UUID and unique within the import file.',duplicateBehavior:'Repeated Item IDs are blocking validation errors.'},
    {key:'item_name',header:'Item Name',label:'Item Name',dataType:'item_name',required:true,acceptedValues:[],format:'UTF-8 text',unique:false,nullable:false,blankAllowed:false,maxLength:240,example:'Prepare project brief',normalization:'Trim outer whitespace.',relationship:'None.',validation:'1-240 characters.',duplicateBehavior:'Combined with resolved Group identity for duplicate/conflict detection.'},
    {key:'item_updated_at',header:'Item Updated At',label:'Item Updated At',dataType:'item_updated_at',required:false,acceptedValues:[],format:'ISO-8601 timestamp with timezone',unique:false,nullable:true,blankAllowed:true,maxLength:null,example:'2026-10-05T08:00:00.000Z',normalization:'Trimmed; preserved exactly as the compare-and-swap version token.',relationship:'Required when an existing Item ID is changed through bulk-edit re-import.',validation:'Must be a parseable ISO-8601 timestamp with Z or numeric timezone offset.',duplicateBehavior:'Does not define duplicate identity; stale values cause a blocking conflict.'},
    {key:'group_id',header:'Group ID',label:'Group ID',dataType:'group_id',required:false,acceptedValues:[],format:'UUID',unique:false,nullable:true,blankAllowed:true,maxLength:36,example:'22222222-2222-4222-8222-222222222222',normalization:'Trimmed; used directly when it belongs to the target Board, otherwise exact Group name can remap the relationship.',relationship:'Board group identifier.',validation:'If present, must be a UUID. A nonmatching target-Board ID may fall back to exact Group name resolution.',duplicateBehavior:'Does not independently define duplicate identity.'},
    {key:'group',header:'Group',label:'Group',dataType:'group',required:false,acceptedValues:board.groups.map((g)=>g.title),format:'Exact group title.',unique:false,nullable:true,blankAllowed:true,maxLength:120,example:board.groups[0]?.title ?? 'Main Group',normalization:'Trim whitespace; case-insensitive lookup.',relationship:'Must resolve to exactly one board group; blank selects the first group.',validation:'Maximum 120 characters and must resolve unambiguously.',duplicateBehavior:'Combined with Item Name for duplicate/conflict detection.'},
  ];
  return Object.freeze({version:'1.1',boardId:String(board.board.id),boardName:board.board.name,columns:Object.freeze([...core,...board.columns.filter((column)=>column.system_key!=='title').map(specForColumn)]),duplicatePolicy:'Duplicate import rows and identical existing items are skipped; no mutation occurs for duplicates.',conflictPolicy:'Name/group collisions without a safe matching Item ID are blocking conflicts. Stale Item Updated At values also block updates.',updatePolicy:'Existing Item ID + matching exported Item Updated At enables an explicit reviewed compare-and-swap update. New rows are created; a supplied globally unused Item ID is preserved for reconstruction. No name-only overwrite is permitted.'});
}

function rowsFor(board: BoardEnvelope, spec: BoardPortableSpecification, options: BoardExportOptions): (string|number|boolean)[][] {
  if(options.template) {
    if(!options.includeExamples) return [];
    return [spec.columns.map((column)=> column.example)];
  }
  const groups=new Map(board.groups.map((g)=>[String(g.id),g] as const));
  const items=board.items.filter((item)=>options.includeArchived || !item.archived_at);
  return items.map((item)=>spec.columns.map((column)=>{
    if(column.key==='item_id') return String(item.id);
    if(column.key==='item_name') return item.title;
    if(column.key==='item_updated_at') return String(item.updated_at ?? '');
    if(column.key==='group_id') return String(item.group_id);
    if(column.key==='group') return groups.get(String(item.group_id))?.title ?? '';
    const boardColumn=board.columns.find((entry)=>String(entry.column_key || entry.id)===column.key);
    return boardColumn ? portableValue(valueFor(board,item,boardColumn)) : '';
  }));
}

function csvBytes(spec: BoardPortableSpecification, rows:(string|number|boolean)[][]):Uint8Array {
  const lines=[spec.columns.map(c=>csvCell(c.header)).join(','),...rows.map(row=>row.map(csvCell).join(','))];
  return encoder.encode('\uFEFF'+lines.join('\r\n')+'\r\n');
}

const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc32=(bytes:Uint8Array)=>{let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&0xff]!^(c>>>8);return (c^0xffffffff)>>>0;};
const le16=(v:number)=>new Uint8Array([v&255,(v>>>8)&255]);
const le32=(v:number)=>new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);
const join=(parts:readonly Uint8Array[])=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;};
function zipStore(entries: readonly {name:string;bytes:Uint8Array}[]):Uint8Array{
  const locals:Uint8Array[]=[]; const centrals:Uint8Array[]=[]; let offset=0;
  for(const entry of entries){const name=encoder.encode(entry.name);const crc=crc32(entry.bytes);const local=join([le32(0x04034b50),le16(20),le16(0),le16(0),le16(0),le16(0),le32(crc),le32(entry.bytes.length),le32(entry.bytes.length),le16(name.length),le16(0),name,entry.bytes]);locals.push(local);const central=join([le32(0x02014b50),le16(20),le16(20),le16(0),le16(0),le16(0),le16(0),le32(crc),le32(entry.bytes.length),le32(entry.bytes.length),le16(name.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(offset),name]);centrals.push(central);offset+=local.length;}
  const central=join(centrals);return join([...locals,central,le32(0x06054b50),le16(0),le16(0),le16(entries.length),le16(entries.length),le32(central.length),le32(offset),le16(0)]);
}
const cellRef=(r:number,c:number)=>{let n=c+1,s='';while(n){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26);}return `${s}${r+1}`;};
function sheetXml(rows:readonly (string|number|boolean)[][]):string{return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row,r)=>`<row r="${r+1}">${row.map((v,c)=>{const ref=cellRef(r,c);if(typeof v==='number')return `<c r="${ref}"><v>${v}</v></c>`;if(typeof v==='boolean')return `<c r="${ref}" t="b"><v>${v?1:0}</v></c>`;return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(v)}</t></is></c>`;}).join('')}</row>`).join('')}</sheetData></worksheet>`;}
function xlsxBytes(spec:BoardPortableSpecification,rows:(string|number|boolean)[][]):Uint8Array{
  const data=[spec.columns.map(c=>c.header),...rows];
  const instructions=[['Work Management Boards Import Specification'],['Board',spec.boardName],['Version',spec.version],['Column','Type','Required','Accepted values / format','Example','Normalization / validation'],...spec.columns.map(c=>[c.header,c.dataType,c.required?'Required':'Optional',c.acceptedValues.length?c.acceptedValues.join(' | '):c.format,c.example,`${c.normalization} ${c.validation}`])];
  const entries=[
    {name:'[Content_Types].xml',bytes:encoder.encode(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`)},
    {name:'_rels/.rels',bytes:encoder.encode(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)},
    {name:'xl/workbook.xml',bytes:encoder.encode(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/><sheet name="Instructions" sheetId="2" r:id="rId2"/></sheets></workbook>`)},
    {name:'xl/_rels/workbook.xml.rels',bytes:encoder.encode(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>`)},
    {name:'xl/worksheets/sheet1.xml',bytes:encoder.encode(sheetXml(data))},
    {name:'xl/worksheets/sheet2.xml',bytes:encoder.encode(sheetXml(instructions as (string|number|boolean)[][]))},
  ];return zipStore(entries);
}

export function exportBoard(board:BoardEnvelope,format:BoardExportFormat,options:BoardExportOptions={}):BoardExportArtifact{
  const spec=createBoardPortableSpecification(board); const rows=rowsFor(board,spec,options); const stem=`${sanitizeFile(spec.boardName)}-${options.template?'import-template':'export'}`;
  return Object.freeze({format,fileName:`${stem}.${format}`,mimeType:format==='csv'?'text/csv;charset=utf-8':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',bytes:format==='csv'?csvBytes(spec,rows):xlsxBytes(spec,rows),specification:spec});
}

export const createBoardExportService=()=>Object.freeze({specification:createBoardPortableSpecification,export:exportBoard});
