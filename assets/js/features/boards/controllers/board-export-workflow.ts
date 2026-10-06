import type { BoardEnvelope } from '../../../../../src/features/boards/contracts/domain.ts';
import type { BoardDialog } from '../../../../../src/features/boards/contracts/presentation.ts';
import type { EscapeHtml, ToastRenderer } from '../../../../../src/platform/contracts/ui.ts';
import { exportBoard } from '../../../../../src/features/boards/export/board-export.ts';
import type { BoardExportArtifact, BoardExportFormat } from '../../../../../src/features/boards/contracts/export.ts';

interface Dependencies {
  readonly getBoard: () => BoardEnvelope | null;
  readonly dialog: BoardDialog;
  readonly toast: ToastRenderer;
  readonly escapeHtml: EscapeHtml;
}

function saveArtifact(artifact: BoardExportArtifact): void {
  const blob = new Blob([artifact.bytes], { type: artifact.mimeType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = artifact.fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  queueMicrotask(() => URL.revokeObjectURL(href));
}

export function createBoardExportWorkflow({ getBoard, dialog, toast, escapeHtml: esc }: Dependencies) {
  const perform=(format:BoardExportFormat,template=false)=>{
    const board=getBoard(); if(!board?.board){toast('Open a Board before exporting.','warning');return;}
    try { const artifact=exportBoard(board,format,{template,includeExamples:template}); saveArtifact(artifact); toast(`${template?'Import template':'Board export'} downloaded as ${format.toUpperCase()}.`); }
    catch(error){toast(error instanceof Error?error.message:'The Board export could not be generated.','warning');}
  };
  const openSpecification=()=>{
    const board=getBoard(); if(!board?.board){toast('Open a Board before viewing its import specification.','warning');return;}
    const spec=exportBoard(board,'csv',{template:true}).specification;
    const rows=spec.columns.map((c)=>`<tr><td><code>${esc(c.header)}</code></td><td>${esc(c.label)}</td><td>${esc(c.dataType)}</td><td>${c.required?'Required':'Optional'}</td><td>${esc(c.acceptedValues.length?c.acceptedValues.join(' | '):c.format)}</td><td>${c.maxLength??'—'}</td><td>${esc(c.example)}</td><td>${esc(c.normalization)}</td></tr>`).join('');
    dialog({title:'Board import specification',body:`<p class="wm-help">Contract version ${esc(spec.version)}. Export headers are directly accepted by the import pipeline. Existing rows are never silently overwritten.</p><div class="board-import-table-wrap"><table class="wm-table"><thead><tr><th>Column</th><th>Meaning</th><th>Type</th><th>Requirement</th><th>Accepted values / format</th><th>Max</th><th>Example</th><th>Normalization</th></tr></thead><tbody>${rows}</tbody></table></div>`,submitLabel:'Close',onSubmit:()=>{}});
  };
  return Object.freeze({ perform, openSpecification });
}
