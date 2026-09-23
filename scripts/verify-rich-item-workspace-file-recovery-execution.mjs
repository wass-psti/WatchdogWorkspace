import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createBoardViewState } from '../assets/js/features/boards/board-state.ts';
import { createItemWorkspaceRuntime } from '../assets/js/features/boards/services/item-workspace-runtime.ts';
const root=path.resolve(import.meta.dirname,'..');
const state=createBoardViewState();
state.board={board:{id:'board-1',name:'Board',description:'',status:'active'},groups:[{id:'group-1',board_id:'board-1',title:'Group',position:0}],items:[{id:'item-1',board_id:'board-1',group_id:'group-1',title:'Item',position:0,status:null}],columns:[],values:[],members:[]};
const calls=[];
let envelope={permissions:{can_edit:true,can_comment:true,can_attach:true,can_manage:false},updates:[],files:[{id:'file-1',item_id:'item-1',file_name:'spec.pdf',storage_path:'board-1/item-1/spec.pdf',size_bytes:10,created_by:'u1',author_id:'u1',author_name:'Editor',created_at:'2026-09-22T00:00:00Z',can_delete:true}],activity:[]};
const service={
 getItemWorkspace:async()=>structuredClone(envelope),
 addItemUpdate:async(id,body)=>{calls.push(['update',id,body]);envelope={...envelope,updates:[{id:'1',body,created_by:'u1',author_id:'u1',author_name:'Editor',created_at:'2026-09-22T00:00:00Z',can_delete:true}]};},
 uploadItemFile:async(board,item,file)=>{calls.push(['upload',board,item,file.name]);return 'file-2';},
 deleteItemUpdate:async(id)=>calls.push(['delete-update',id]),
 openItemFile:async(file)=>calls.push(['open',file.id]),
 downloadItemFile:async(file)=>calls.push(['download',file.id]),
 deleteItemFile:async(file)=>calls.push(['delete-file',file.id]),
};
const runtime=createItemWorkspaceRuntime({state,service});
runtime.open('item-1');
await runtime.load('item-1',{quiet:true});
assert.equal(state.itemPanel.data.permissions.can_edit,true);
assert.equal(await runtime.postUpdate('Decision: M50'),true);
assert.deepEqual(calls[0],['update','item-1','Decision: M50']);
const file=new File(['x'],'a.txt',{type:'text/plain'});
assert.equal(await runtime.uploadFiles([file]),1);
assert.ok(calls.some((x)=>x[0]==='upload'));
assert.equal(await runtime.openFile('file-1'),true);
assert.equal(await runtime.downloadFile('file-1'),true);
assert.equal(await runtime.deleteFile('file-1'),true);
envelope={...envelope,files:[{...envelope.files[0],id:7}]};
await runtime.load('item-1',{quiet:true});
assert.equal(await runtime.openFile('7'),true);
assert.equal(await runtime.downloadFile('7'),true);
assert.equal(await runtime.deleteFile('7'),true);
envelope={...envelope,permissions:{can_edit:false,can_comment:false,can_attach:false,can_manage:false}};
await runtime.load('item-1',{quiet:true});
await assert.rejects(()=>runtime.postUpdate('Blocked'),/Board edit access/);
await assert.rejects(()=>runtime.uploadFiles([file]),/Board edit access/);
const repo=fs.readFileSync(path.join(root,'assets/js/features/boards/data/board-repository.ts'),'utf8');
assert.ok(repo.indexOf("backend.storageDelete('work-board-files', canonicalPath")<repo.indexOf("rpc('wm_delete_board_item_file', { p_file_id: current.id })"));
assert.match(repo,/attempt < 2/);
assert.match(repo,/authoritative\.files\.find\(\(entry\) => entry\.storage_path === storagePath\)/);
assert.match(repo,/BOARD_FILE_REGISTRATION_RECONCILIATION_PENDING/);
assert.match(repo,/anchor\.download/);
const migration=fs.readFileSync(path.join(root,'supabase/migrations/v1.43.2-stage-g-m50-rich-item-workspace-file-recovery.sql'),'utf8');
assert.match(migration,/work_board_access\(bid,'edit'\)/);
assert.match(migration,/o\.owner_id=auth\.uid\(\)::text/);
assert.match(migration,/Remove Board item files and pending Storage objects before permanently deleting the board/);
assert.match(migration,/Remove item files and pending Storage objects before permanently deleting the item/);
console.log('Stage G M50 Rich Item Workspace & File Recovery deterministic verification: PASS (runtime permissions, normalized file identity, update/file lifecycle, retry reconciliation, download, storage-first delete)');
