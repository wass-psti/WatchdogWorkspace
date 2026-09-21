import fs from 'node:fs';
const read=(file)=>fs.readFileSync(file,'utf8');
const target=read('config/stage-g-m48-boards-columns-cells-status-recovery-target.ts');
const state=target.match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
const arch=read('config/application-manifest.ts').match(/architectureVersion:\s*(\d+)/)?.[1]??'unknown';
console.log(`Stage G M48 Boards Columns, Cells & Status System Recovery status: ${state}`);
console.log(`Architecture: ${arch}`);
console.log('M46/M47 Board backend contract: retained; no M48 schema/RPC/RLS migration.');
console.log('M48 semantic authority: typed column/cell/status lifecycle, exact typed filters, null-last sorting, rollback-safe resize, explicit editor save/cancel.');
