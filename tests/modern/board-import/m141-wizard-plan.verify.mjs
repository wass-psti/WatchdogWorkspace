import assert from 'node:assert/strict';
import { planBoardImportWizard } from '../../../src/features/boards/import/board-import-wizard-plan.ts';

const columns = Object.freeze([
  {id:'c-location',name:'Location', data_type:'text',config:{},position:0},
  {id:'c-status',name:'Status', data_type:'status',config:{labels:[]},position:1},
]);
const board={
  board:{id:'board-1',name:'Board',updated_at:'2026-10-12T12:00:00.000Z'},
  groups:[{id:'g1',title:'Current',position:0}],
  columns,
  items:[{id:'i1',group_id:'g1',title:'Existing'},{id:'i2',group_id:'g1',title:'Another'}],
  values:[{item_id:'i1',column_id:'c-location',value:'Manila'},{item_id:'i2',column_id:'c-location',value:'Cebu'}],
};
const dataset={
  fileName:'import.xlsx',selectedWorksheet:'Sheet1',headers:['Name','Status','Location'],diagnostics:[],
  rows:[{sourceRow:2,raw:['Existing','Done','Manila']},{sourceRow:3,raw:['New','Open','Quezon']}],
};
const mk=(changes={})=>({
  sourceWorksheet:'Sheet1',
  mappings:[
    {source:'Name',action:'item'},
    {source:'Status',action:'create',name:'Imported Status',columnType:'status'},
    {source:'Location',action:'existing',columnId:'c-location'},
  ],
  group:{action:'existing',groupId:'g1'},
  matches:{behavior:'skip',matchColumnId:'item'},
  ...changes,
});
let checks=0;
const check=(name, action)=>{action();checks++; console.log('PASS:',name);};
check('read-only plan matches and skips existing Item by name',()=>{
 const x=planBoardImportWizard(dataset,board,mk());
 assert.equal(x.configurationValid,true);assert.equal(x.mutationAllowed,false);
 assert.equal(x.plannedColumnCount,1);assert.equal(x.mappedColumnCount,2);assert.equal(x.excludedColumnCount,0);
 assert.deepEqual(x.decisions.map(r=>r.decision),['skip','create']);
 assert.equal(x.decisions[0].existingItemId,'i1');
});
check('update matches existing column values and leaves unmatched row out',()=>{
 const x=planBoardImportWizard(dataset,board,mk({matches:{behavior:'update',matchColumnId:'c-location'}}));
 assert.equal(x.configurationValid,true);assert.deepEqual(x.decisions.map(r=>r.decision),['update','skip']);
 assert(x.cautions.some(c=>c.code==='WIZARD_UPDATE_REQUIRES_CONCURRENCY'));
});
check('missing matching-column choice fails closed',()=>{
 const x=planBoardImportWizard(dataset,board,mk({matches:{behavior:'skip',matchColumnId:'not-mapped'}}));
 assert.equal(x.configurationValid,false);assert(x.errors.some(e=>e.code==='WIZARD_MATCH_MAPPING_REQUIRED'));
});
check('bulk create skips no columns and never commits',()=>{
 const x=planBoardImportWizard(dataset,board,mk({group:{action:'create',name:'New Group'},matches:{behavior:'add-new'}}));
 assert.equal(x.configurationValid,true); assert.equal(x.requiresExtendedBackend,true); assert.equal(x.mutationAllowed,false);
 assert.deepEqual(x.decisions.map(r=>r.decision),['create','create']);
});
check('duplicate source header cannot be silently remapped',()=>{
 const x=planBoardImportWizard({...dataset,headers:['Name','NAME','Location']},board,mk());
 assert.equal(x.configurationValid,false);assert(x.errors.some(e=>e.code==='WIZARD_DUPLICATE_SOURCE_HEADER'));
});
check('duplicate mapping target prohibited',()=>{
 const x=planBoardImportWizard(dataset,board,mk({mappings:[{source:'Name',action:'item'},{source:'Status',action:'existing',columnId:'c-location'},{source:'Location',action:'existing',columnId:'c-location'}]}));
 assert(x.errors.some(e=>e.code==='WIZARD_TARGET_MAPPED_TWICE'));
});
check('ambiguous target values fail closed',()=>{
 const b={...board,items:[...board.items,{id:'i3',group_id:'g1',title:'Existing'}]};
 const x=planBoardImportWizard(dataset,b,mk());
 assert.equal(x.configurationValid,false);assert.equal(x.decisions[0].decision,'blocked');
 assert(x.errors.some(e=>e.code==='WIZARD_MATCH_TARGET_AMBIGUOUS'));
});
check('source duplicate keys fail closed',()=>{
 const d={...dataset,rows:[...dataset.rows,{sourceRow:4,raw:['NEW','Open','Cebu']}]};
 const x=planBoardImportWizard(d,board,mk());
 assert(x.errors.some(e=>e.code==='WIZARD_MATCH_SOURCE_AMBIGUOUS'));
 assert.equal(x.decisions[2].decision,'blocked');
});
check('new column name collision fails closed',()=>{
 const m=mk();const x=planBoardImportWizard(dataset,board,{...m,mappings:m.mappings.map(c=>c.action==='create'?{...c,name:'Location'}:c)});
 assert(x.errors.some(e=>e.code==='WIZARD_COLUMN_NAME_COLLISION'));
});
check('new group cannot update existing items',()=>{
 const x=planBoardImportWizard(dataset,board,mk({group:{action:'create',name:'New Group'},matches:{behavior:'update',matchColumnId:'item'}}));
 assert(x.errors.some(e=>e.code==='WIZARD_UPDATE_NEW_GROUP'));
});
check('worksheet mismatch invalidates preview',()=>{
 const x=planBoardImportWizard(dataset,board,mk({sourceWorksheet:'Other'}));
 assert(x.errors.some(e=>e.code==='WIZARD_WORKSHEET_CHANGED'));
});
check('status creation requires manual option approval',()=>{
 const x=planBoardImportWizard(dataset,board,mk());
 assert(x.cautions.some(e=>e.code==='WIZARD_COLUMN_OPTIONS_REQUIRE_APPROVAL'));
});
check('blank item name blocks row',()=>{
 const d={...dataset,rows:[{sourceRow:2,raw:['','Done','Manila']}]};
 const x=planBoardImportWizard(d,board,mk());
 assert(x.errors.some(e=>e.code==='WIZARD_ITEM_NAME_INVALID'));
 assert.equal(x.decisions[0].decision,'blocked');
});
console.log(`M141 pure-plan deterministic tests: ${checks} PASS`);
