import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const release = process.argv.includes('--release');
const targetFile = path.join(root, 'config/stage-b-m9-client-state-target.ts');
const m8File = path.join(root, 'config/stage-b-m8-tanstack-query-target.ts');

const readState = (file) => fs.readFileSync(file, 'utf8').match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const setState = (state) => {
  const source = fs.readFileSync(targetFile, 'utf8');
  fs.writeFileSync(targetFile, source.replace(/activationState:\s*'[^']+'/, `activationState: '${state}'`));
};
const run = (script, label) => {
  console.log(`\n== ${label} ==`);
  const result = spawnSync('npm', ['run', script], { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
};

if (process.version !== 'v22.16.0') throw new Error(`M9 certification requires Node v22.16.0; current runtime is ${process.version}.`);
if (readState(m8File) !== 'active-certified') {
  setState('blocked-pending-m8-certification');
  throw new Error('M9 requires Stage B M8 to be active-certified before client-state promotion.');
}
if (readState(targetFile) === 'blocked-pending-m8-certification') setState('implementation-complete-pending-certification');

run('governance:restore', 'Synchronize repository governance artifacts');
run('dependencies:ensure', 'Ensure exact lockfile dependencies');
run('governance:check', 'Package governance gate');
run('security:check', 'Security baseline gate');
run('react:check', 'React composition boundary gate');
run('design-system:check', 'M4 design-system gate');
run('governance:sync-check', 'Stage B governance synchronization gate');
run('corrective:check', 'M4 corrective integrity gate');
run('vendor-types:check', 'M4 vendor declaration compatibility gate');
run('csp-dist:check', 'M4 production CSP serialization gate');
run('interactions:check', 'M5 primitive interaction gate');
run('runtime-schemas:check', 'M6 runtime-schema gate');
run('supabase-client:check', 'M7 Supabase client adapter gate');
run('tanstack-query:check', 'M8 TanStack Query migration gate');
run('client-state:check', 'M9 client-state ownership gate');
run('lint:eslint', 'Governed ESLint gate');
run('typecheck', 'TypeScript verification against M9 client-state authority');

setState('active-pending-release-certification');
run('client-state:check', 'M9 active client-state authority gate');
run('typecheck', 'TypeScript revalidation with active M9 client-state authority');

if (release) {
  run('audit:ci', 'High-severity dependency audit');
  run('release:check', 'Complete production release gate');
  setState('active-certified');
  run('client-state:check', 'Final M9 certified-state gate');
}

console.log(`\nStage B M9 activation workflow complete for this run. Current state: ${readState(targetFile)}`);
if (!release) console.log('Run `npm run client-state:activate:release` to complete production release certification.');
