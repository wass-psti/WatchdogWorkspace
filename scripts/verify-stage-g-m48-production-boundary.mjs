import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const fail=(m)=>{throw new Error(`M48 production boundary verification failed: ${m}`);};
const target=read('config/stage-g-m48-boards-columns-cells-status-recovery-target.ts');
const manifest=read('config/application-manifest.ts');
const m47=read('config/stage-g-m47-boards-table-group-item-recovery-target.ts');
for(const token of [
  "mode: 'retained-m46-m47-no-schema-change-v1'",
  'migrationRequired: false', 'newRpcRequired: false', 'rlsChangeRequired: false',
  "retainedBackendContract: 'config/stage-g-m46-board-backend-contract.ts'",
  "retainedProductionVerifier: 'scripts/verify-stage-g-m47-production-invariants.mjs'",
]) if(!target.includes(token)) fail(`target boundary token missing: ${token}`);
if(!manifest.includes("boardColumnsCellsStatusBackendBoundary: 'retained-m46-m47-no-schema-change-v1'")) fail('manifest does not declare retained backend boundary');
if(!m47.includes("activationState: 'active-certified'")) fail('M47 prerequisite is not active-certified');
const forbidden=[];
for(const relative of ['supabase/migrations','supabase/deployments']){
  const dir=path.join(root,relative); if(!fs.existsSync(dir)) continue;
  for(const name of fs.readdirSync(dir,{recursive:true})) if(/m48|stage[_-]g[_-]m48/i.test(String(name))) forbidden.push(path.join(relative,String(name)));
}
if(forbidden.length) fail(`M48 must not ship a migration/deployment SQL path: ${forbidden.join(', ')}`);
for(const token of ['wm_add_board_column','wm_update_board_column','wm_move_board_column','wm_delete_board_column','wm_change_board_column_type','wm_set_board_cell','wm_set_board_status_labels']){
  if(!read('assets/js/features/boards/data/board-repository.ts').includes(token)) fail(`retained repository RPC missing: ${token}`);
}
console.log('Stage G M48 production boundary verification: PASS (retained M46/M47 schema/RPC/RLS authority; no M48 migration)');
