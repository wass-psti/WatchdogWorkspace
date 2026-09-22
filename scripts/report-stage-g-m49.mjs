import fs from 'node:fs';
const read=(file)=>fs.readFileSync(file,'utf8');
const target=read('config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts');
const state=target.match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
const arch=read('config/application-manifest.ts').match(/architectureVersion:\s*(\d+)/)?.[1]??'unknown';
console.log(`Stage G M49 Boards Kanban & Drag/Drop Recovery status: ${state}`);
console.log(`Architecture: ${arch}`);
console.log('M46/M47 Board backend contract: retained; no M49 schema/RPC/RLS migration.');
console.log('M49 semantic authority: canonical Kanban lanes, status-only movement, rollback-safe item/structure ordering, keyboard movement, serialized Table/Kanban switching, and pending-transaction concurrency guards.');
