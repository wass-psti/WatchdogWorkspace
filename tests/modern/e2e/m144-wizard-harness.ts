/** M144 BROWSER TEST ONLY. Intentionally no hosted Supabase, credentials, or production session.
 * Uses actual wizard/parser/request builder, with a controlled application-service boundary.
 * Authenticated Supabase acceptance remains a separately REQUIRED certification gate.
 */
import { createBoardImportWizardUi } from '../../../assets/js/features/boards/controllers/board-import-wizard-ui.ts';
import type { BoardEnvelope } from '../../../src/features/boards/contracts/domain.ts';
import type { BoardImportWizardRpcRequest, BoardImportWizardCompletion } from '../../../src/features/boards/contracts/import-wizard-commit.ts';
import type { OverlayManager } from '../../../src/platform/contracts/overlay.ts';

const BOARD_ID = '11111111-1111-4111-8111-111111111111';
const GROUP_ID = '22222222-2222-4222-8222-222222222222';
const ITEM_ID = '33333333-3333-4333-8333-333333333333';
const TITLE_COL = '44444444-4444-4444-8444-444444444444';
const NOTE_COL = '55555555-5555-4555-8555-555555555555';
const BOARD_VERSION = '2026-10-13T03:00:00.000Z';
const ITEM_VERSION = '2026-10-13T02:59:00.000Z';
const makeBoard = (): BoardEnvelope => ({
  board: { id: BOARD_ID, name: 'M144 isolated QA', description: '', status: 'active', member_role: 'editor', updated_at: BOARD_VERSION },
  groups: [{ id: GROUP_ID, board_id: BOARD_ID, title: 'Main group', position: 0 }],
  columns: [
    { id: TITLE_COL, board_id: BOARD_ID, name: 'Item', data_type: 'text', system_key: 'title', column_key: 'title', position: 0, visible: true, config: {} },
    { id: NOTE_COL, board_id: BOARD_ID, name: 'Notes', data_type: 'text', column_key: 'qa_notes', position: 1, visible: true, config: {} },
  ],
  items: [{ id: ITEM_ID, board_id: BOARD_ID, group_id: GROUP_ID, title: 'Existing', position: 0, status: null, updated_at: ITEM_VERSION }],
  values: [], members: [], events: [],
} as unknown as BoardEnvelope);

let board = makeBoard();
let canEdit = true;
let serverMode: 'success'|'reject'|'pending' = 'success';
let pendingResolve: ((value: BoardImportWizardCompletion) => void) | null = null;
let pendingReject: ((error: Error) => void) | null = null;
const calls: BoardImportWizardRpcRequest[] = [];
const toasts: string[] = [];
let refreshCount=0;
let classicCount=0;
const resultFor = (request: BoardImportWizardRpcRequest): BoardImportWizardCompletion => {
  let created=0, updated=0, skipped=0;
  for (const row of request.payload.rows) {
    const match = board.items.filter(i => i.title.toLowerCase() === row.title.toLowerCase());
    const behavior=request.payload.matches.behavior;
    if (behavior === 'add-new') created++;
    else if (behavior === 'skip') { if (match.length) skipped++; else created++; }
    else { if (match.length) updated++; else skipped++; }
  }
  return {created,updated,skipped,rejected:0,affected:created+updated,
    columnsCreated:request.payload.newColumns.length,
    groupsCreated:request.payload.group.action==='create'?1:0};
};
const coordinator = {
  scope:'m144-qa',get active(){return Boolean(document.querySelector('[data-board-import-wizard]'));},
  get topId(){return null;},
  open:()=>true,release:()=>{},closeTop:()=>false,closeAll:()=>{},snapshot:()=>[],dispose:()=>{},
} as unknown as OverlayManager;
const wizard=createBoardImportWizardUi({
  getBoard:()=>board, canEdit:()=>canEdit,
  toast:(message)=>{toasts.push(message);},
  escapeHtml:(value)=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'),
  overlayCoordinator:coordinator,
  openExistingImporter:()=>{classicCount++;},
  commitWizard:async(request)=>{
    calls.push(request);
    if(serverMode==='reject') throw new Error('Controlled isolated RPC failure');
    if(serverMode==='pending') return await new Promise((resolve,reject)=>{pendingResolve=resolve;pendingReject=reject;});
    return resultFor(request);
  },
  reloadBoard:async()=>{refreshCount++;},
});
const qa = {
  open:()=>wizard.open(),
  setEdit:(value:boolean)=>{canEdit=value;},
  setMode:(value:'success'|'reject'|'pending')=>{serverMode=value;},
  mutateVersion:()=>{board={...board,board:{...board.board,updated_at:'2026-10-13T03:01:00.000Z'}} as BoardEnvelope;},
  resolve:()=>{const cb=pendingResolve;pendingResolve=null;pendingReject=null;if(cb&&calls.length)cb(resultFor(calls[calls.length-1]!));},
  reject:()=>{const cb=pendingReject;pendingResolve=null;pendingReject=null;cb?.(new Error('Connection uncertain'));},
  get calls(){return calls;},get toasts(){return toasts;},get refreshCount(){return refreshCount;},get classicCount(){return classicCount;},
};
(window as unknown as Window & { __m144: typeof qa }).__m144=qa;
document.querySelector<HTMLButtonElement>('#launch')!.addEventListener('click',()=>qa.open());
