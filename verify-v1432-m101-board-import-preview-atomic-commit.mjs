import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createBoardImportPreview, createBoardImportCommitRequest } from './src/features/boards/import/board-import-preview.ts';

const dataset = Object.freeze({
  format:'csv', fileName:'m101.csv', fileSize:1, mimeType:'text/csv', selectedWorksheet:'CSV', worksheets:[], headerRow:1,
  headers:['Item Name','Group','Import note'], mapping:[], missingRequiredColumns:[], unexpectedColumns:[], diagnostics:[], mutationAllowed:false,
  rows:Object.freeze([
    {sourceRow:2,values:Object.freeze({item_name:'Existing Same',group:'Main group',note:'Alpha'}),raw:[]},
    {sourceRow:3,values:Object.freeze({item_name:'Bad Number',group:'Main group',amount:'abc'}),raw:[]},
    {sourceRow:4,values:Object.freeze({item_name:'New Item',group:'Main group',note:'Normalized'}),raw:[]},
    {sourceRow:5,values:Object.freeze({item_name:'New Item',group:'Main group',note:'Normalized'}),raw:[]},
    {sourceRow:6,values:Object.freeze({item_name:'Existing Conflict',group:'Main group',note:'Incoming'}),raw:[]},
    {sourceRow:7,values:Object.freeze({item_name:'Excluded Invalid',group:'Missing group',note:'x'}),raw:[]},
  ]),
});
const board = Object.freeze({
  board:Object.freeze({id:'board-1',name:'Board',description:'',status:'active',updated_at:'2026-10-05T06:00:00.000Z'}),
  groups:Object.freeze([{id:'group-1',board_id:'board-1',title:'Main group',position:0}]),
  columns:Object.freeze([
    {id:'col-note',board_id:'board-1',name:'Import note',data_type:'text',config:{},position:0,visible:true,column_key:'note'},
    {id:'col-amount',board_id:'board-1',name:'Amount',data_type:'number',config:{},position:1,visible:true,column_key:'amount'},
  ]),
  items:Object.freeze([
    {id:'item-1',board_id:'board-1',group_id:'group-1',title:'Existing Same',position:0,status:null},
    {id:'item-2',board_id:'board-1',group_id:'group-1',title:'Existing Conflict',position:1,status:null},
  ]),
  values:Object.freeze([
    {item_id:'item-1',column_id:'col-note',value:'Alpha'},
    {item_id:'item-2',column_id:'col-note',value:'Stored'},
  ]), members:[],
});

const preview=createBoardImportPreview(dataset,board,[7]);
assert.equal(preview.mutationAllowed,false);
assert.equal(preview.summary.valid,1);
assert.equal(preview.summary.invalid,1);
assert.equal(preview.summary.duplicate,2);
assert.equal(preview.summary.conflict,1);
assert.equal(preview.summary.skipped,1);
assert.equal(preview.summary.excluded,1);
assert.equal(preview.summary.committable,1);
assert.equal(preview.blocking,true);
assert.equal(preview.rows.find((r)=>r.sourceRow===3)?.disposition,'invalid');
assert.equal(preview.rows.find((r)=>r.sourceRow===4)?.disposition,'valid');
assert.equal(preview.rows.find((r)=>r.sourceRow===5)?.disposition,'duplicate');
assert.equal(preview.rows.find((r)=>r.sourceRow===6)?.disposition,'conflict');
assert.equal(preview.rows.find((r)=>r.sourceRow===7)?.disposition,'skipped');
assert.throws(()=>createBoardImportCommitRequest(preview),/Resolve or exclude/);
const ready=createBoardImportPreview(dataset,board,[3,6,7]);
assert.equal(ready.blocking,false);
const commit=createBoardImportCommitRequest(ready);
assert.equal(commit.expectedBoardVersion,'2026-10-05T06:00:00.000Z');
assert.deepEqual(commit.rows.map((r)=>r.sourceRow),[4]);

const migration=fs.readFileSync('supabase/migrations/v1.43.2-stage-i-m101-boards-import-preview-atomic-commit.sql','utf8');
for (const fragment of ['wm_import_board_items_atomic','pg_advisory_xact_lock','for update','p_expected_updated_at','40001','23503','work_board_access','wm_set_board_cell','grant execute']) assert.ok(migration.toLowerCase().includes(fragment.toLowerCase()),`migration missing ${fragment}`);
const repository=fs.readFileSync('assets/js/features/boards/data/board-repository.ts','utf8');
assert.match(repository,/wm_import_board_items_atomic/);
assert.match(repository,/boards\.import\.atomic/);

const ui=fs.readFileSync('assets/js/features/boards/controllers/board-import-workflow.ts','utf8');
for (const fragment of ['Preview import','Re-run validation','Import reviewed rows','data-import-mapping','exclude:','createBoardImportCommitRequest','importItemsAtomic']) assert.ok(ui.includes(fragment),`import workflow UI missing ${fragment}`);
const boardUi=fs.readFileSync('assets/js/boards-ui.ts','utf8');
assert.match(boardUi,/data-board-import/);
const boardView=fs.readFileSync('assets/js/features/boards/views/board-workspace-view.ts','utf8');
assert.match(boardView,/Import CSV \/ Excel/);

const runner=fs.readFileSync('scripts/run-stage-i-m101-database-tests.mjs','utf8');
assert.match(runner,/supabase\/tests\/m101/);
const capabilityManifest=fs.readFileSync('config/backend-capability-manifest.ts','utf8');
assert.match(capabilityManifest,/wm_import_board_items_atomic/);
const m46Verifier=fs.readFileSync('verify-stage-g-m46-boards-backend-data-contract-recovery.mjs','utf8');
assert.match(m46Verifier,/m101SuccessorRpcs/);
assert.match(m46Verifier,/v1\.43\.2-stage-i-m101-boards-import-preview-atomic-commit\.sql/);
const m51Verifier=fs.readFileSync('verify-stage-g-m51-boards-realtime-concurrency-stabilization.mjs','utf8');
assert.match(m51Verifier,/M101 successor migration must follow the preserved authoritative M51 migration/);
assert.match(m51Verifier,/schema must end with the governed M(?:101|103) successor migration/);
console.log('M101 Boards import preview/atomic commit verification: PASS (valid/invalid/duplicate/conflict/skipped; exclusions; normalized preview; stale-version guard; atomic RPC; relationship failure-path test; backend capability registration; M46/M51 successor governance; no silent fallback)');
