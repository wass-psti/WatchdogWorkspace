import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createBoardImportSchema } from './src/features/boards/contracts/import.ts';
import { parseBoardImport } from './src/features/boards/import/board-import-parser.ts';
import { createBoardImportPreview, createBoardImportCommitRequest } from './src/features/boards/import/board-import-preview.ts';
import { exportBoard, createBoardPortableSpecification } from './src/features/boards/export/board-export.ts';

const boardId='a1030000-0000-4000-8000-000000000001';
const groupId='a1030000-0000-4000-8000-000000000002';
const alternateGroupId='a1030000-0000-4000-8000-000000000003';
const itemId='a1030000-0000-4000-8000-000000000004';
const personId='a1030000-0000-4000-8000-000000000005';
const nonMemberId='a1030000-0000-4000-8000-000000000006';
const itemVersion='2026-10-05T08:00:00.000Z';
const columns=[
  {id:'a1030000-0000-4000-8000-000000000010',board_id:boardId,name:'Date',data_type:'date',config:{},position:0,visible:true,column_key:'date_col'},
  {id:'a1030000-0000-4000-8000-000000000011',board_id:boardId,name:'Timeline',data_type:'timeline',config:{},position:1,visible:true,column_key:'timeline_col'},
  {id:'a1030000-0000-4000-8000-000000000012',board_id:boardId,name:'People',data_type:'people',config:{},position:2,visible:true,column_key:'people_col'},
  {id:'a1030000-0000-4000-8000-000000000013',board_id:boardId,name:'Text',data_type:'text',config:{},position:3,visible:true,column_key:'text_col'},
];
const board={
  board:{id:boardId,name:'M103 Board',description:'',status:'active',updated_at:'2026-10-05T08:30:00.000Z'},
  groups:[{id:groupId,board_id:boardId,title:'Main',position:0},{id:alternateGroupId,board_id:boardId,title:'Alternate',position:1}],
  items:[{id:itemId,board_id:boardId,group_id:groupId,title:'Existing',position:0,status:null,updated_at:itemVersion}],
  columns,
  values:[{item_id:itemId,column_id:columns[3].id,value:'Stored'}],
  members:[{user_id:personId,role:'member'}],
};
const dataset=(rows)=>({format:'csv',fileName:'m103.csv',fileSize:1,mimeType:'text/csv',selectedWorksheet:'CSV',worksheets:[{name:'CSV',index:0,hidden:false,rowCount:rows.length+1,columnCount:8}],headerRow:1,headers:['Item ID','Item Name','Item Updated At','Group ID','Group','Date','Timeline','People','Text'],mapping:[],missingRequiredColumns:[],unexpectedColumns:[],rows,diagnostics:[],mutationAllowed:false});
const row=(sourceRow,values)=>({sourceRow,values,raw:[]});

// Prompt 2 semantic parity: impossible date, reversed timeline, and non-member people are invalid before mutation.
for (const [key,value,expectedCode] of [
  ['date_col','2026-02-31','IMPORT_DATE_INVALID'],
  ['timeline_col','2026-10-31/2026-10-01','IMPORT_TIMELINE_ORDER_INVALID'],
  ['people_col',nonMemberId,'IMPORT_PEOPLE_RELATIONSHIP_INVALID'],
]) {
  const p=createBoardImportPreview(dataset([row(2,{item_name:'New',group:'Main',[key]:value})]),board);
  assert.equal(p.rows[0].disposition,'invalid',`${key} must fail before mutation`);
  const d=p.rows[0].diagnostics.find((entry)=>entry.code===expectedCode);
  assert(d,`${expectedCode} missing`);
  assert.equal(d.blocking,true);
  assert(d.field);
  assert(d.rule);
  assert.notEqual(d.importedValue,undefined);
  assert(d.expected);
}

// Unique portable Item ID is enforced within the import file with structured source evidence.
const repeatedId='a1030000-0000-4000-8000-000000000099';
const duplicateIdPreview=createBoardImportPreview(dataset([
  row(2,{item_id:repeatedId,item_name:'One',group:'Main'}),
  row(3,{item_id:repeatedId,item_name:'Two',group:'Main'}),
]),board);
const duplicateIdDiag=duplicateIdPreview.rows[1].diagnostics.find((entry)=>entry.code==='IMPORT_ITEM_ID_DUPLICATE');
assert.equal(duplicateIdPreview.rows[1].disposition,'invalid');
assert.equal(duplicateIdDiag?.duplicateSource?.row,2);
assert.equal(duplicateIdDiag?.rule,'item-id.unique');

// Bulk-edit re-import: current Item ID + current Item Updated At creates an explicit update operation.
const updatePreview=createBoardImportPreview(dataset([row(2,{item_id:itemId,item_name:'Existing edited',item_updated_at:itemVersion,group:'Alternate',text_col:'Changed'})]),board);
assert.equal(updatePreview.rows[0].disposition,'valid');
assert.equal(updatePreview.rows[0].operation,'update');
assert.equal(updatePreview.summary.updates,1);
const updateRequest=createBoardImportCommitRequest(updatePreview);
assert.equal(updateRequest.rows[0].operation,'update');
assert.equal(updateRequest.rows[0].itemId,itemId);
assert.equal(updateRequest.rows[0].expectedItemUpdatedAt,itemVersion);

const stalePreview=createBoardImportPreview(dataset([row(2,{item_id:itemId,item_name:'Existing edited',item_updated_at:'2026-10-05T07:59:59.000Z',group:'Alternate',text_col:'Changed'})]),board);
assert.equal(stalePreview.rows[0].disposition,'invalid');
assert(stalePreview.rows[0].diagnostics.some((entry)=>entry.code==='IMPORT_UPDATE_VERSION_STALE'&&entry.conflictSource?.itemId===itemId));

// Reconstruction: an exported row imported into a clean compatible board remains a create and preserves Item ID.
const exportBoardEnvelope={...board,items:[{...board.items[0],title:'Portable'}],values:[{item_id:itemId,column_id:columns[0].id,value:'2026-10-05'},{item_id:itemId,column_id:columns[1].id,value:{start:'2026-10-01',end:'2026-10-31'}},{item_id:itemId,column_id:columns[2].id,value:personId},{item_id:itemId,column_id:columns[3].id,value:'Portable text'}]};
const artifact=exportBoard(exportBoardEnvelope,'csv');
const toBuffer=(bytes)=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const parsed=await parseBoardImport({name:artifact.fileName,type:artifact.mimeType,size:artifact.bytes.length,arrayBuffer:async()=>toBuffer(artifact.bytes)},{schema:createBoardImportSchema(columns),allowUnexpectedColumns:false});
const cleanTarget={...board,board:{...board.board,id:boardId,name:'Clean target'},items:[],values:[]};
const reconstruction=createBoardImportPreview(parsed,cleanTarget);
assert.equal(reconstruction.rows[0].disposition,'valid');
assert.equal(reconstruction.rows[0].operation,'create');
const reconstructionRequest=createBoardImportCommitRequest(reconstruction);
assert.equal(reconstructionRequest.rows[0].itemId,itemId,'identifier-preserving create request must retain exported Item ID');
assert.equal(reconstructionRequest.rows[0].groupId,groupId,'existing compatible relationship ID must be preserved');
assert.equal(reconstructionRequest.rows[0].values.people_col,personId);
assert.deepEqual(reconstructionRequest.rows[0].values.timeline_col,{start:'2026-10-01',end:'2026-10-31'});

// Group-ID remapping by exact group name is deterministic when reconstructing into an equivalent board with new relationship IDs.
const remappedGroupId='a1030000-0000-4000-8000-000000000077';
const remappedTarget={...cleanTarget,groups:[{id:remappedGroupId,board_id:boardId,title:'Main',position:0},{id:alternateGroupId,board_id:boardId,title:'Alternate',position:1}]};
const remapped=createBoardImportPreview(parsed,remappedTarget);
assert.equal(remapped.rows[0].disposition,'valid');
assert.equal(remapped.rows[0].groupId,remappedGroupId);

// Completion summary contract is authoritative and review counts are part of the commit request.
const duplicateOnly=createBoardImportPreview(dataset([row(2,{item_name:'Existing',group:'Main',text_col:'Stored'})]),board);
assert.equal(createBoardImportCommitRequest(duplicateOnly).reviewSummary.skipped,1);
const repositorySource=fs.readFileSync('assets/js/features/boards/data/board-repository.ts','utf8');
assert.match(repositorySource,/request\.reviewSummary\.skipped \+ serverSkipped/);
assert.match(repositorySource,/affected !== created \+ updated/);
const ui=fs.readFileSync('assets/js/features/boards/controllers/board-import-workflow.ts','utf8');
for(const fragment of ['data-import-worksheet','Structured validation / conflict information','result.skipped','result.affected','Item Updated At']) assert(ui.includes(fragment),`UI missing ${fragment}`);

// Formal specification is synchronized with the authoritative rules.
const spec=createBoardPortableSpecification(exportBoardEnvelope);
assert.equal(spec.version,'1.1');
assert(spec.columns.some((entry)=>entry.key==='item_updated_at'&&entry.validation.includes('ISO-8601')));
assert(spec.columns.find((entry)=>entry.key==='date_col')?.validation.includes('real Gregorian'));
assert(spec.columns.find((entry)=>entry.key==='people_col')?.validation.includes('current Board member'));
assert(spec.columns.find((entry)=>entry.key==='timeline_col')?.validation.includes('end must be on or after start'));
assert(spec.updatePolicy.includes('compare-and-swap'));
const titleColumn={id:'a1030000-0000-4000-8000-000000000014',board_id:boardId,name:'Item',data_type:'text',config:{},position:-1,visible:true,column_key:'title',system_key:'title',required:true};
const titleSafeBoard={...exportBoardEnvelope,columns:[titleColumn,...columns]};
const titleSafeSpec=createBoardPortableSpecification(titleSafeBoard);
assert.equal(titleSafeSpec.columns.filter((entry)=>entry.key==='item_name').length,1);
assert(!titleSafeSpec.columns.some((entry)=>entry.key==='title'),'system title must not be exported as a second editable field');
assert(!createBoardImportSchema([titleColumn,...columns]).fields.some((entry)=>entry.key==='title'),'system title must map through Item Name only');

// Malformed XLS is rejected deterministically.
const corruptXls=new Uint8Array([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1,0,0,0,0,0,0,0,0]);
await assert.rejects(async()=>{ try { await parseBoardImport({name:'corrupt.xls',type:'application/vnd.ms-excel',size:corruptXls.length,arrayBuffer:async()=>toBuffer(corruptXls)},{schema:createBoardImportSchema(columns),allowUnexpectedColumns:false}); } catch (error) { assert.equal(error?.diagnostic?.code,'IMPORT_PARSE_FAILED'); throw error; } });

const migration=fs.readFileSync('supabase/migrations/v1.43.2-stage-i-m103-boards-import-export-contract-reconciliation.sql','utf8');
for(const fragment of ["operation not in ('create','update')",'expected_item_updated_at','current_item.updated_at is distinct from expected_item_updated_at','insert into public.work_board_items(id,board_id','updated_count := updated_count + 1','affected',"grant execute on function public.wm_import_board_items_atomic"]) assert(migration.toLowerCase().includes(fragment.toLowerCase()),`M103 migration missing ${fragment}`);

console.log('M103 Prompts 1-4 completion verification: PASS (semantic prevalidation parity; structured diagnostics; unique Item ID; worksheet UI; compare-and-swap bulk updates; identifier-preserving reconstruction; authoritative summary; malformed XLS; formal specification synchronization)');
