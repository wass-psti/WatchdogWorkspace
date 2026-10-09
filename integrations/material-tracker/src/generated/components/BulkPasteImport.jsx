import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@material/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@material/components/ui/table';
import { Badge } from '@material/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@material/components/ui/select';
import { Input } from '@material/components/ui/input';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, RefreshCw, ShieldCheck, Trash2, Upload, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { parseImportFile } from '@material/import-export/file-parser';
import { MATERIAL_IMPORT_FIELDS } from '@material/import-export/material-import-spec';
import { applyServerPreflight, detectHeaderRow, rowsForCommit, suggestColumnMapping, summarizeRows, validateAndNormalizeRows, validateMapping, IMPORT_LIMITS } from '@material/import-export/import-engine';
import { apiFetch } from '@material/api/http';
import { buildImportTemplateCsv, buildImportTemplateWorkbook, downloadText } from '@material/import-export/export-engine';
import { stringifyCsv } from '@material/import-export/csv';
import { useXlsxExport } from '@material/skills/xlsx-export.jsx';

const STATUS_META = {
  valid: { label: 'Valid', variant: 'secondary' },
  invalid: { label: 'Invalid', variant: 'destructive' },
  duplicate: { label: 'Duplicate', variant: 'outline' },
  conflicting: { label: 'Conflict', variant: 'destructive' },
  skipped: { label: 'Skipped', variant: 'outline' },
};

function Summary({ summary }) {
  const cells = [
    ['Valid', summary.valid], ['Invalid', summary.invalid], ['Duplicate', summary.duplicate], ['Conflicting', summary.conflicting], ['Skipped', summary.skipped], ['Selected', summary.selected],
  ];
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">{cells.map(([label, value]) => <div key={label} className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="text-lg font-bold">{value || 0}</div></div>)}</div>;
}

export function BulkPasteImport({ onCreated }) {
  const inputRef = useRef(null);
  const { exportToXlsx, isExporting: templateExporting } = useXlsxExport();
  const [file, setFile] = useState(null), [sheets, setSheets] = useState([]), [sheetIndex, setSheetIndex] = useState(0);
  const [headerIndex, setHeaderIndex] = useState(-1), [mapping, setMapping] = useState({}), [rows, setRows] = useState([]);
  const [excluded, setExcluded] = useState(new Set()), [mode, setMode] = useState('create'), [fingerprint, setFingerprint] = useState('');
  const [loading, setLoading] = useState(false), [committing, setCommitting] = useState(false), [fatalError, setFatalError] = useState('');
  const currentSheet = sheets[sheetIndex] || null;
  const headers = currentSheet && headerIndex >= 0 ? (currentSheet.rows[headerIndex] || []) : [];
  const summary = useMemo(() => summarizeRows(rows), [rows]);
  const mappingErrors = useMemo(() => validateMapping(mapping), [mapping]);

  const validateLocal = (nextMapping = mapping, nextExcluded = excluded, nextSheet = currentSheet, nextHeader = headerIndex) => {
    if (!nextSheet || nextHeader < 0) return;
    const result = validateAndNormalizeRows(nextSheet.rows, nextHeader, nextMapping, { excluded: nextExcluded });
    setRows(result.rows); setFingerprint(''); setFatalError('');
  };

  const loadFile = async (picked) => {
    if (!picked) return;
    setLoading(true); setFatalError(''); setRows([]); setFingerprint(''); setExcluded(new Set());
    try {
      const parsed = await parseImportFile(picked);
      const first = parsed.sheets[0];
      const detected = detectHeaderRow(first.rows);
      const map = suggestColumnMapping(first.rows[detected.index] || []);
      setFile(picked); setSheets(parsed.sheets); setSheetIndex(0); setHeaderIndex(detected.index); setMapping(map);
      const result = validateAndNormalizeRows(first.rows, detected.index, map);
      setRows(result.rows);
      toast.success(`Parsed ${picked.name}: ${parsed.sheets.length} worksheet${parsed.sheets.length === 1 ? '' : 's'}`);
    } catch (error) { setFatalError(error?.message || String(error)); toast.error(error?.message || 'Import file could not be parsed.'); }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  const switchSheet = (value) => {
    const idx = Number(value); const sheet = sheets[idx]; if (!sheet) return;
    try { const detected = detectHeaderRow(sheet.rows); const map = suggestColumnMapping(sheet.rows[detected.index] || []); setSheetIndex(idx); setHeaderIndex(detected.index); setMapping(map); setExcluded(new Set()); setFingerprint(''); const result = validateAndNormalizeRows(sheet.rows, detected.index, map); setRows(result.rows); setFatalError(''); }
    catch (error) { setSheetIndex(idx); setHeaderIndex(-1); setMapping({}); setRows([]); setFingerprint(''); setFatalError(error?.message || String(error)); }
  };

  const updateMapping = (key, value) => { const next = { ...mapping }; if (value === '__none__') delete next[key]; else next[key] = Number(value); setMapping(next); validateLocal(next); };
  const removeRow = (rowNumber) => { const next = new Set(excluded); next.add(rowNumber); setExcluded(next); validateLocal(mapping, next); };
  const toggleRow = (rowNumber) => { setFingerprint(''); setRows(prev => prev.map(r => r.rowNumber === rowNumber && r.status === 'valid' ? { ...r, selected: !r.selected } : r)); };

  const runPreflight = async () => {
    if (mappingErrors.length) { toast.error('Correct the column mapping before preflight.'); return; }
    const selected = rowsForCommit(rows);
    if (!selected.length) { toast.error('Select at least one valid row.'); return; }
    setLoading(true); setFingerprint('');
    try {
      const result = await apiFetch('/api/import/preflight', { method: 'POST', body: JSON.stringify({ rows: selected, mode }) });
      const next = applyServerPreflight(rows, result); setRows(next); const s = summarizeRows(next);
      const selectedFailed = next.some(r => selected.some(x => x.rowNumber === r.rowNumber) && r.status !== 'valid');
      setFingerprint(selectedFailed ? '' : (result.fingerprint || ''));
      if (selectedFailed) toast.warning('Preflight found records that cannot be committed. Remove/correct them and run preflight again.');
      else toast.success('Preflight passed. Database remains unchanged until you confirm import.');
    } catch (error) { setFatalError(error?.message || String(error)); toast.error(error?.message || 'Preflight failed.'); }
    finally { setLoading(false); }
  };

  const commit = async () => {
    if (!fingerprint) { toast.error('Run preflight immediately before committing.'); return; }
    const selected = rowsForCommit(rows);
    if (!selected.length) { toast.error('No valid rows are selected.'); return; }
    setCommitting(true);
    try {
      const result = await apiFetch('/api/import/commit', { method: 'POST', body: JSON.stringify({ rows: selected, mode, fingerprint }) });
      onCreated?.(result.items || []); toast.success(`Atomic import complete: ${result.created || 0} created, ${result.updated || 0} updated.`);
      setFile(null); setSheets([]); setRows([]); setMapping({}); setHeaderIndex(-1); setFingerprint(''); setExcluded(new Set());
    } catch (error) { setFingerprint(''); toast.error(`${error?.message || 'Import failed.'} No partial commit was retained.`); }
    finally { setCommitting(false); }
  };

  const canCommit = fingerprint && rows.some(r => r.selected && r.status === 'valid') && !summary.invalid && !summary.duplicate && !summary.conflicting;
  const downloadErrorReport = () => {
    const report = [['Row','Status','Part Number','Issues'], ...rows.filter(r => r.status !== 'valid').map(r => [r.rowNumber,r.status,r.values?.name || '',(r.errors || []).map(e => e.message).join(' | ')])];
    downloadText(stringifyCsv(report), 'material-tracker-import-errors.csv');
  };

  return <div className="space-y-4">
    <div className="rounded-2xl border border-border/40 bg-card shadow-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold">CSV / Excel Import</h2><p className="text-xs text-muted-foreground mt-1">Validate, map and preview .csv, .xls or .xlsx before any database mutation.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadText(buildImportTemplateCsv(), 'material-tracker-import-template.csv')} className="gap-1.5"><Download className="size-3.5"/>CSV Template</Button>
          <Button variant="outline" size="sm" disabled={templateExporting} onClick={() => exportToXlsx(buildImportTemplateWorkbook(), 'material-tracker-import-template.xlsx')} className="gap-1.5"><FileSpreadsheet className="size-3.5"/>Excel Template</Button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="rounded-xl border-2 border-dashed border-border/60 p-6 text-center">
          <Upload className="size-8 text-muted-foreground/40 mx-auto mb-2"/><p className="text-sm font-semibold">Choose a CSV or Excel workbook</p>
          <p className="text-xs text-muted-foreground mt-1">Maximum 10 MB · {IMPORT_LIMITS.maxFileRows.toLocaleString()} data rows · {IMPORT_LIMITS.maxCommitRows.toLocaleString()} rows per atomic commit</p>
          <Input ref={inputRef} type="file" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="mt-4 max-w-xl mx-auto" onChange={e => loadFile(e.target.files?.[0])}/>
          {file && <p className="text-xs mt-2 text-muted-foreground">Loaded: <strong>{file.name}</strong> ({Math.ceil(file.size/1024).toLocaleString()} KB)</p>}
        </div>
        {fatalError && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex gap-2"><AlertTriangle className="size-4 mt-0.5 shrink-0"/>{fatalError}</div>}
        {sheets.length > 0 && <div className="grid sm:grid-cols-3 gap-3">
          <div><label className="text-xs font-semibold">Worksheet</label><Select value={String(sheetIndex)} onValueChange={switchSheet}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{sheets.map((s,i)=><SelectItem key={`${s.name}-${i}`} value={String(i)}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label className="text-xs font-semibold">Header row</label><Input type="number" min="1" max={currentSheet?.rows?.length || 1} className="mt-1" value={headerIndex >= 0 ? headerIndex + 1 : ''} onChange={e => { const idx=Math.max(0,Number(e.target.value)-1); setHeaderIndex(idx); const map=suggestColumnMapping(currentSheet?.rows?.[idx]||[]); setMapping(map); validateLocal(map, new Set(), currentSheet, idx); }}/></div>
          <div><label className="text-xs font-semibold">Commit mode</label><Select value={mode} onValueChange={v=>{setMode(v);setFingerprint('');}}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="create">Create only</SelectItem><SelectItem value="upsert">Update by Material ID / create new</SelectItem></SelectContent></Select></div>
        </div>}
      </div>
    </div>

    {headers.length > 0 && <div className="rounded-2xl border border-border/40 bg-card shadow-sm p-5 space-y-3">
      <div><h3 className="font-bold">Column Mapping</h3><p className="text-xs text-muted-foreground">Required fields must each map to one source column. Change mappings and validation updates immediately.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{MATERIAL_IMPORT_FIELDS.map(field => <div key={field.key}><label className="text-xs font-medium">{field.column}{field.required && <span className="text-destructive"> *</span>}</label><Select value={mapping[field.key] == null ? '__none__' : String(mapping[field.key])} onValueChange={v=>updateMapping(field.key,v)}><SelectTrigger className="mt-1 h-9"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="__none__">Not mapped</SelectItem>{headers.map((h,i)=><SelectItem key={`${i}-${h}`} value={String(i)}>Column {i+1}: {String(h||'(blank)').slice(0,60)}</SelectItem>)}</SelectContent></Select></div>)}</div>
      {mappingErrors.length > 0 && <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-xs text-destructive">{mappingErrors.map((e,i)=><div key={i}>• {e.message}</div>)}</div>}
    </div>}

    {rows.length > 0 && <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
      <div className="p-5 space-y-3 border-b border-border/40"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">Pre-import Preview</h3><p className="text-xs text-muted-foreground">Nothing below changes the database until atomic commit is confirmed.</p></div>{fingerprint ? <Badge className="gap-1"><ShieldCheck className="size-3"/>Server preflight current</Badge> : <Badge variant="outline">Preflight required</Badge>}</div><Summary summary={summary}/></div>
      <div className="max-h-[430px] overflow-auto"><Table><TableHeader><TableRow><TableHead className="w-10">Use</TableHead><TableHead>Row</TableHead><TableHead>Status</TableHead><TableHead>Part Number</TableHead><TableHead>Group</TableHead><TableHead>Source</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead>Issues</TableHead><TableHead className="w-10"/></TableRow></TableHeader><TableBody>{rows.map(r=><TableRow key={r.rowNumber} className={r.status==='invalid'||r.status==='conflicting'?'bg-destructive/[.03]':''}><TableCell>{r.status==='valid' && <input type="checkbox" checked={!!r.selected} onChange={()=>toggleRow(r.rowNumber)} aria-label={`Select row ${r.rowNumber}`}/>}</TableCell><TableCell className="text-xs">{r.rowNumber}</TableCell><TableCell><Badge variant={STATUS_META[r.status]?.variant || 'outline'}>{STATUS_META[r.status]?.label || r.status}</Badge>{r.serverAction && <div className="text-[10px] text-muted-foreground mt-1">{r.serverAction}</div>}</TableCell><TableCell className="font-medium text-xs">{r.values?.name || '—'}</TableCell><TableCell className="text-xs">{r.values?.groupId || '—'}</TableCell><TableCell className="text-xs">{r.values?.sourceType || '—'}</TableCell><TableCell className="text-xs">{r.values?.quantity ?? '—'}</TableCell><TableCell className="text-xs">{r.values?.buyingPrice ?? '—'} {r.values?.currency || ''}</TableCell><TableCell className="min-w-[260px] text-xs">{r.errors?.length ? r.errors.map((e,i)=><div key={i} className="text-destructive">• {e.message}</div>) : <span className="text-muted-foreground">No validation errors</span>}</TableCell><TableCell><Button variant="ghost" size="icon" className="size-7" onClick={()=>removeRow(r.rowNumber)} aria-label={`Skip row ${r.rowNumber}`}><Trash2 className="size-3.5"/></Button></TableCell></TableRow>)}</TableBody></Table></div>
      <div className="p-4 border-t border-border/40 flex flex-wrap gap-2 items-center"><Button variant="outline" onClick={runPreflight} disabled={loading||committing||mappingErrors.length>0||!summary.selected} className="gap-1.5">{loading?<Loader2 className="size-4 animate-spin"/>:<RefreshCw className="size-4"/>}Run Server Preflight</Button><Button onClick={commit} disabled={!canCommit||committing||loading} className="gap-1.5">{committing?<Loader2 className="size-4 animate-spin"/>:<CheckCircle2 className="size-4"/>}Commit {summary.selected || 0} Rows Atomically</Button>{(summary.invalid||summary.duplicate||summary.conflicting) ? <><Button variant="outline" size="sm" onClick={downloadErrorReport} className="gap-1.5"><Download className="size-3.5"/>Error Report</Button><div className="text-xs text-muted-foreground flex items-center gap-1.5"><XCircle className="size-3.5 text-destructive"/>Invalid/duplicate/conflicting rows block commit; remove them or correct the mapping/file.</div></> : null}</div>
    </div>}
  </div>;
}

export default BulkPasteImport;
