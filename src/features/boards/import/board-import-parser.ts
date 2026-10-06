import type {
  BoardImportColumnMapping,
  BoardImportDataset,
  BoardImportDiagnostic,
  BoardImportFileKind,
  BoardImportOptions,
  BoardImportPrimitive,
  BoardImportSchemaField,
  BoardImportSource,
  BoardImportWorksheet,
} from '../contracts/import.ts';

const DEFAULT_MAX_FILE_BYTES = 25 * 1024 * 1024;
const DEFAULT_MAX_ROWS = 100_000;
const MIME_BY_KIND: Readonly<Record<BoardImportFileKind, readonly string[]>> = Object.freeze({
  csv: Object.freeze(['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel', '']),
  xls: Object.freeze(['application/vnd.ms-excel', 'application/octet-stream', '']),
  xlsx: Object.freeze(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/octet-stream', '']),
});

class BoardImportError extends Error {
  readonly diagnostic: BoardImportDiagnostic;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'BoardImportError';
    this.diagnostic = Object.freeze({ code, severity: 'error' as const, message });
  }
}

interface ParsedBook { sheets: { name: string; hidden: boolean; rows: BoardImportPrimitive[][] }[]; }

const textDecoder = new TextDecoder('utf-8', { fatal: false });
const normalizeHeader = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ');
const canonical = (value: unknown) => normalizeHeader(value).toLocaleLowerCase();
const normalizePrimitive = (value: unknown): BoardImportPrimitive => {
  if (value == null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = String(value).replace(/\r\n?/g, '\n').trim();
  return text === '' ? null : text;
};
const rowBlank = (row: readonly BoardImportPrimitive[]) => row.every((value) => value == null || value === '');

function kindFromName(name: string): BoardImportFileKind {
  const match = /\.([^.]+)$/.exec(name.toLowerCase());
  if (!match || !['csv', 'xls', 'xlsx'].includes(match[1] ?? '')) throw new BoardImportError('IMPORT_UNSUPPORTED_EXTENSION', 'Choose a .csv, .xls, or .xlsx file.');
  return match[1]! as BoardImportFileKind;
}

function validateMime(kind: BoardImportFileKind, mime: string): void {
  const normalized = String(mime || '').toLowerCase().split(';')[0]!.trim();
  if (!MIME_BY_KIND[kind].includes(normalized)) throw new BoardImportError('IMPORT_MIME_MISMATCH', `The file MIME type “${normalized || 'unknown'}” does not match a supported ${kind.toUpperCase()} input.`);
}

function parseCsvText(text: string): ParsedBook {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  if (source.includes('\0')) throw new BoardImportError('IMPORT_CSV_BINARY_CONTENT', 'The CSV file contains binary/null bytes.');
  const rows: BoardImportPrimitive[][] = [];
  let row: BoardImportPrimitive[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i <= source.length; i += 1) {
    const ch = i < source.length ? source[i] : '\n';
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { field += '"'; i += 1; continue; }
      if (ch === '"') { quoted = false; continue; }
      field += ch; continue;
    }
    if (ch === '"' && field === '') { quoted = true; continue; }
    if (ch === ',') { row.push(normalizePrimitive(field)); field = ''; continue; }
    if (ch === '\n') { row.push(normalizePrimitive(field)); field = ''; rows.push(row); row = []; continue; }
    if (ch !== '\r') field += ch;
  }
  if (quoted) throw new BoardImportError('IMPORT_CSV_UNCLOSED_QUOTE', 'The CSV file contains an unclosed quoted field.');
  while (rows.length && rowBlank(rows[rows.length - 1]!)) rows.pop();
  if (!rows.length) throw new BoardImportError('IMPORT_EMPTY_FILE', 'The CSV file does not contain any data rows.');
  return { sheets: [{ name: 'CSV', hidden: false, rows }] };
}

const u16 = (v: DataView, o: number) => v.getUint16(o, true);
const u32 = (v: DataView, o: number) => v.getUint32(o, true);

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzipEntries(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer); const view = new DataView(buffer);
  let eocd = -1;
  for (let i = Math.max(0, bytes.length - 0x10016); i <= bytes.length - 22; i += 1) if (u32(view, i) === 0x06054b50) eocd = i;
  if (eocd < 0) throw new BoardImportError('IMPORT_XLSX_CORRUPT_ZIP', 'The XLSX file is not a valid ZIP workbook container.');
  const count = u16(view, eocd + 10); const offset = u32(view, eocd + 16); let cursor = offset;
  const result = new Map<string, Uint8Array>();
  for (let n = 0; n < count; n += 1) {
    if (u32(view, cursor) !== 0x02014b50) throw new BoardImportError('IMPORT_XLSX_CORRUPT_DIRECTORY', 'The XLSX central directory is corrupted.');
    const method = u16(view, cursor + 10); const compressed = u32(view, cursor + 20); const nameLen = u16(view, cursor + 28); const extraLen = u16(view, cursor + 30); const commentLen = u16(view, cursor + 32); const local = u32(view, cursor + 42);
    const name = textDecoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLen));
    if (u32(view, local) !== 0x04034b50) throw new BoardImportError('IMPORT_XLSX_CORRUPT_ENTRY', `Workbook entry “${name}” has an invalid local header.`);
    const localNameLen = u16(view, local + 26); const localExtraLen = u16(view, local + 28); const start = local + 30 + localNameLen + localExtraLen;
    const body = bytes.subarray(start, start + compressed);
    if (method === 0) result.set(name, body.slice());
    else if (method === 8) result.set(name, await inflateRaw(body));
    else throw new BoardImportError('IMPORT_XLSX_UNSUPPORTED_COMPRESSION', `Workbook entry “${name}” uses unsupported ZIP compression method ${method}.`);
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return result;
}

const xmlText = (entries: Map<string, Uint8Array>, name: string, required = true): string => {
  const bytes = entries.get(name);
  if (!bytes) { if (required) throw new BoardImportError('IMPORT_XLSX_MISSING_PART', `The XLSX workbook is missing required part “${name}”.`); return ''; }
  return textDecoder.decode(bytes);
};
const xmlDecode = (value: string) => value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

function parseSharedStrings(xml: string): string[] {
  if (!xml) return [];
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => [...match[1]!.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) => xmlDecode(part[1]!)).join(''));
}
function columnIndex(ref: string): number { let index = 0; for (const ch of ref.replace(/\d/g, '')) index = index * 26 + ch.toUpperCase().charCodeAt(0) - 64; return Math.max(0, index - 1); }
function parseXlsxSheet(xml: string, shared: readonly string[]): BoardImportPrimitive[][] {
  const rows: BoardImportPrimitive[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNo = Number(/\br="(\d+)"/.exec(rowMatch[1]!)?.[1] || rows.length + 1); const row: BoardImportPrimitive[] = [];
    for (const cell of rowMatch[2]!.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cell[1]!; const body = cell[2]!; const ref = /\br="([A-Z]+\d+)"/i.exec(attrs)?.[1] || ''; const index = ref ? columnIndex(ref) : row.length; const type = /\bt="([^"]+)"/.exec(attrs)?.[1] || '';
      const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '';
      let value: BoardImportPrimitive = null;
      if (type === 's') value = normalizePrimitive(shared[Number(raw)] ?? '');
      else if (type === 'inlineStr') value = normalizePrimitive([...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => xmlDecode(m[1]!)).join(''));
      else if (type === 'b') value = raw === '1';
      else if (type === 'str') value = normalizePrimitive(xmlDecode(raw));
      else if (raw !== '') { const num = Number(raw); value = Number.isFinite(num) ? num : normalizePrimitive(xmlDecode(raw)); }
      row[index] = value;
    }
    while (rows.length < rowNo - 1) rows.push([]);
    rows[rowNo - 1] = row;
  }
  while (rows.length && rowBlank(rows[rows.length - 1]!)) rows.pop();
  return rows;
}

async function parseXlsx(buffer: ArrayBuffer): Promise<ParsedBook> {
  const entries = await unzipEntries(buffer); const workbook = xmlText(entries, 'xl/workbook.xml'); const rels = xmlText(entries, 'xl/_rels/workbook.xml.rels'); const shared = parseSharedStrings(xmlText(entries, 'xl/sharedStrings.xml', false));
  const relMap = new Map([...rels.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)].map((m) => { const attrs=m[1]!; const id=/\bId="([^"]+)"/.exec(attrs)?.[1]; const target=/\bTarget="([^"]+)"/.exec(attrs)?.[1]; return id && target ? [id,target] as const : null; }).filter((entry): entry is readonly [string,string] => entry !== null));
  const sheets = [...workbook.matchAll(/<sheet\b([^>]*)\/?\s*>/g)].map((m, index) => {
    const attrs = m[1]!; const name = xmlDecode(/\bname="([^"]+)"/.exec(attrs)?.[1] || `Sheet${index + 1}`); const rel = /\br:id="([^"]+)"/.exec(attrs)?.[1] || ''; const target = relMap.get(rel); if (!target) throw new BoardImportError('IMPORT_XLSX_BROKEN_RELATIONSHIP', `Worksheet “${name}” has no workbook relationship.`);
    const normalizedTarget = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`.replace(/xl\/\.\.\//g, '');
    return { name, hidden: /\bstate="(?:hidden|veryHidden)"/.test(attrs), rows: parseXlsxSheet(xmlText(entries, normalizedTarget), shared) };
  });
  if (!sheets.length) throw new BoardImportError('IMPORT_XLSX_NO_WORKSHEETS', 'The XLSX workbook does not contain any worksheets.');
  return { sheets };
}

// BIFF8 / Compound File support for conventional .xls workbooks.
function readOleWorkbook(buffer: ArrayBuffer): Uint8Array {
  const bytes = new Uint8Array(buffer); const view = new DataView(buffer);
  const sig = [0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]; if (sig.some((b,i)=>bytes[i]!==b)) throw new BoardImportError('IMPORT_XLS_INVALID_SIGNATURE', 'The XLS file is not a valid Compound Binary workbook.');
  const sectorShift = u16(view, 30); const miniShift = u16(view, 32); const sectorSize = 1 << sectorShift; const miniSize = 1 << miniShift; const firstDir = u32(view, 48); const miniCutoff = u32(view, 56); const firstMiniFat = u32(view, 60); const miniFatCount = u32(view, 64); const difatCount = u32(view, 72);
  if (sectorSize !== 512 && sectorSize !== 4096) throw new BoardImportError('IMPORT_XLS_UNSUPPORTED_SECTOR', 'The XLS compound file uses an unsupported sector size.');
  const sector = (id:number) => bytes.subarray((id + 1) * sectorSize, (id + 2) * sectorSize);
  const difat:number[]=[]; for(let i=0;i<109;i++){const id=u32(view,76+i*4); if(id<0xfffffffa) difat.push(id);} let nextDifat=u32(view,68);
  for(let n=0;n<difatCount && nextDifat<0xfffffffa;n++){const s=sector(nextDifat); const dv=new DataView(s.buffer,s.byteOffset,s.byteLength); for(let i=0;i<sectorSize/4-1;i++){const id=u32(dv,i*4); if(id<0xfffffffa) difat.push(id);} nextDifat=u32(dv,sectorSize-4);}
  const fat:number[]=[]; for(const id of difat){const s=sector(id); const dv=new DataView(s.buffer,s.byteOffset,s.byteLength); for(let i=0;i<sectorSize/4;i++) fat.push(u32(dv,i*4));}
  const chain=(start:number,table:number[],_unit:number,reader:(id:number)=>Uint8Array,max=1_000_000)=>{const parts:Uint8Array[]=[]; let id=start,guard=0,total=0; const seen=new Set<number>(); while(id<0xfffffffa){if(seen.has(id)||guard++>max) throw new BoardImportError('IMPORT_XLS_CORRUPT_CHAIN','The XLS compound stream sector chain is corrupted.'); seen.add(id); const p=reader(id); parts.push(p); total+=p.length; id=table[id] ?? 0xffffffff;} const out=new Uint8Array(total); let o=0; for(const p of parts){out.set(p,o);o+=p.length;} return out;};
  const dirBytes=chain(firstDir,fat,sectorSize,sector); const entries:{name:string,start:number,size:number,type:number}[]=[]; for(let o=0;o+128<=dirBytes.length;o+=128){const dv=new DataView(dirBytes.buffer,dirBytes.byteOffset+o,128); const nameLen=u16(dv,64); if(nameLen<2) continue; let name=''; for(let p=0;p<nameLen-2;p+=2) name+=String.fromCharCode(u16(dv,p)); entries.push({name,start:u32(dv,116),size:u32(dv,120),type:dv.getUint8(66)});}
  const root=entries.find(e=>e.type===5); const wb=entries.find(e=>/^(Workbook|Book)$/i.test(e.name)); if(!root||!wb) throw new BoardImportError('IMPORT_XLS_MISSING_WORKBOOK','The XLS compound file does not contain a Workbook stream.');
  if(wb.size>=miniCutoff) return chain(wb.start,fat,sectorSize,sector).subarray(0,wb.size);
  const rootStream=chain(root.start,fat,sectorSize,sector); const miniFatBytes=firstMiniFat<0xfffffffa?chain(firstMiniFat,fat,sectorSize,sector).subarray(0,miniFatCount*sectorSize):new Uint8Array(); const miniFat:number[]=[]; const mfv=new DataView(miniFatBytes.buffer,miniFatBytes.byteOffset,miniFatBytes.byteLength); for(let i=0;i+4<=miniFatBytes.length;i+=4) miniFat.push(u32(mfv,i)); const miniReader=(id:number)=>rootStream.subarray(id*miniSize,(id+1)*miniSize); return chain(wb.start,miniFat,miniSize,miniReader).subarray(0,wb.size);
}

function parseBiffString(data: Uint8Array, offset: number): { value:string; next:number } { const dv=new DataView(data.buffer,data.byteOffset,data.byteLength); const chars=u16(dv,offset); const flags=data[offset+2] ?? 0; let p=offset+3; const wide=Boolean(flags&1); let value=''; for(let i=0;i<chars;i++){value+=String.fromCharCode(wide?u16(dv,p):data[p] ?? 0); p+=wide?2:1;} return {value,next:p}; }

function decodeRk(raw: number): number {
  const divideBy100 = (raw & 0x01) !== 0;
  const isInteger = (raw & 0x02) !== 0;
  let value: number;
  if (isInteger) {
    value = raw >> 2;
  } else {
    const ab = new ArrayBuffer(8);
    const dv = new DataView(ab);
    dv.setUint32(0, raw & 0xfffffffc, true);
    dv.setUint32(4, 0, true);
    value = dv.getFloat64(0, true);
  }
  return divideBy100 ? value / 100 : value;
}

function parseXls(buffer: ArrayBuffer): ParsedBook {
  const stream=readOleWorkbook(buffer); const dv=new DataView(stream.buffer,stream.byteOffset,stream.byteLength); let p=0; const sheetDefs:{name:string;offset:number}[]=[]; const sst:string[]=[];
  while(p+4<=stream.length){const id=u16(dv,p),len=u16(dv,p+2),start=p+4,end=start+len; if(end>stream.length) throw new BoardImportError('IMPORT_XLS_TRUNCATED_RECORD','The XLS workbook contains a truncated BIFF record.'); if(id===0x0085&&len>=8){const off=u32(dv,start); const nameLen=stream[start+6] ?? 0; const flags=stream[start+7] ?? 0; let name=''; let q=start+8; for(let i=0;i<nameLen;i++){name+=String.fromCharCode(flags&1?u16(dv,q):stream[q] ?? 0); q+=flags&1?2:1;} sheetDefs.push({name,offset:off});} if(id===0x00fc&&len>=8){let q=start+8; const count=u32(dv,start+4); for(let i=0;i<count && q<end;i++){try{const parsed=parseBiffString(stream,q);sst.push(parsed.value);q=parsed.next;}catch{break;}}} p=end; if(id===0x000a&&sheetDefs.length) break; }
  if(!sheetDefs.length) throw new BoardImportError('IMPORT_XLS_NO_WORKSHEETS','The XLS workbook does not contain any worksheets.');
  const sheets=sheetDefs.map((def)=>{const rows:BoardImportPrimitive[][]=[]; let q=def.offset; while(q+4<=stream.length){const id=u16(dv,q),len=u16(dv,q+2),start=q+4,end=start+len; if(end>stream.length) break; if(id===0x000a) break; let r=-1,c=-1,value:BoardImportPrimitive=null; if(id===0x00fd&&len>=10){r=u16(dv,start);c=u16(dv,start+2);value=normalizePrimitive(sst[u32(dv,start+6)]??'');} else if(id===0x0203&&len>=14){r=u16(dv,start);c=u16(dv,start+2);value=dv.getFloat64(start+6,true);} else if(id===0x027e&&len>=10){r=u16(dv,start);c=u16(dv,start+2);value=decodeRk(u32(dv,start+6));} else if(id===0x00bd&&len>=12){const rowIndex=u16(dv,start);const firstColumn=u16(dv,start+2);const lastColumn=u16(dv,end-2);let cellOffset=start+4;for(let column=firstColumn;column<=lastColumn && cellOffset+6<=end-2;column++,cellOffset+=6){while(rows.length<=rowIndex)rows.push([]);const row=rows[rowIndex]!;row[column]=decodeRk(u32(dv,cellOffset+2));} q=end;continue;} else if(id===0x0204&&len>=8){r=u16(dv,start);c=u16(dv,start+2); const n=u16(dv,start+6); let s=''; for(let i=0;i<n && start+8+i<end;i++)s+=String.fromCharCode(stream[start+8+i]??0); value=normalizePrimitive(s);} else if(id===0x0205&&len>=8){r=u16(dv,start);c=u16(dv,start+2);value=(stream[start+6] ?? 0)===1;} if(r>=0&&c>=0){while(rows.length<=r)rows.push([]);const row=rows[r]!;row[c]=value;} q=end;} while(rows.length&&rowBlank(rows[rows.length-1]!))rows.pop(); return {name:def.name||'Sheet',hidden:false,rows};});
  return {sheets};
}

function fieldAliasMap(fields: readonly BoardImportSchemaField[]): Map<string, string> { const map=new Map<string,string>(); for(const field of fields){for(const alias of [field.key,field.label,...(field.aliases||[])]){const key=canonical(alias); if(key && !map.has(key)) map.set(key,field.key);}} return map; }
function detectHeaderRow(rows: readonly BoardImportPrimitive[][], fields: readonly BoardImportSchemaField[]): number { const aliases=fieldAliasMap(fields); let best=-1,bestScore=-1; for(let i=0;i<Math.min(rows.length,25);i++){const row=rows[i]!; const values=row.map(canonical).filter(Boolean); if(!values.length)continue; const recognized=values.filter(v=>aliases.has(v)).length; const unique=new Set(values).size; const score=recognized*10+unique-Math.abs(values.length-unique)*5; if(score>bestScore){best=i;bestScore=score;}} if(best<0) throw new BoardImportError('IMPORT_HEADER_NOT_FOUND','No usable header row could be detected.'); return best; }
function buildMapping(headers: readonly string[], options: BoardImportOptions): {mapping:BoardImportColumnMapping[];missing:string[];unexpected:string[]} { const alias=fieldAliasMap(options.schema.fields); const override=options.columnMapping||{}; const targets=new Set<string>(); const mapping=headers.map((source)=>{const explicit=Object.prototype.hasOwnProperty.call(override,source)?override[source]:undefined; const target=explicit===undefined?(alias.get(canonical(source))??null):explicit; if(target && !options.schema.fields.some(f=>f.key===target)) throw new BoardImportError('IMPORT_MAPPING_UNKNOWN_TARGET',`Column “${source}” maps to unknown target “${target}”.`); if(target){if(targets.has(target)) throw new BoardImportError('IMPORT_MAPPING_DUPLICATE_TARGET',`More than one source column maps to “${target}”.`);targets.add(target);} return Object.freeze({source,target:target??null});}); const missing=options.schema.fields.filter(f=>f.required&&!targets.has(f.key)).map(f=>f.label); const unexpected=mapping.filter(m=>!m.target).map(m=>m.source); return {mapping,missing,unexpected}; }

export async function parseBoardImport(source: BoardImportSource, options: BoardImportOptions): Promise<BoardImportDataset> {
  const diagnostics:BoardImportDiagnostic[]=[]; try { const kind=kindFromName(source.name); validateMime(kind,String(source.type||'')); const size=Number(source.size||0); const max=options.maxFileBytes??DEFAULT_MAX_FILE_BYTES; if(size>max) throw new BoardImportError('IMPORT_FILE_TOO_LARGE',`The import file exceeds the ${max.toLocaleString()} byte limit.`); const buffer=await source.arrayBuffer(); if(buffer.byteLength===0) throw new BoardImportError('IMPORT_EMPTY_FILE','The import file is empty.'); if(buffer.byteLength>max) throw new BoardImportError('IMPORT_FILE_TOO_LARGE',`The import file exceeds the ${max.toLocaleString()} byte limit.`);
    const book=kind==='csv'?parseCsvText(textDecoder.decode(buffer)):kind==='xlsx'?await parseXlsx(buffer):parseXls(buffer); const worksheets:BoardImportWorksheet[]=book.sheets.map((s,index)=>Object.freeze({name:s.name,index,hidden:s.hidden,rowCount:s.rows.length,columnCount:s.rows.reduce((m,r)=>Math.max(m,r.length),0)})); let selectedIndex=0; if(typeof options.worksheet==='number') selectedIndex=options.worksheet; else if(typeof options.worksheet==='string') selectedIndex=book.sheets.findIndex(s=>s.name===options.worksheet); else selectedIndex=Math.max(0,book.sheets.findIndex(s=>!s.hidden&&s.rows.some(r=>!rowBlank(r)))); if(selectedIndex<0||selectedIndex>=book.sheets.length) throw new BoardImportError('IMPORT_WORKSHEET_NOT_FOUND','The requested worksheet could not be found.'); const selected=book.sheets[selectedIndex]!; if(selected.hidden) diagnostics.push(Object.freeze({code:'IMPORT_HIDDEN_WORKSHEET',severity:'warning',message:`Worksheet “${selected.name}” is hidden.`,sheet:selected.name})); if(!selected.rows.length) throw new BoardImportError('IMPORT_WORKSHEET_EMPTY',`Worksheet “${selected.name}” does not contain data.`);
    const headerIndex=options.headerRow?options.headerRow-1:detectHeaderRow(selected.rows,options.schema.fields); if(headerIndex<0||headerIndex>=selected.rows.length) throw new BoardImportError('IMPORT_HEADER_ROW_OUT_OF_RANGE','The configured header row is outside the worksheet range.'); const rawHeaders=selected.rows[headerIndex]!.map(normalizeHeader); const headers=rawHeaders.map((h,i)=>h||`__column_${i+1}`); const duplicateHeaders=headers.filter((h,i)=>headers.findIndex(x=>canonical(x)===canonical(h))!==i); if(duplicateHeaders.length) throw new BoardImportError('IMPORT_DUPLICATE_HEADERS',`Duplicate header names are not supported: ${[...new Set(duplicateHeaders)].join(', ')}.`); const {mapping,missing,unexpected}=buildMapping(headers,options); if(missing.length) diagnostics.push(Object.freeze({code:'IMPORT_MISSING_REQUIRED_COLUMNS',severity:'error',message:`Missing required columns: ${missing.join(', ')}.`})); if(unexpected.length) diagnostics.push(Object.freeze({code:'IMPORT_UNEXPECTED_COLUMNS',severity:options.allowUnexpectedColumns?'warning':'error',message:`Unsupported columns: ${unexpected.join(', ')}.`})); const rows=[]; const maxRows=options.maxRows??DEFAULT_MAX_ROWS; for(let i=headerIndex+1;i<selected.rows.length;i++){const raw=selected.rows[i]!.map(normalizePrimitive); if(rowBlank(raw))continue; if(rows.length>=maxRows) throw new BoardImportError('IMPORT_ROW_LIMIT_EXCEEDED',`The import contains more than ${maxRows.toLocaleString()} data rows.`); const values:Record<string,BoardImportPrimitive>={}; mapping.forEach((m,c)=>{if(m.target)values[m.target]=normalizePrimitive(raw[c]);}); rows.push(Object.freeze({sourceRow:i+1,values:Object.freeze(values),raw:Object.freeze(raw)}));} if(!rows.length) diagnostics.push(Object.freeze({code:'IMPORT_NO_DATA_ROWS',severity:'warning',message:'No non-blank data rows were found below the header.',sheet:selected.name})); return Object.freeze({format:kind,fileName:source.name,fileSize:buffer.byteLength,mimeType:String(source.type||''),selectedWorksheet:selected.name,worksheets:Object.freeze(worksheets),headerRow:headerIndex+1,headers:Object.freeze(headers),mapping:Object.freeze(mapping),missingRequiredColumns:Object.freeze(missing),unexpectedColumns:Object.freeze(unexpected),rows:Object.freeze(rows),diagnostics:Object.freeze(diagnostics),mutationAllowed:false as const});
  } catch(error){ if(error instanceof BoardImportError) throw error; throw new BoardImportError('IMPORT_PARSE_FAILED',error instanceof Error?error.message:'The import file could not be parsed.'); }
}

export { BoardImportError };
