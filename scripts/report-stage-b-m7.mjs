import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const target = read('config/stage-b-m7-supabase-client-target.ts');
const m6Target = read('config/stage-b-m6-runtime-schema-target.ts');
const manifest = read('config/application-manifest.ts');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const m6 = m6Target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const architecture = manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 'unknown';

console.log('Stage B Milestone 7 Supabase Client Adapter status');
console.log('----------------------------------------------------');
console.log(`M6 prerequisite state: ${m6}`);
console.log(`M7 activation state: ${state}`);
console.log('Adapter authority: assets/js/platform/data/supabase-client-adapter.ts');
console.log('Contract authority: src/platform/contracts/supabase-client.ts');
console.log(`Architecture version: ${architecture}`);
console.log('Supabase session authority: assets/js/core/auth.ts');
console.log('Database authorization authority: Supabase RLS/RPC policies');
if (state === 'active-certified') console.log('\nM7 Supabase client adapter architecture is release-certified.');
else if (state === 'active-pending-release-certification') console.log('\nM7 adapter authority is active; full release certification remains pending.');
else if (state === 'implementation-complete-pending-certification') console.log('\nM7 implementation is complete and ready for release certification.');
else console.log('\nM7 is blocked until M6 is release-certified.');
