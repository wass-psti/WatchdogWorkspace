import { unzipSync, strFromU8 } from 'fflate';

const XLS_OLE = [0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1];
const td = new TextDecoder('utf-8');
const td16 = new TextDecoder('utf-16le');
const xmlDecode = (s) => String(s ?? '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
const bytesEqual = (a,b) => b.every((v,i)=>a[i]===v);
const u16 = (dv,o)=>dv.getUint16(o,true); const u32=(dv,o)=>dv.getUint32(o,true);
const f64 = (dv,o)=>dv.getFloat64(o,true);

function parseAttrs(tag) {
  const out = {};
  tag.replace(/([\w:.-]+)\s*=\s*(["'])(.*?)\2/g, (_,k,_q,v)=>{ out[k]=xmlDecode(v); return ''; });
  return out;
}
function textOf(xml, tag='t') {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? xmlDecode(m[1].replace(/<[^>]+>/g,'')) : '';
}
function excelColIndex(ref) {
  const letters = String(ref || '').match(/[A-Z]+/i)?.[0]?.toUpperCase() || 'A';
  let n=0; for (const c of letters) n=n*26+(c.charCodeAt(0)-64); return n-1;
}
function parseSharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/gi)].map((m)=>[...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/gi)].map(x=>xmlDecode(x[1])).join(''));
}
function parseStyles(xml) {
  if (!xml) return [];
  const custom = new Map([...xml.matchAll(/<numFmt\s+[^>]*numFmtId=["'](\d+)["'][^>]*formatCode=["']([^"']*)["'][^>]*\/?\s*>/gi)].map(m=>[Number(m[1]),xmlDecode(m[2])]));
  const dateBuiltin = new Set([14,15,16,17,18,19,20,21,22,27,30,36,45,46,47,50,57]);
  const cellXfs = xml.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/i)?.[1] || '';
  return [...cellXfs.matchAll(/<xf\b([^>]*)\/?\s*>/gi)].map((m)=>{
    const attrs=parseAttrs(m[1]); const id=Number(attrs.numFmtId||0); const fmt=custom.get(id)||'';
    return dateBuiltin.has(id) || /(^|[^\\])[ymdhis]/i.test(fmt.replace(/\[[^\]]+\]/g,''));
  });
}
function xlsxSerialToIso(value) {
  const n=Number(value); if (!Number.isFinite(n)) return value;
  const whole=Math.floor(n); const adjusted=whole>59?whole-1:whole;
  const d=new Date(Date.UTC(1899,11,31)+adjusted*86400000);
  return d.toISOString().slice(0,10);
}
function parseXlsxSheet(xml, shared, dateStyles) {
  const rows=[];
  for (const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gi)) {
    const out=[];
    for (const cm of rm[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/gi)) {
      const attrs=parseAttrs(cm[1]); const idx=excelColIndex(attrs.r); const body=cm[2]; const type=attrs.t||''; const style=Number(attrs.s||0);
      let val='';
      if (type==='inlineStr') val=textOf(body,'t');
      else { const raw=textOf(body,'v'); if (type==='s') val=shared[Number(raw)] ?? ''; else if (type==='b') val=raw==='1'?'TRUE':'FALSE'; else if (type==='str') val=raw; else if (raw!=='' && dateStyles[style]) val=xlsxSerialToIso(raw); else val=raw; }
      out[idx]=val;
    }
    rows.push(out.map(v=>v??''));
  }
  return rows;
}

function parseWorkbookRels(xml) {
  const map=new Map();
  for (const m of xml.matchAll(/<Relationship\b([^>]*)\/?\s*>/gi)) { const a=parseAttrs(m[1]); if (a.Id && a.Target) map.set(a.Id,a.Target); }
  return map;
}

export function parseXlsx(bytes) {
  const files=unzipSync(bytes);
  const get=(name)=>files[name] ? strFromU8(files[name]) : '';
  const workbook=get('xl/workbook.xml'); if (!workbook) throw new Error('Invalid XLSX: workbook.xml is missing.');
  const rels=parseWorkbookRels(get('xl/_rels/workbook.xml.rels'));
  const shared=parseSharedStrings(get('xl/sharedStrings.xml')); const dateStyles=parseStyles(get('xl/styles.xml'));
  const sheets=[];
  for (const m of workbook.matchAll(/<sheet\b([^>]*)\/?\s*>/gi)) {
    const a=parseAttrs(m[1]); const target=rels.get(a['r:id']); if (!target) continue;
    const clean=target.replace(/^\/?xl\//,'').replace(/^\.\//,''); const path=`xl/${clean}`.replace(/\/[^/]+\/\.\.\//g,'/');
    const xml=get(path); if (!xml) continue;
    sheets.push({ name:a.name||`Sheet${sheets.length+1}`, rows:parseXlsxSheet(xml,shared,dateStyles) });
  }
  if (!sheets.length) throw new Error('Invalid XLSX: no readable worksheets were found.');
  return sheets;
}

function parseSpreadsheetMl(text) {
  if (!/<Workbook\b/i.test(text) || !/(urn:schemas-microsoft-com:office:spreadsheet|ss:Worksheet)/i.test(text)) return null;
  const sheets=[];
  for (const sm of text.matchAll(/<(?:ss:)?Worksheet\b([^>]*)>([\s\S]*?)<\/(?:ss:)?Worksheet>/gi)) {
    const attrs=parseAttrs(sm[1]); const rows=[];
    for (const rm of sm[2].matchAll(/<(?:ss:)?Row\b[^>]*>([\s\S]*?)<\/(?:ss:)?Row>/gi)) {
      const row=[]; let col=0;
      for (const cm of rm[1].matchAll(/<(?:ss:)?Cell\b([^>]*)>([\s\S]*?)<\/(?:ss:)?Cell>/gi)) {
        const ca=parseAttrs(cm[1]); const indexed=Number(ca['ss:Index']||ca.Index||0); if (indexed>0) col=indexed-1;
        const dm=cm[2].match(/<(?:ss:)?Data\b([^>]*)>([\s\S]*?)<\/(?:ss:)?Data>/i); const da=dm?parseAttrs(dm[1]):{}; let value=dm?xmlDecode(dm[2].replace(/<[^>]+>/g,'')):'';
        if ((da['ss:Type']||da.Type)==='DateTime' && value) value=value.slice(0,10);
        row[col++]=value;
      }
      rows.push(row.map(v=>v??''));
    }
    sheets.push({name:attrs['ss:Name']||attrs.Name||`Sheet${sheets.length+1}`,rows});
  }
  return sheets.length?sheets:null;
}

function parseHtmlTable(text) {
  if (!/<table\b/i.test(text)) return null;
  const rows=[]; for (const rm of text.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) { const row=[...rm[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map(m=>xmlDecode(m[1].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim())); if (row.length) rows.push(row); }
  return rows.length?[{name:'Sheet1',rows}]:null;
}

function readSectorChain(bytes, fat, start, sectorSize, maxBytes=Infinity) {
  const out=[]; let sector=start, guard=0, total=0;
  while (sector>=0 && sector<0xFFFFFFF8 && guard++<100000) {
    const off=512+sector*sectorSize; if (off<0 || off+sectorSize>bytes.length) throw new Error('Malformed XLS: sector chain points outside file.');
    const chunk=bytes.slice(off,off+sectorSize); out.push(chunk); total+=chunk.length; if (total>=maxBytes) break; sector=fat[sector]; if (sector==null) break;
  }
  const merged=new Uint8Array(Math.min(total,maxBytes)); let p=0; for (const c of out) { const take=Math.min(c.length,merged.length-p); merged.set(c.slice(0,take),p); p+=take; if (p>=merged.length) break; } return merged;
}
function parseOleWorkbook(bytes) {
  if (!bytesEqual(bytes,XLS_OLE)) throw new Error('Unsupported XLS encoding. Expected Excel 97-2003 BIFF/OLE, SpreadsheetML, or HTML workbook.');
  const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength); const sectorSize=1<<u16(dv,0x1e); const miniSectorSize=1<<u16(dv,0x20); const firstDir=u32(dv,0x30); const cutoff=u32(dv,0x38); const firstMiniFat=u32(dv,0x3c); const miniFatCount=u32(dv,0x40); const firstDifat=u32(dv,0x44); const difatCount=u32(dv,0x48);
  if (![512,4096].includes(sectorSize)) throw new Error('Unsupported XLS compound-file sector size.');
  const difat=[]; for(let i=0;i<109;i++){const s=u32(dv,0x4c+i*4); if(s<0xFFFFFFF8)difat.push(s);} let ds=firstDifat, dg=0;
  while(ds<0xFFFFFFF8 && dg++<difatCount){const off=512+ds*sectorSize; const sdv=new DataView(bytes.buffer,bytes.byteOffset+off,sectorSize); for(let i=0;i<sectorSize/4-1;i++){const s=u32(sdv,i*4);if(s<0xFFFFFFF8)difat.push(s);}ds=u32(sdv,sectorSize-4);}
  const fat=[]; for(const s of difat){const off=512+s*sectorSize;if(off+sectorSize>bytes.length)continue;const fdv=new DataView(bytes.buffer,bytes.byteOffset+off,sectorSize);for(let i=0;i<sectorSize/4;i++)fat.push(u32(fdv,i*4));}
  const dir=readSectorChain(bytes,fat,firstDir,sectorSize); const entries=[];
  for(let off=0;off+128<=dir.length;off+=128){const edv=new DataView(dir.buffer,dir.byteOffset+off,128);const nl=u16(edv,64);if(nl<2)continue;const name=td16.decode(dir.slice(off,off+Math.max(0,nl-2))); const type=dir[off+66]; const start=u32(edv,0x74); const sizeLo=u32(edv,0x78); const sizeHi=u32(edv,0x7c); const size=sizeLo+sizeHi*4294967296;entries.push({name,type,start,size});}
  const root=entries.find(e=>e.type===5); const book=entries.find(e=>e.type===2 && /^(Workbook|Book)$/i.test(e.name)); if(!book)throw new Error('Invalid XLS: Workbook stream is missing.');
  let workbook;
  if(book.size<cutoff){if(!root)throw new Error('Malformed XLS: root mini stream missing.'); const miniStream=readSectorChain(bytes,fat,root.start,sectorSize,root.size); const miniFatRaw=readSectorChain(bytes,fat,firstMiniFat,sectorSize,miniFatCount*sectorSize); const mdv=new DataView(miniFatRaw.buffer,miniFatRaw.byteOffset,miniFatRaw.byteLength); const miniFat=[];for(let i=0;i+4<=miniFatRaw.length;i+=4)miniFat.push(u32(mdv,i)); const chunks=[];let s=book.start,g=0,total=0;while(s<0xFFFFFFF8&&g++<100000&&total<book.size){const off=s*miniSectorSize;const c=miniStream.slice(off,off+miniSectorSize);chunks.push(c);total+=c.length;s=miniFat[s];}workbook=new Uint8Array(book.size);let p=0;for(const c of chunks){const take=Math.min(c.length,workbook.length-p);workbook.set(c.slice(0,take),p);p+=take;if(p>=workbook.length)break;}}
  else workbook=readSectorChain(bytes,fat,book.start,sectorSize,book.size);
  return parseBiffWorkbook(workbook);
}
function readBiffString(data, offset, charCount, flags) { const is16=flags&1; const byteLen=charCount*(is16?2:1); const slice=data.slice(offset,offset+byteLen); return {value:is16?td16.decode(slice):new TextDecoder('windows-1252').decode(slice),bytes:byteLen}; }
function parseSst(data){const dv=new DataView(data.buffer,data.byteOffset,data.byteLength);let off=8;const unique=u32(dv,4);const out=[];for(let i=0;i<unique&&off+3<=data.length;i++){const c=u16(dv,off);const flags=data[off+2];off+=3;let rich=0,phon=0;if(flags&8){rich=u16(dv,off);off+=2;}if(flags&4){phon=u32(dv,off);off+=4;}const r=readBiffString(data,off,c,flags);out.push(r.value);off+=r.bytes+rich*4+phon;}return out;}
function decodeRk(v){const div100=v&1;const isInt=v&2;let n;if(isInt)n=(v>>2);else{const buf=new ArrayBuffer(8);const dv=new DataView(buf);dv.setUint32(0,0,true);dv.setUint32(4,v&0xfffffffc,true);n=dv.getFloat64(0,true);}return div100?n/100:n;}
function parseBiffWorkbook(data){const dv=new DataView(data.buffer,data.byteOffset,data.byteLength);let off=0;const bounds=[];let sst=[];while(off+4<=data.length){const id=u16(dv,off),len=u16(dv,off+2),body=data.slice(off+4,off+4+len);if(id===0x0085&&len>=8){const bdv=new DataView(body.buffer,body.byteOffset,body.byteLength);const pos=u32(bdv,0);const c=body[6],flags=body[7];bounds.push({pos,name:readBiffString(body,8,c,flags).value});}else if(id===0x00fc){let combined=body;let no=off+4+len;while(no+4<=data.length&&u16(dv,no)===0x003c){const l=u16(dv,no+2);const next=data.slice(no+4,no+4+l);const merge=new Uint8Array(combined.length+next.length);merge.set(combined);merge.set(next,combined.length);combined=merge;no+=4+l;}try{sst=parseSst(combined);}catch{} }off+=4+len;if(off<=0)break;}
  if(!bounds.length)bounds.push({pos:0,name:'Sheet1'});const sheets=[];
  for(const b of bounds){const rows=[];let p=b.pos;let guard=0;while(p+4<=data.length&&guard++<100000){const id=u16(dv,p),len=u16(dv,p+2),bo=p+4;if(id===0x000a)break;if(bo+len>data.length)break;let r,c,val,rdv;try{if(id===0x00fd&&len>=10){rdv=new DataView(data.buffer,data.byteOffset+bo,len);r=u16(rdv,0);c=u16(rdv,2);val=sst[u32(rdv,6)]??'';}else if(id===0x0203&&len>=14){rdv=new DataView(data.buffer,data.byteOffset+bo,len);r=u16(rdv,0);c=u16(rdv,2);val=f64(rdv,6);}else if(id===0x027e&&len>=10){rdv=new DataView(data.buffer,data.byteOffset+bo,len);r=u16(rdv,0);c=u16(rdv,2);val=decodeRk(u32(rdv,6));}else if(id===0x0204&&len>=8){rdv=new DataView(data.buffer,data.byteOffset+bo,len);r=u16(rdv,0);c=u16(rdv,2);const cc=u16(rdv,6);val=new TextDecoder('windows-1252').decode(data.slice(bo+8,bo+8+cc));}else if(id===0x0205&&len>=8){rdv=new DataView(data.buffer,data.byteOffset+bo,len);r=u16(rdv,0);c=u16(rdv,2);val=data[bo+6]?'TRUE':'FALSE';}else if(id===0x0006&&len>=14){rdv=new DataView(data.buffer,data.byteOffset+bo,len);r=u16(rdv,0);c=u16(rdv,2);val=f64(rdv,6);}if(r!=null){rows[r] ||= [];rows[r][c]=val;}}catch{}p+=4+len;}
    sheets.push({name:b.name||`Sheet${sheets.length+1}`,rows:rows.filter(Boolean).map(row=>row.map(v=>v??''))});}
  if(!sheets.some(s=>s.rows.length))throw new Error('XLS workbook contained no readable worksheet rows.');return sheets;}

export function parseXls(bytes) { const head=td.decode(bytes.slice(0,Math.min(bytes.length,4096))).trimStart(); const xml=parseSpreadsheetMl(head.startsWith('<?xml')||head.includes('<Workbook')?td.decode(bytes):''); if(xml)return xml;const html=parseHtmlTable(head.includes('<table')?td.decode(bytes):'');if(html)return html;return parseOleWorkbook(bytes); }

export function parseExcelFile(bytes, extension) { const ext=String(extension||'').toLowerCase(); if(ext==='.xlsx')return parseXlsx(bytes); if(ext==='.xls')return parseXls(bytes); throw new Error(`Unsupported Excel extension: ${extension}`); }
