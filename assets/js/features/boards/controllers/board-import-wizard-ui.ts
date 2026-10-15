/** M142: non-mutating three-step Board Import wizard. M143 owns new backend mutation. */
import type { BoardEnvelope, BoardColumnType } from '../../../../../src/features/boards/contracts/domain.ts';
import type { BoardImportDataset, BoardImportSource } from '../../../../../src/features/boards/contracts/import.ts';
import type { BoardImportWizardColumnChoice, BoardImportWizardDraft, BoardImportWizardGroupChoice, BoardImportWizardMatchChoice, BoardImportWizardStep } from '../../../../../src/features/boards/contracts/import-wizard.ts';
import type { OverlayManager } from '../../../../../src/platform/contracts/overlay.ts';
import type { EscapeHtml, ToastRenderer } from '../../../../../src/platform/contracts/ui.ts';
import { createBoardImportSchema } from '../../../../../src/features/boards/contracts/import.ts';
import { parseBoardImport } from '../../../../../src/features/boards/import/board-import-parser.ts';
import { blankWizardItemRows, excludeBlankWizardItemRows, planBoardImportWizard } from '../../../../../src/features/boards/import/board-import-wizard-plan.ts';
import { createBoardImportWizardRpcRequest } from '../../../../../src/features/boards/import/board-import-wizard-commit.ts';
import type { BoardImportWizardRpcRequest, BoardImportWizardCompletion } from '../../../../../src/features/boards/contracts/import-wizard-commit.ts';
import { resolveGlobalOverlayRoot } from '../../../platform/ui/global-overlay-runtime.ts';
import '../../../../css/board-import-wizard.css';

interface Dependencies {
  readonly getBoard: () => BoardEnvelope | null;
  readonly canEdit: () => boolean;
  readonly toast: ToastRenderer;
  readonly escapeHtml: EscapeHtml;
  readonly overlayCoordinator: OverlayManager;
  readonly openExistingImporter: () => void;
  readonly commitWizard: (request: BoardImportWizardRpcRequest) => Promise<BoardImportWizardCompletion>;
  readonly reloadBoard: () => Promise<unknown>;
}

type WizardMapping = BoardImportWizardColumnChoice;
type WizardState = {
  step: BoardImportWizardStep;
  file: File | null;
  dataset: BoardImportDataset | null;
  mappings: WizardMapping[];
  group: BoardImportWizardGroupChoice;
  matches: BoardImportWizardMatchChoice;
  error: string;
  busy: boolean;
  commitFailed: boolean;
  skipBlankItemRows: boolean;
};
const TYPES: readonly BoardColumnType[] = ['text','long_text','number','status','dropdown','date','people','checkbox','timeline','email','url'];
const canonical = (s: string) => s.trim().replace(/\s+/g,' ').toLowerCase();
const fileSource = (file: File): BoardImportSource => ({ name:file.name, type:file.type, size:file.size, arrayBuffer:()=>file.arrayBuffer() });
const escapeAttribute = (esc: EscapeHtml, s: unknown): string => esc(s);

/** Unmapped columns default to Skip; users explicitly opt in to creating columns. */
export function defaultWizardMappings(dataset: BoardImportDataset): WizardMapping[] {
  let itemAssigned = false;
  return dataset.headers.map((source) => {
    if (!itemAssigned && ['name','item','item name','title'].includes(canonical(source))) {
      itemAssigned = true;
      return { source, action:'item' as const };
    }
    return { source, action:'skip' as const };
  });
}

export function createBoardImportWizardUi({getBoard,canEdit,toast,escapeHtml:esc,overlayCoordinator,openExistingImporter,commitWizard,reloadBoard}: Dependencies) {
  let active: HTMLElement | null = null;
  let closeCurrent: (() => void) | null = null;
  let sequence = 0;
  const open = (): void => {
    if (active?.isConnected) { toast('An import wizard is already open. Complete or close it first.','warning'); return; }
    const board = getBoard();
    if (!board?.board) { toast('Open a Board before importing.','warning'); return; }
    if (!canEdit()) { toast('You do not have permission to import Board data.','warning'); return; }
    closeCurrent?.();
    overlayCoordinator.closeAll({restoreFocus:false});
    const priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = `board-import-wizard-${++sequence}`;
    const state: WizardState = {
      step:'upload', file:null, dataset:null, mappings:[],
      group: board.groups[0] ? {action:'existing', groupId:String(board.groups[0].id)} : {action:'create',name:'Imported group'},
      matches:{behavior:'add-new'},error:'',busy:false,commitFailed:false,skipBlankItemRows:false,
    };
    const root = document.createElement('div');
    root.className='wm-import-wizard-backdrop';
    root.dataset.boardImportWizard='';
    root.innerHTML='<section class="wm-import-wizard" role="dialog" aria-modal="true" aria-label="Board Import" tabindex="-1"></section>';
    const container=root.querySelector<HTMLElement>('.wm-import-wizard')!;
    resolveGlobalOverlayRoot().append(root);
    active=root;
    let disposed=false;
    const close=(restoreFocus=true):void=>{
      if(disposed || state.busy)return;
      disposed=true;
      overlayCoordinator.release(id);
      root.remove();
      if(active===root)active=null;
      if(closeCurrent===finish)closeCurrent=null;
      if(restoreFocus && priorFocus?.isConnected)priorFocus.focus({preventScroll:true});
    };
    const finish=():void=>close(true);
    closeCurrent=finish;
    const screen=(content: string,primaryLabel:string,primaryDisabled=false):void=>{
      const steps:readonly [BoardImportWizardStep,string][]=[['upload','Upload'],['map-columns','Map columns'],['handle-matches','Handle matches']];
      const current=steps.findIndex(([step])=>step===state.step);
      container.innerHTML=`<header class="wm-import-wizard-header"><div class="wm-import-wizard-title"><strong>Import Board data</strong><span>${esc(board.board?.name??'Board')}</span></div><nav class="wm-import-wizard-progress" aria-label="Import progress">${steps.map(([step,title],i)=>`<span class="wm-import-wizard-step" data-current="${step===state.step}" ${step===state.step?'aria-current="step"':''}><i>${i+1}</i>${esc(title)}</span>`).join('')}</nav><button type="button" class="wm-import-wizard-close" data-wizard-close aria-label="Close Board Import" ${state.busy?'disabled':''}>×</button></header><main class="wm-import-wizard-main">${state.error?`<div class="wm-import-wizard-error" role="alert">${esc(state.error)}</div>`:''}${content}</main><footer class="wm-import-wizard-footer"><button type="button" data-wizard-classic class="wm-import-wizard-link" ${state.busy?'disabled':''}>Use existing reviewed importer</button><span class="wm-import-wizard-footer-actions"><button type="button" data-wizard-back class="secondary-btn" ${current===0||state.busy?'disabled':''}>Back</button><button type="button" data-wizard-next class="primary-btn" ${primaryDisabled||state.busy?'disabled':''}>${esc(primaryLabel)}</button></span></footer>`;
    };
    const draft=():BoardImportWizardDraft=>({sourceWorksheet:state.dataset?.selectedWorksheet??'',mappings:state.mappings,group:state.group,matches:state.matches});
    const reviewedDataset=():BoardImportDataset=>{
      const dataset=state.dataset!;
      return state.skipBlankItemRows ? excludeBlankWizardItemRows(dataset,state.mappings) : dataset;
    };
    const render=():void=>{
      if(disposed)return;
      const currentBoard=getBoard();
      if(!currentBoard?.board||String(currentBoard.board.id)!==String(board.board!.id)){
        state.error='The target Board changed. Close and restart the import.';
        screen('<p>Refresh the target Board before continuing.</p>','Continue',true);return;
      }
      if(state.step==='upload'){
        screen(`<section class="wm-import-wizard-centered"><h1>Import your spreadsheet</h1><p>Select a CSV or Excel export. Nothing is saved until a reviewed import is explicitly committed.</p><label class="wm-import-wizard-drop" data-wizard-drop><span class="wm-import-wizard-upload-icon" aria-hidden="true">↑</span><strong>Drag and drop a file here</strong><span>or choose a file from your computer</span><span class="wm-import-wizard-browse">Browse files</span><small>CSV, XLS, XLSX · maximum 25 MB</small><input type="file" data-wizard-file accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-label="Select Board spreadsheet"></label>${state.file?`<p class="wm-import-wizard-selected">Selected: ${esc(state.file.name)}</p>`:''}</section>`,'Continue',!state.dataset);
        return;
      }
      const dataset=state.dataset;
      if(!dataset){state.step='upload';render();return;}
      if(state.step==='map-columns'){
        const existing=board.groups.map((group)=>`<option value="existing:${esc(group.id)}" ${state.group.action==='existing'&&state.group.groupId===String(group.id)?'selected':''}>${esc(group.title)}</option>`).join('');
        const chosenGroup=state.group.action==='create'?'create':`existing:${state.group.groupId}`;
        const groupMarkup=`<div class="wm-import-wizard-group"><label>Add items to <select data-wizard-group><option value="create" ${chosenGroup==='create'?'selected':''}>New group</option>${existing}</select></label>${state.group.action==='create'?`<label>New group name<input data-wizard-group-name maxlength="120" value="${escapeAttribute(esc,state.group.name)}" aria-label="New group name"></label>`:''}</div>`;
        const worksheet=dataset.worksheets.length>1?`<label>Worksheet<select data-wizard-sheet>${dataset.worksheets.map((s)=>`<option value="${esc(s.name)}" ${s.name===dataset.selectedWorksheet?'selected':''}>${esc(s.name)}${s.hidden?' (hidden)':''}</option>`).join('')}</select></label>`:'';
        const rows=state.mappings.map((choice,index)=>{
          const options=[`<option value="skip" ${choice.action==='skip'?'selected':''}>Don't import</option>`,`<option value="item" ${choice.action==='item'?'selected':''}>Item (primary name)</option>`,...board.columns.filter(c=>c.system_key!=='title').map(c=>`<option value="existing:${esc(c.id)}" ${choice.action==='existing'&&choice.columnId===String(c.id)?'selected':''}>Map to: ${esc(c.name)}</option>`),`<option value="create" ${choice.action==='create'?'selected':''}>Create new column</option>`].join('');
          const createControls=choice.action==='create'?`<div class="wm-import-wizard-create-fields"><input data-wizard-new-name="${index}" maxlength="80" aria-label="Name for new column ${esc(choice.source)}" value="${escapeAttribute(esc,choice.name)}"><select data-wizard-new-type="${index}" aria-label="Type for new column ${esc(choice.source)}">${TYPES.map(t=>`<option value="${t}" ${choice.columnType===t?'selected':''}>${esc(t.replace('_',' '))}</option>`).join('')}</select></div>`:'';
          return `<tr><td><strong>${esc(choice.source)}</strong></td><td><select data-wizard-mapping="${index}" aria-label="Mapping for ${esc(choice.source)}">${options}</select>${createControls}</td></tr>`;
        }).join('');
        const mapped=state.mappings.filter(m=>m.action==='item'||m.action==='existing').length;
        const created=state.mappings.filter(m=>m.action==='create').length;
        const skipped=state.mappings.filter(m=>m.action==='skip').length;
        const blankRows=blankWizardItemRows(dataset,state.mappings);
        const rowList=blankRows.slice(0,12).join(', ')+(blankRows.length>12?', …':'');
        const blankRowControl=blankRows.length?`<div class="wm-import-wizard-diagnostics" role="status"><strong>${blankRows.length} spreadsheet row${blankRows.length===1?' has':'s have'} an empty Item name</strong><p>Source row${blankRows.length===1?'':'s'}: ${esc(rowList)}. Mapping a column does not fill its empty cells.</p><label><input type="checkbox" data-wizard-skip-blank ${state.skipBlankItemRows?'checked':''}> Explicitly exclude these ${blankRows.length} blank-name row${blankRows.length===1?'':'s'} from this import</label></div>`:'';
        screen(`<section class="wm-import-wizard-content"><h1>Map your columns</h1><p>Choose which spreadsheet columns will become Board fields. New columns are proposed only; they are not created in this step.</p><div class="wm-import-wizard-options">${groupMarkup}${worksheet}<label>Unmapped columns<select data-wizard-bulk><option value="">Select an action</option><option value="create">Create new columns</option><option value="skip">Don't import</option></select></label></div><div class="wm-import-wizard-counts"><span>${mapped} mapped</span><span>${created} new</span><span>${skipped} excluded</span></div>${blankRowControl}<div class="wm-import-wizard-table-wrap"><table class="wm-import-wizard-table"><thead><tr><th>Spreadsheet column</th><th>Import as</th></tr></thead><tbody>${rows}</tbody></table></div></section>`,'Continue');
        return;
      }
      const plan=planBoardImportWizard(reviewedDataset(),currentBoard,draft());
      const options=[`<option value="">Choose matching column</option>`,...state.mappings.flatMap(m=>m.action==='item'?[`<option value="item" ${state.matches.behavior!=='add-new'&&state.matches.matchColumnId==='item'?'selected':''}>Item (primary name)</option>`]:m.action==='existing'?[`<option value="${esc(m.columnId)}" ${state.matches.behavior!=='add-new'&&state.matches.matchColumnId===m.columnId?'selected':''}>${esc(currentBoard.columns.find(c=>String(c.id)===m.columnId)?.name??m.source)}</option>`]:[])].join('');
      const counts={create:0,update:0,skip:0,blocked:0};
      for(const decision of plan.decisions)counts[decision.decision]++;
      const validation=plan.errors.length?`<section class="wm-import-wizard-diagnostics" role="alert"><h2>Review required (${plan.errors.length})</h2><ul>${plan.errors.slice(0,20).map(issue=>`<li>${esc(issue.message)}${issue.sourceRow&&!issue.message.includes(`row ${issue.sourceRow}`)?` · row ${issue.sourceRow}`:''}</li>`).join('')}</ul></section>`:'';
      const cautions=plan.cautions.length?`<section class="wm-import-wizard-cautions"><h2>Important notes</h2><ul>${plan.cautions.map(issue=>`<li>${esc(issue.message)}</li>`).join('')}</ul></section>`:'';
      const behavior=state.matches.behavior;
      let commitIssue='';
      if (state.commitFailed) commitIssue='The last import outcome is not confirmed. Close, refresh the Board, and start a new reviewed import before trying again.';
      else if (!canEdit()) commitIssue='Board edit permission is no longer available.';
      else if (plan.configurationValid) {
        try { createBoardImportWizardRpcRequest(reviewedDataset(),currentBoard,draft()); }
        catch (error) { commitIssue=error instanceof Error?error.message:'Import contract validation failed.'; }
      }
      // HF3: A matching-policy change cannot resolve column-type restrictions.
      // Offer an explicit, value-preserving conversion for NEW columns only.
      // Existing Board fields and the primary Item mapping are never altered.
      const newTypedColumns=state.mappings.filter(mapping=>mapping.action==='create' && mapping.columnType!=='text');
      const needsChoiceApproval=newTypedColumns.some(mapping=>mapping.action==='create' && (mapping.columnType==='status'||mapping.columnType==='dropdown'));
      const textResolution=newTypedColumns.length && !state.commitFailed && canEdit() && (needsChoiceApproval || Boolean(commitIssue))
        ? `<section class="wm-import-wizard-diagnostics" role="alert"><h2>Resolve column-type blockers</h2><p>Import Now cannot proceed while a proposed column fails validation. The current backend cannot create Status/Dropdown columns without configured options; other typed columns may also reject spreadsheet values.</p><button type="button" class="secondary-btn" data-wizard-new-columns-as-text>Use Text for ${newTypedColumns.length} proposed column${newTypedColumns.length===1?'':'s'}</button><p>This is optional and affects only NEW columns. It preserves their names and spreadsheet values as text; it does not change existing Board columns. To keep native column types, use Back and correct the mappings instead.</p></section>`
        : '';
      screen(`<section class="wm-import-wizard-content wm-import-wizard-matches"><h1>Handle matches</h1><p>Decide how rows that already exist in this group should be treated.</p><fieldset class="wm-import-wizard-match-policy"><legend>Matching policy</legend><label><input type="radio" name="wizard-behavior" value="add-new" ${behavior==='add-new'?'checked':''}><span><strong>Add as new items</strong><small>Propose new items even when values match existing records.</small></span></label><label><input type="radio" name="wizard-behavior" value="skip" ${behavior==='skip'?'checked':''}><span><strong>Skip</strong><small>Skip matching rows and create only unmatched rows.</small></span></label><label><input type="radio" name="wizard-behavior" value="update" ${behavior==='update'?'checked':''}><span><strong>Update</strong><small>Match a unique existing row; unmatched rows are skipped.</small></span></label></fieldset>${behavior!=='add-new'?`<label class="wm-import-wizard-match-select">Match using<select data-wizard-match-column>${options}</select></label>`:''}<div class="wm-import-wizard-summary" role="status"><span>${counts.create} to create</span><span>${counts.update} to update</span><span>${counts.skip} skipped</span><span>${counts.blocked} blocked</span></div>${validation}${cautions}${textResolution}${commitIssue?`<div class="wm-import-wizard-error" role="alert">${esc(commitIssue)}</div>`:''}<p class="wm-import-wizard-backend-note">Import commits as one transaction. If the M143 RPC is not installed, the server rejects the request without writes. Review the preview before importing.</p></section>`,'Import Now',!plan.configurationValid||Boolean(commitIssue));
    };
    const parse=async(file:File,worksheet?:string):Promise<void>=>{
      if(disposed)return;
      state.busy=true;state.error='';render();
      try{
        const current=getBoard();if(!current?.board||String(current.board.id)!==String(board.board?.id))throw new Error('Board changed during file selection.');
        // Do not force the old required Item mapping: user chooses the primary column in step 2.
        const schema=createBoardImportSchema(current.columns);
        const permissive={fields:schema.fields.map(field=>({...field,required:false}))};
        const parsed=await parseBoardImport(fileSource(file),{schema:permissive,allowUnexpectedColumns:true,...(worksheet?{worksheet}:{})});
        if(disposed)return;
        state.file=file;state.dataset=parsed;
        state.mappings=defaultWizardMappings(parsed);
        state.group= current.groups[0]?{action:'existing',groupId:String(current.groups[0].id)}:{action:'create',name:'Imported group'};
        state.matches={behavior:'add-new'};
        state.skipBlankItemRows=false;
        state.step='map-columns';
      }catch(error){
        if(disposed)return;
        state.error=error instanceof Error?error.message:'Unable to read the selected spreadsheet.';
      }finally{if(!disposed){state.busy=false;render();}}
    };
    root.addEventListener('click',(event)=>{
      const target=event.target instanceof Element?event.target:null;
      if(!target)return;
      if(state.busy) return; // Never switch flows or navigate while the atomic result is unresolved.
      if(target.closest('[data-wizard-close]')){close();return;}
      if(target.closest('[data-wizard-classic]')){close(false);openExistingImporter();return;}
      if(target.closest('[data-wizard-new-columns-as-text]') && state.step==='handle-matches'){
        // Requires an intentional click; never change existing columns or coerce silently.
        state.mappings=state.mappings.map(mapping=>mapping.action==='create' && mapping.columnType!=='text'
          ? {...mapping,columnType:'text'} : mapping);
        state.error='';render();return;
      }
      if(target.closest('[data-wizard-back]')){
        if(state.step==='handle-matches')state.step='map-columns';else if(state.step==='map-columns')state.step='upload';
        state.error='';render();return;
      }
      if(target.closest('[data-wizard-next]')){
        if(state.commitFailed)return;
        if(state.step==='handle-matches' && state.dataset){
          void (async()=>{
            const latest=getBoard();
            if(!latest?.board || !canEdit()) { state.error='Board access has changed; reopen the import.';render();return; }
            try {
              if(String(latest.board.updated_at)!==String(board.board?.updated_at)){state.error='Board changed since opening the wizard. Close, refresh and review again.';render();return;}
            const request=createBoardImportWizardRpcRequest(reviewedDataset(),latest,draft());
              state.busy=true;state.error='';render();
              const result=await commitWizard(request);
              state.busy=false;
              void reloadBoard().catch(()=>toast('Import committed, but the Board refresh failed. Reopen the Board to confirm.', 'warning'));
              toast(`Import complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped. ${result.columnsCreated} columns and ${result.groupsCreated} groups created.`);
              close();
            }catch(error){
              state.busy=false;
              state.commitFailed=true; // A transport error may mean the server committed; never auto-retry.
              if(!disposed){state.error=(error instanceof Error?error.message:'The import outcome could not be confirmed.')+' Refresh Board data and confirm the result before any retry.';render();}
            }
          })();
          return;
        }
        if(state.step==='upload'&&state.dataset){state.step='map-columns';render();}
        else if(state.step==='map-columns'&&state.dataset){
          const current=getBoard();if(!current){state.error='Target Board is unavailable.';render();return;}
          const plan=planBoardImportWizard(reviewedDataset(),current,draft());
          if(!plan.configurationValid){state.error=plan.errors.map(e=>e.message).slice(0,3).join(' · ');render();return;}
          state.error='';state.step='handle-matches';render();
        }
        return;
      }
    });
    root.addEventListener('change',(event)=>{void (async()=>{
      const target=event.target;
      if(target instanceof HTMLInputElement && target.matches('[data-wizard-file]')){
        const f=target.files?.[0];if(f)await parse(f);return;
      }
      if(target instanceof HTMLSelectElement && target.matches('[data-wizard-sheet]')){
        if(state.file)await parse(state.file,target.value);return;
      }
      if(target instanceof HTMLInputElement && target.matches('[data-wizard-skip-blank]')){
        state.skipBlankItemRows=target.checked;
      }else if(target instanceof HTMLSelectElement && target.matches('[data-wizard-group]')){
        state.group=target.value==='create'?{action:'create',name:'Imported group'}:{action:'existing',groupId:target.value.slice('existing:'.length)};
      }else if(target instanceof HTMLInputElement && target.matches('[data-wizard-group-name]') && state.group.action==='create'){
        state.group={action:'create',name:target.value};
      }else if(target instanceof HTMLSelectElement && target.matches('[data-wizard-bulk]')&&target.value){
        state.mappings=state.mappings.map(m=>m.action==='skip'||m.action==='create'
          ?target.value==='skip'?{source:m.source,action:'skip'}:{source:m.source,action:'create',name:m.source,columnType:'text'}:m);
      }else if(target instanceof HTMLSelectElement && target.matches('[data-wizard-mapping]')){
        const index=Number(target.dataset.wizardMapping);const old=state.mappings[index];if(!old)return;
        const val=target.value;
        state.skipBlankItemRows=false; // Changed primary mapping requires renewed row-exclusion consent.
        state.mappings[index]=val==='item'?{source:old.source,action:'item'}:val==='create'?{source:old.source,action:'create',name:old.source,columnType:'text'}:val.startsWith('existing:')?{source:old.source,action:'existing',columnId:val.slice(9)}:{source:old.source,action:'skip'};
      }else if(target instanceof HTMLInputElement&&target.matches('[data-wizard-new-name]')){
        const index=Number(target.dataset.wizardNewName),old=state.mappings[index];if(old?.action==='create')state.mappings[index]={...old,name:target.value};
      }else if(target instanceof HTMLSelectElement&&target.matches('[data-wizard-new-type]')){
        const index=Number(target.dataset.wizardNewType),old=state.mappings[index];if(old?.action==='create'&&TYPES.includes(target.value as BoardColumnType))state.mappings[index]={...old,columnType:target.value as BoardColumnType};
      }else if(target instanceof HTMLInputElement&&target.name==='wizard-behavior'){
        state.matches=target.value==='add-new'?{behavior:'add-new'}:{behavior:target.value==='update'?'update':'skip',matchColumnId:''};
      }else if(target instanceof HTMLSelectElement&&target.matches('[data-wizard-match-column]')&&state.matches.behavior!=='add-new'){
        state.matches={behavior:state.matches.behavior,matchColumnId:target.value};
      }else return;
      state.error='';render();
    })();});
    root.addEventListener('dragover',(event)=>{if(state.step==='upload'){event.preventDefault();root.classList.add('is-dragging');}});
    root.addEventListener('dragleave',(event)=>{if(!root.contains(event.relatedTarget as Node|null))root.classList.remove('is-dragging');});
    root.addEventListener('drop',(event)=>{
      if(state.step!=='upload')return;
      event.preventDefault();root.classList.remove('is-dragging');
      const file=event.dataTransfer?.files[0];if(file)void parse(file);
    });
    root.addEventListener('keydown',(event)=>{
      if(event.key==='Escape'){event.preventDefault();if(!state.busy)close();return;}
      if(event.key==='Tab'){
        const focusable=[...root.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length>0);
        if(!focusable.length)return;
        const first=focusable[0]!,last=focusable[focusable.length-1]!;
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    const opened=overlayCoordinator.open({id,element:root,trigger:priorFocus,close:({restoreFocus=true}={})=>close(restoreFocus)});
    if(!opened){close(false);toast('Another interface is already active. Close it before importing.','warning');return;}
    render();
    container.focus({preventScroll:true});
  };
  return Object.freeze({open});
}
