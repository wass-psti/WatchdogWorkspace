import { readFile } from 'node:fs/promises';
const target=await readFile(new URL('../config/stage-f-m35-final-legacy-deletion-target.ts',import.meta.url),'utf8');
const state=target.match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
console.log(`Stage F M35 Final legacy deletion status: ${state}`);
console.log('Architecture: 43');
console.log('Deleted: M3 legacy composition identity, dead imperative shell serializer, expired M33 SKIP_WAITING alias');
console.log('Retained: authoritative typed route runtime, three M26 iframe islands, M34 recovery readers, historical audit evidence');
console.log('Historical verifier synchronization: M24/M31 ECharts + React-owned Shell + M34 guarded Settings/backup restore');
console.log('Certification rule: full npm run check must reach "Work Management project verification: PASS" before activation');

console.log('M35 historical verifier collect-all preflight: npm run verify:historical-all');
