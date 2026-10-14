import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createBoardImportWizardRpcRequest } from '../../../src/features/boards/import/board-import-wizard-commit.ts';
const boardId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const groupId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const itemId='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const cId='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ageId='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const updatedAt='2026-10-13T02:20:00.000Z';
const board = Object.freeze({
  board:{id:boardId,name:'Test',status:'active',updated_at:'2026-10-13T02:30:00.000Z'},
  columns:[{id:cId,board_id:boardId,name:'Memo',column_key:'memo',data_type:'text',config:{},position:1},
    {id:ageId,board_id:boardId,name:'Age',column_key:'age',data_type:'number',config:{},position:2}],
  groups:[{id:groupId,title:'Main',position:0}],
  items:[{id:itemId,title:'Existing',group_id:groupId,updated_at:updatedAt}],
  values:[{item_id:itemId,column_id:cId,value:'Old'}],members:[],
});
const makeDataset=(columns, values)=>({selectedWorksheet:'CSV',headers:columns,rows:values.map((row,i)=>({sourceRow:i+2,raw:row,values:{}})),diagnostics:[]});
const mappings=(extra=[])=>[{source:'Name',action:'item'},...extra];
const group={action:'existing',groupId};
const draft=(mapped,behavior={behavior:'add-new'})=>({sourceWorksheet:'CSV',group,mappings:mapped,matches:behavior});
let checks=0;
const test=(name,fn)=>{try{fn();console.log(`PASS: ${name}`);checks++;}catch(e){console.error(`FAIL: ${name}`);throw e;}};
test('add-new new text column produces typed atomic payload',()=>{
  const source=makeDataset(['Name','New note'],[['Alpha','Comment']]);
  const result=createBoardImportWizardRpcRequest(source,board,draft(mappings([{source:'New note',action:'create',name:'Details',columnType:'text'}])));
  assert.equal(result.boardId,boardId);
  assert.equal(result.payload.newColumns[0].name,'Details');
  assert.equal(result.payload.rows[0].values['New note'],'Comment');
  assert.equal(result.payload.contract,'m143-v1');
});
test('skip policy retains source row and matches by primary title',()=>{
  const source=makeDataset(['Name'],[['Existing'],['New']]);
  const result=createBoardImportWizardRpcRequest(source,board,draft(mappings(),{behavior:'skip',matchColumnId:'item'}));
  assert.equal(result.payload.rows.length,2);
  assert.equal(result.payload.matches.behavior,'skip');
});
test('update mode carries authoritative current item version',()=>{
  const source=makeDataset(['Name','Memo'],[['Existing','Updated']]);
  const result=createBoardImportWizardRpcRequest(source,board,draft(mappings([{source:'Memo',action:'existing',columnId:cId}]),{behavior:'update',matchColumnId:'item'}));
  assert.equal(result.payload.rows[0].expected_item_updated_at,updatedAt);
});
test('invalid number rejected before RPC construction',()=>{
  const source=makeDataset(['Name','Age'],[['Alpha','not-a-number']]);
  assert.throws(()=>createBoardImportWizardRpcRequest(source,board,draft(mappings([{source:'Age',action:'existing',columnId:ageId}]))),/Invalid decimal/);
});
test('missing approval blocks new status column',()=>{
  const source=makeDataset(['Name','Stage'],[['Alpha','Done']]);
  assert.throws(()=>createBoardImportWizardRpcRequest(source,board,draft(mappings([{source:'Stage',action:'create',name:'Stage',columnType:'status'}]))),/explicit options approval/);
});
test('80-character Board column maximum enforced',()=>{
  const source=makeDataset(['Name','Long'],[['Alpha','value']]);
  assert.throws(()=>createBoardImportWizardRpcRequest(source,board,draft(mappings([{source:'Long',action:'create',name:'x'.repeat(81),columnType:'text'}]))),/Correct import mapping|1–80/);
});
test('unmapped primary item blocked',()=>{
  const source=makeDataset(['Name'],[['Alpha']]);
  assert.throws(()=>createBoardImportWizardRpcRequest(source,board,draft([{source:'Name',action:'skip'}])),/Correct import mapping/);
});
test('duplicate match keys block skip policy',()=>{
  const source=makeDataset(['Name'],[['Existing'],['Existing']]);
  assert.throws(()=>createBoardImportWizardRpcRequest(source,board,draft(mappings(),{behavior:'skip',matchColumnId:'item'})),/Correct import mapping/);
});
test('new group update is forbidden',()=>{
  const source=makeDataset(['Name'],[['Existing']]);
  assert.throws(()=>createBoardImportWizardRpcRequest(source,board,{...draft(mappings(),{behavior:'update',matchColumnId:'item'}),group:{action:'create',name:'New Group'}}),/Correct import mapping/);
});
test('empty dataset fails closed',()=>{
  const source=makeDataset(['Name'],[]);
  assert.throws(()=>createBoardImportWizardRpcRequest(source,board,draft(mappings())),/1–5,000/);
});
test('SQL contract uses guarded single-transaction procedure',()=>{
  const sql=fs.readFileSync('supabase/m143/board_import_wizard_atomic_DRAFT.sql','utf8').toLowerCase();
  for(const clause of ['create or replace function public.wm_import_board_wizard_atomic',
    'security definer','auth.uid()','work_board_access(p_board_id,\'edit\')',
    'pg_advisory_xact_lock','for update','p_expected_updated_at','updated_at=version_expected',
    'wm_add_board_group','wm_add_board_column','wm_set_board_cell',
    "behavior='skip'", "behavior='update'",'grant execute on function public.wm_import_board_wizard_atomic',
    'raise exception','created_columns','created_groups'])assert(sql.includes(clause),`SQL missing: ${clause}`);
  assert(!/execute\s+(?:immediate|format\s*\()/i.test(sql),'dynamic SQL prohibited');
  assert(!sql.includes('service_role'),'no service key bypass');
});
console.log(`M143 contract and security preflight: ${checks}/${checks} PASS (not database execution)`);
