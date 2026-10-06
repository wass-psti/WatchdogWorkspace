import type { BoardDomainService } from '../../../../../src/features/boards/contracts/service.ts';
import type { BoardEnvelope } from '../../../../../src/features/boards/contracts/domain.ts';
import type { BoardDialog } from '../../../../../src/features/boards/contracts/presentation.ts';
import type { EscapeHtml, ToastRenderer } from '../../../../../src/platform/contracts/ui.ts';
import { createBoardImportSchema } from '../../../../../src/features/boards/contracts/import.ts';
import { parseBoardImport } from '../../../../../src/features/boards/import/board-import-parser.ts';
import { createBoardImportCommitRequest, createBoardImportPreview } from '../../../../../src/features/boards/import/board-import-preview.ts';
import type { BoardImportDataset, BoardImportDiagnostic, BoardImportSource } from '../../../../../src/features/boards/contracts/import.ts';
import type { BoardImportPreview } from '../../../../../src/features/boards/contracts/import-preview.ts';

interface BoardImportWorkflowDependencies {
  readonly api: BoardDomainService;
  readonly getBoard: () => BoardEnvelope | null;
  readonly dialog: BoardDialog;
  readonly toast: ToastRenderer;
  readonly escapeHtml: EscapeHtml;
  readonly reloadBoard: () => void | Promise<unknown>;
}

const sourceFromFile = (file: File): BoardImportSource => ({ name:file.name, type:file.type, size:file.size, arrayBuffer:()=>file.arrayBuffer() });
const printable = (value: unknown): string => value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value);

export function createBoardImportWorkflow({ api, getBoard, dialog, toast, escapeHtml: esc, reloadBoard }: BoardImportWorkflowDependencies) {
  let source: BoardImportSource | null = null;
  let dataset: BoardImportDataset | null = null;
  let preview: BoardImportPreview | null = null;

  const rowTone = (disposition: string) => disposition === 'valid' ? 'success' : disposition === 'skipped' ? 'muted' : disposition === 'duplicate' ? 'warning' : 'danger';
  const diagnosticText = (entry: BoardImportDiagnostic): string => {
    const details = [
      entry.field ? `Field: ${entry.field}` : '',
      entry.rule ? `Rule: ${entry.rule}` : '',
      entry.importedValue !== undefined ? `Imported: ${printable(entry.importedValue)}` : '',
      entry.expected ? `Expected: ${entry.expected}` : '',
      entry.acceptedValues?.length ? `Accepted: ${entry.acceptedValues.join(' | ')}` : '',
      entry.duplicateSource ? `Duplicate source: ${entry.duplicateSource.kind}${entry.duplicateSource.row ? ` row ${entry.duplicateSource.row}` : ''}${entry.duplicateSource.itemId ? ` item ${entry.duplicateSource.itemId}` : ''}` : '',
      entry.conflictSource ? `Conflict source: ${entry.conflictSource.kind}${entry.conflictSource.itemId ? ` item ${entry.conflictSource.itemId}` : ''}${entry.conflictSource.relationshipId ? ` ${entry.conflictSource.relationshipId}` : ''}` : '',
      entry.blocking ? 'Blocks import' : '',
    ].filter(Boolean);
    return details.length ? `${entry.message} (${details.join('; ')})` : entry.message;
  };

  const renderPreview = (current: BoardImportPreview): string => {
    const schema = createBoardImportSchema(getBoard()?.columns ?? []);
    const worksheetSelector = current.dataset.worksheets.length > 1
      ? `<label class="wm-field"><span>Worksheet</span><select name="worksheet" data-import-worksheet>${current.dataset.worksheets.map((sheet)=>`<option value="${esc(sheet.name)}" ${sheet.name===current.dataset.selectedWorksheet?'selected':''}>${esc(sheet.name)}${sheet.hidden?' (hidden)':''} — ${sheet.rowCount} rows</option>`).join('')}</select><small>Select the worksheet to validate and import. Re-run validation after changing it.</small></label>`
      : `<p class="wm-help">Worksheet: <strong>${esc(current.dataset.selectedWorksheet)}</strong></p>`;
    const mappingRows = current.dataset.headers.map((header) => {
      const selected = current.mapping.find((entry) => entry.source === header)?.target ?? '';
      const options = [`<option value="">Skip column</option>`, ...schema.fields.map((field) => `<option value="${esc(field.key)}" ${field.key===selected?'selected':''}>${esc(field.label)}</option>`)].join('');
      return `<label class="wm-field"><span>${esc(header)}</span><select name="map:${esc(header)}" data-import-mapping>${options}</select></label>`;
    }).join('');
    const datasetDiagnostics = current.dataset.diagnostics.length
      ? `<div class="wm-callout" data-import-dataset-diagnostics>${current.dataset.diagnostics.map((entry)=>`<p>${esc(diagnosticText(entry))}</p>`).join('')}</div>` : '';
    const rows = current.rows.map((row) => {
      const messages = row.diagnostics.map(diagnosticText).join(' · ') || 'Ready to import';
      const normalized = Object.entries(row.normalized).map(([key,value])=>`${key}: ${printable(value)}`).join(' | ');
      const result = row.operation && row.disposition === 'valid' ? `${row.disposition} · ${row.operation}` : row.disposition;
      return `<tr data-import-row="${row.sourceRow}" data-import-tone="${rowTone(row.disposition)}"><td><input type="checkbox" name="exclude:${row.sourceRow}" value="1" ${row.excluded?'checked':''} aria-label="Exclude source row ${row.sourceRow}"></td><td>${row.sourceRow}</td><td><strong>${esc(result)}</strong></td><td>${esc(normalized)}</td><td>${esc(messages)}</td></tr>`;
    }).join('');
    const s=current.summary;
    return `<div class="board-import-preview" data-import-preview>
      <div class="board-import-summary" role="status"><span>Valid <strong>${s.valid}</strong></span><span>Invalid <strong>${s.invalid}</strong></span><span>Duplicate <strong>${s.duplicate}</strong></span><span>Conflict <strong>${s.conflict}</strong></span><span>Skipped <strong>${s.skipped}</strong></span><span>Creates <strong>${s.creates}</strong></span><span>Updates <strong>${s.updates}</strong></span><span>Committable <strong>${s.committable}</strong></span></div>
      <p class="wm-help">No persisted data changes during preview. Invalid/conflicting rows must be corrected or excluded. Duplicate rows are skipped by policy. Existing-item edits require Item ID plus the current exported Item Updated At value.</p>
      ${datasetDiagnostics}
      <details open><summary>Worksheet and column mapping</summary>${worksheetSelector}<div class="board-import-mapping">${mappingRows}</div><button type="button" class="secondary-btn" data-import-revalidate>Re-run validation</button><span data-import-dirty-note hidden>Worksheet, mapping, or exclusions changed. Re-run validation before import.</span></details>
      <div class="board-import-table-wrap"><table class="wm-table board-import-table"><thead><tr><th>Exclude</th><th>Row</th><th>Result / operation</th><th>Normalized values</th><th>Structured validation / conflict information</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>`;
  };

  const openPreview = (current: BoardImportPreview): void => {
    preview=current;
    const handle=dialog({
      title:'Review Board import',
      body:renderPreview(current),
      submitLabel:current.blocking?'Resolve blocking rows':'Import reviewed rows',
      onSubmit:async()=>{
        if (!preview || preview.blocking) throw new Error('Resolve or exclude all invalid/conflicting rows, then re-run validation.');
        const request=createBoardImportCommitRequest(preview);
        const result=await api.importItemsAtomic(request);
        toast(`Import complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.rejected} rejected, ${result.affected} affected.`);
        await reloadBoard();
      },
    });
    const submit=handle.wrap.querySelector<HTMLButtonElement>('button[type="submit"]');
    const dirtyNote=handle.wrap.querySelector<HTMLElement>('[data-import-dirty-note]');
    const markDirty=()=>{ if(submit) submit.disabled=true; if(dirtyNote) dirtyNote.hidden=false; };
    handle.wrap.querySelectorAll<HTMLElement>('[data-import-mapping],[data-import-worksheet],input[name^="exclude:"]').forEach((element)=>element.addEventListener('change',markDirty));
    handle.wrap.querySelector<HTMLButtonElement>('[data-import-revalidate]')?.addEventListener('click',async()=>{
      try {
        if(!source) return;
        const board=getBoard(); if(!board) throw new Error('Refresh the Board before continuing the import.');
        const mapping:Record<string,string|null>={};
        handle.wrap.querySelectorAll<HTMLSelectElement>('[data-import-mapping]').forEach((select)=>{mapping[select.name.slice(4)]=select.value||null;});
        const worksheet=handle.wrap.querySelector<HTMLSelectElement>('[data-import-worksheet]')?.value || current.dataset.selectedWorksheet;
        const excluded=[...handle.wrap.querySelectorAll<HTMLInputElement>('input[name^="exclude:"]:checked')].map((input)=>Number(input.name.slice(8))).filter(Number.isFinite);
        dataset=await parseBoardImport(source,{schema:createBoardImportSchema(board.columns),worksheet,columnMapping:mapping,allowUnexpectedColumns:true});
        const next=createBoardImportPreview(dataset,board,excluded);
        handle.close();
        queueMicrotask(()=>openPreview(next));
      } catch (error) {
        toast(error instanceof Error ? error.message : 'The import could not be revalidated.','warning');
      }
    });
  };

  const open = (): void => {
    const board=getBoard(); if(!board?.board) { toast('Open a Board before importing.','warning'); return; }
    dialog({
      title:'Import Board data',
      body:`<div class="wm-field"><label for="boardImportFile">CSV or Excel file</label><input id="boardImportFile" name="file" type="file" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required><small>Files are parsed locally for review. Multi-sheet workbooks can be switched in the review step. Nothing is committed until the final import step.</small></div>`,
      submitLabel:'Preview import',
      onSubmit:async(data)=>{
        const file=data.get('file'); if(!(file instanceof File) || file.size===0) throw new Error('Choose a CSV, XLS, or XLSX file.');
        source=sourceFromFile(file);
        const currentBoard=getBoard(); if(!currentBoard?.board) throw new Error('The Board is no longer available.');
        dataset=await parseBoardImport(source,{schema:createBoardImportSchema(currentBoard.columns),allowUnexpectedColumns:true});
        const next=createBoardImportPreview(dataset,currentBoard);
        queueMicrotask(()=>openPreview(next));
      },
    });
  };
  return Object.freeze({open});
}
