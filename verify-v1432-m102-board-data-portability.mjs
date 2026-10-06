import assert from 'node:assert/strict';
import fs from 'node:fs';
import { exportBoard, createBoardPortableSpecification } from './src/features/boards/export/board-export.ts';
import { parseBoardImport } from './src/features/boards/import/board-import-parser.ts';
import { createBoardImportSchema } from './src/features/boards/contracts/import.ts';
import { createBoardImportPreview } from './src/features/boards/import/board-import-preview.ts';

const boardId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const groupId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const itemId='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const personId='11111111-1111-4111-8111-111111111111';
const col=(id,key,name,data_type,config={},required=false)=>({id,board_id:boardId,name,data_type,config,position:0,visible:true,column_key:key,required});
const columns=[
 col('00000000-0000-4000-8000-000000000001','text_col','Text','text'),
 col('00000000-0000-4000-8000-000000000002','long_col','Long','long_text'),
 col('00000000-0000-4000-8000-000000000003','number_col','Number','number'),
 col('00000000-0000-4000-8000-000000000004','status_col','Status','status',{labels:[{id:'todo',name:'To do',color:'#000',active:true,description:'',position:0}],default_label_id:'todo'}),
 col('00000000-0000-4000-8000-000000000005','dropdown_col','Dropdown','dropdown',{options:['A','B']}),
 col('00000000-0000-4000-8000-000000000006','date_col','Date','date'),
 col('00000000-0000-4000-8000-000000000007','people_col','People','people'),
 col('00000000-0000-4000-8000-000000000008','check_col','Check','checkbox'),
 col('00000000-0000-4000-8000-000000000009','timeline_col','Timeline','timeline'),
 col('00000000-0000-4000-8000-000000000010','email_col','Email','email'),
 col('00000000-0000-4000-8000-000000000011','url_col','URL','url'),
];
const values=['Hello','Line 1\nLine 2',12.5,'todo','A','2026-10-05',personId,true,{start:'2026-10-01',end:'2026-10-31'},'name@example.com','https://example.com/path'];
const board={board:{id:boardId,name:'Round Trip Board',description:'',status:'active',updated_at:'2026-10-05T07:00:00Z'},groups:[{id:groupId,board_id:boardId,title:'Main Group',position:0}],items:[{id:itemId,board_id:boardId,group_id:groupId,title:'Alpha, "quoted"',position:0,status:null,updated_at:'2026-10-05T07:00:00.000Z'}],columns,values:columns.map((c,i)=>({item_id:itemId,column_id:c.id,value:values[i]})),members:[{user_id:personId,role:'member'}]};
const spec=createBoardPortableSpecification(board);
assert.equal(spec.columns[0].header,'Item ID');
assert.equal(spec.columns[1].header,'Item Name');
assert.equal(spec.columns[2].header,'Item Updated At');
assert.equal(spec.columns[3].header,'Group ID');
assert.equal(spec.columns[4].header,'Group');
assert(spec.columns.some(c=>c.header==='timeline_col'&&c.format.includes('/')));
assert(!spec.columns.some(c=>['owner_id','workspace_id','created_by','updated_by','storage_path'].includes(c.header)));
for(const c of spec.columns){for(const k of ['header','required','dataType','format','unique','nullable','blankAllowed','maxLength','example','normalization','relationship','validation','duplicateBehavior']) assert(k in c,`spec field ${k} missing for ${c.header}`);}
const toBuffer=(bytes)=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
for(const format of ['csv','xlsx']){
 const artifact=exportBoard(board,format);
 assert(artifact.bytes.length>100);
 const dataset=await parseBoardImport({name:artifact.fileName,type:artifact.mimeType,size:artifact.bytes.length,arrayBuffer:async()=>toBuffer(artifact.bytes)},{schema:createBoardImportSchema(columns),allowUnexpectedColumns:false});
 assert.equal(dataset.diagnostics.filter(d=>d.severity==='error').length,0);
 const preview=createBoardImportPreview(dataset,board);
 assert.equal(preview.rows.length,1); assert.equal(preview.rows[0].disposition,'duplicate');
 const n=preview.rows[0].normalized;
 assert.equal(n.item_id,itemId); assert.equal(n.group_id,groupId); assert.equal(n.number_col,12.5); assert.equal(n.check_col,true); assert.deepEqual(n.timeline_col,{start:'2026-10-01',end:'2026-10-31'}); assert.equal(n.people_col,personId); assert.equal(n.status_col,'todo');
 const template=exportBoard(board,format,{template:true,includeExamples:true});
 const td=await parseBoardImport({name:template.fileName,type:template.mimeType,size:template.bytes.length,arrayBuffer:async()=>toBuffer(template.bytes)},{schema:createBoardImportSchema(columns),allowUnexpectedColumns:false});
 assert.equal(td.headers.join('|'),spec.columns.map(c=>c.header).join('|'));
}
const badCsv=new TextEncoder().encode('Item Name,Group,timeline_col\r\nBad,Main Group,not-a-range\r\n');
const bad=await parseBoardImport({name:'bad.csv',type:'text/csv',size:badCsv.length,arrayBuffer:async()=>toBuffer(badCsv)},{schema:createBoardImportSchema(columns),allowUnexpectedColumns:false});
assert.equal(createBoardImportPreview(bad,board).rows[0].disposition,'invalid');
assert(fs.existsSync('templates/boards/work-management-board-import-template.csv'));
assert(fs.existsSync('templates/boards/work-management-board-import-template.xlsx'));
assert(fs.existsSync('M102-BOARDS-IMPORT-EXPORT-SPECIFICATION.md'));
console.log('M102 Boards data portability verification: PASS (CSV/XLSX export; formal spec; templates; identifiers; timeline; type normalization; malformed input; round-trip duplicate safety; sensitive-field exclusion)');
