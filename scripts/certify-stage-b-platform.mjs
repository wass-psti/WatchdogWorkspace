import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const run = (command, args, label) => {
  console.log(`\n================ ${label} ================`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
};
const readState = (file) => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const match = source.match(/activationState:\s*'([^']+)'/);
  if (!match) throw new Error(`Unable to read activation state from ${file}.`);
  return match[1];
};

if (process.version !== 'v22.16.0') {
  throw new Error(`Stage B certification requires Node v22.16.0; current runtime is ${process.version}. Run \`nvm use\` first.`);
}
run('npm', ['--version'], 'npm toolchain visibility');
run('npm', ['run', 'governance:restore'], 'Synchronize governed repository artifacts');
run('npm', ['run', 'dependencies:ensure'], 'Ensure exact lockfile dependencies');
run('npm', ['run', 'governance:check'], 'Governance baseline');
run('npm', ['run', 'security:check'], 'Security baseline');
run('npm', ['run', 'csp-dist:check'], 'CSP serialization regression');

let m4 = readState('config/stage-b-m4-design-system-target.ts');
if (m4 !== 'active-certified') {
  run('npm', ['run', 'design-system:activate:release'], 'Activate and release-certify M4');
  m4 = readState('config/stage-b-m4-design-system-target.ts');
}
if (m4 !== 'active-certified') throw new Error(`M4 did not reach active-certified; current state is ${m4}.`);
run('npm', ['run', 'design-system:status'], 'M4 final status');

let m5 = readState('config/stage-b-m5-interaction-target.ts');
if (m5 !== 'active-certified') {
  run('npm', ['run', 'interactions:activate:release'], 'Activate and release-certify M5');
  m5 = readState('config/stage-b-m5-interaction-target.ts');
}
if (m5 !== 'active-certified') throw new Error(`M5 did not reach active-certified; current state is ${m5}.`);
run('npm', ['run', 'interactions:status'], 'M5 final status');

let m6 = readState('config/stage-b-m6-runtime-schema-target.ts');
if (m6 !== 'active-certified') {
  run('npm', ['run', 'runtime-schemas:activate:release'], 'Activate and release-certify M6');
  m6 = readState('config/stage-b-m6-runtime-schema-target.ts');
}
if (m6 !== 'active-certified') throw new Error(`M6 did not reach active-certified; current state is ${m6}.`);
run('npm', ['run', 'runtime-schemas:status'], 'M6 final status');

let m7 = readState('config/stage-b-m7-supabase-client-target.ts');
if (m7 !== 'active-certified') {
  run('npm', ['run', 'supabase-client:activate:release'], 'Activate and release-certify M7');
  m7 = readState('config/stage-b-m7-supabase-client-target.ts');
}
if (m7 !== 'active-certified') throw new Error(`M7 did not reach active-certified; current state is ${m7}.`);
run('npm', ['run', 'supabase-client:status'], 'M7 final status');

let m8 = readState('config/stage-b-m8-tanstack-query-target.ts');
if (m8 !== 'active-certified') {
  run('npm', ['run', 'tanstack-query:activate:release'], 'Activate and release-certify M8');
  m8 = readState('config/stage-b-m8-tanstack-query-target.ts');
}
if (m8 !== 'active-certified') throw new Error(`M8 did not reach active-certified; current state is ${m8}.`);
run('npm', ['run', 'tanstack-query:status'], 'M8 final status');

let m9 = readState('config/stage-b-m9-client-state-target.ts');
if (m9 !== 'active-certified') {
  run('npm', ['run', 'client-state:activate:release'], 'Activate and release-certify M9');
  m9 = readState('config/stage-b-m9-client-state-target.ts');
}
if (m9 !== 'active-certified') throw new Error(`M9 did not reach active-certified; current state is ${m9}.`);
run('npm', ['run', 'client-state:status'], 'M9 final status');

console.log('\nStage B platform certification: PASS');
console.log('M4 React Design System: active-certified');
console.log('M5 Primitive Interaction Architecture: active-certified');
console.log('M6 Runtime Schemas: active-certified');
console.log('M7 Supabase Client Adapter: active-certified');
console.log('M8 TanStack Query Migration: active-certified');
console.log('M9 Client-state Ownership Model: active-certified');
