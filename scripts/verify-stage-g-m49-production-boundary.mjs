import fs from 'node:fs'; import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'); const read=(p)=>fs.readFileSync(path.join(root,p),'utf8'); const fail=(m)=>{throw new Error(`M49 production boundary verification failed: ${m}`)};
const target=read('config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts'); const manifest=read('config/application-manifest.ts'); const m48=read('config/stage-g-m48-boards-columns-cells-status-recovery-target.ts');
for(const t of ["mode: 'retained-m46-m47-no-schema-change-v1'",'migrationRequired: false','newRpcRequired: false','rlsChangeRequired: false']) if(!target.includes(t)) fail(`missing target token ${t}`);
if(!manifest.includes("boardKanbanDragDropBackendBoundary: 'retained-m46-m47-no-schema-change-v1'")) fail('manifest backend boundary missing');
if(!m48.includes("activationState: 'active-certified'")) fail('M48 prerequisite is not active-certified');
for(const relative of ['supabase/migrations','supabase/deployments']){const dir=path.join(root,relative);if(!fs.existsSync(dir))continue;for(const name of fs.readdirSync(dir,{recursive:true}))if(/m49|stage[_-]g[_-]m49/i.test(String(name)))fail(`M49 must not ship database migration/deployment path: ${relative}/${name}`)}
const command=read('assets/js/features/boards/services/board-command-service.ts'); for(const token of ['moveItem','moveGroup','moveColumn','setView']) if(!command.includes(token)) fail(`retained command authority missing ${token}`);
const repo=read('assets/js/features/boards/data/board-repository.ts'); for(const token of ['wm_move_board_item','wm_move_board_group','wm_move_board_column','wm_set_board_view']) if(!repo.includes(token)) fail(`retained RPC missing ${token}`);
console.log('Stage G M49 production boundary verification: PASS (M48 prerequisite active-certified; retained M46/M47 backend; no M49 migration/RPC/RLS/grant)');
