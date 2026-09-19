import fs from 'node:fs';
const read=(file)=>fs.readFileSync(file,'utf8');
const target=read('config/stage-g-m47-boards-table-group-item-recovery-target.ts');
const state=target.match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
const arch=read('config/application-manifest.ts').match(/architectureVersion:\s*(\d+)/)?.[1]??'unknown';
console.log(`Stage G M47 Boards Table / Group / Item Recovery status: ${state}`);
console.log(`Architecture: ${arch}`);
console.log('M46 Board backend contract: retained 40-RPC authority.');
console.log('M47 semantic authority: 1.43.2-m47-v1 table/group/item ordering, mutation security, and persistence invariants.');
