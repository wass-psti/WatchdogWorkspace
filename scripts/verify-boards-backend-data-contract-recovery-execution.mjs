import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertBoardEnvelope,assertWorkspaceEnvelope,mapBoardList } from '../assets/js/features/boards/data/board-contracts.ts';
import { M46_BOARD_BACKEND_CONTRACT,M46_BOARD_CONTRACT_DIGEST,M46_BOARD_CONTRACT_VERSION } from '../config/stage-g-m46-board-backend-contract.ts';

const root=process.cwd();
const read=(path)=>readFileSync(resolve(root,path),'utf8');
const repo=read('assets/js/features/boards/data/board-repository.ts');
const preflight=read('assets/js/platform/data/backend-capability-preflight.ts');
const migration=read('supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql');

assert.equal(M46_BOARD_CONTRACT_VERSION,'1.43.2-m46-v1');
assert.match(M46_BOARD_CONTRACT_DIGEST,/^[a-f0-9]{64}$/);
assert.equal(M46_BOARD_BACKEND_CONTRACT.rpcs.length,40);
assert.equal(M46_BOARD_BACKEND_CONTRACT.tables.length,9);
assert.equal(M46_BOARD_BACKEND_CONTRACT.realtime.functions.length,2);
assert.equal(M46_BOARD_BACKEND_CONTRACT.realtime.policies.length,2);
assert.equal(M46_BOARD_BACKEND_CONTRACT.realtime.triggers.length,8);
assert(M46_BOARD_BACKEND_CONTRACT.tables.every((table)=>Array.isArray(table.policies)&&table.policies.length===0));
assert.throws(()=>mapBoardList([{id:'b1',name:'   ',status:'active'}]),/Invalid name/);
assert.throws(()=>assertBoardEnvelope({board:{id:'b1',name:'B',status:'active'},groups:[{id:'g1',board_id:'b1',title:'   '}],items:[],columns:[],values:[],members:[]}),/Invalid title/);
assert.throws(()=>assertBoardEnvelope({board:{id:'b1',name:'B',status:'active'},groups:[],items:[],columns:[{id:'c1',board_id:'b1',name:' ',data_type:'text'}],values:[],members:[]}),/Invalid name/);
const workspace=assertWorkspaceEnvelope({
  updates:[{id:1,body:'legacy',created_by:'user-legacy',can_delete:true}],
  files:[{id:'f1',storage_path:'b/i/file',created_by:'user-file',can_delete:true}],
  activity:[{id:2,event_type:'item.updated',message:'updated',actor_id:'user-actor',payload:{}}],
},'item-1');
assert.equal(workspace.updates[0].author_id,'user-legacy');
assert.equal(workspace.files[0].author_id,'user-file');
assert.equal(workspace.activity[0].actor_id,'user-actor');
assert(repo.includes("[boardListQueryPrefix(auth.user?.id), key('board'), key('preferences'), key('item-workspace'), key('events')]"));
assert(repo.includes('queries.removeQueries(scope())')&&!repo.includes('clearCache: () => queries.clear()'));
const remove=repo.slice(repo.indexOf('async function removeItemFile'),repo.indexOf('\n  const repository:'));
const legacyMetadataFirst=remove.indexOf("rpc('wm_delete_board_item_file'")>=0&&remove.indexOf("rpc('wm_delete_board_item_file'")<remove.indexOf('backend.storageDelete')&&remove.includes('BOARD_FILE_STORAGE_CLEANUP_PENDING');
const m50StorageFirst=remove.indexOf('backend.storageDelete')>=0&&remove.indexOf('backend.storageDelete')<remove.indexOf("rpc('wm_delete_board_item_file'")&&remove.includes('BOARD_FILE_METADATA_FINALIZE_PENDING');
assert(legacyMetadataFirst||m50StorageFirst);
assert(preflight.includes('wm_board_contract_attestation')&&preflight.includes('attestation.compatible!==true'));
assert(migration.includes(`'contract_digest','${M46_BOARD_CONTRACT_DIGEST}'`)&&migration.includes("'rpc_count',rpc_ok_count")&&migration.includes("'direct_privilege_violations',privilege_violations"));
assert(migration.includes("set search_path=''")&&migration.includes('public.work_board_realtime_topic_access')&&migration.includes('public.work_board_realtime_broadcast_change')&&migration.includes('realtime.send('));
assert(migration.includes('actual_column_count=jsonb_array_length')&&migration.includes("c.column_name=req.column_contract->>'name'"),'Table contract must be exact-set and independent of physical column order.');
assert(migration.includes("'board_table_policy_count',board_table_policy_count")&&migration.includes("'realtime_function_count',realtime_function_count"));
assert(migration.includes("'private_board_realtime',true"));
console.log('Stage G M46 Boards Backend & Data Contract Recovery deterministic verification: PASS (checks=26)');
