import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const release = process.argv.includes('--release');
const targetFile = path.join(root, 'config/stage-c-m14-command-shared-ui-target.ts');
const m13File = path.join(root, 'config/stage-c-m13-account-settings-user-management-target.ts');
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

if (process.version !== 'v22.16.0') throw new Error(`M14 certification requires Node v22.16.0; current runtime is ${process.version}.`);
if (readState(m13File) !== 'active-certified') {
  setState('blocked-pending-m13-certification');
  throw new Error('M14 requires Stage C M13 to be active-certified before Command Palette / Shared Application UI promotion.');
}
if (readState(targetFile) === 'blocked-pending-m13-certification') setState('implementation-complete-pending-certification');

for (const [script, label] of [
  ['governance:restore','Synchronize repository governance artifacts'],
  ['dependencies:ensure','Ensure exact lockfile dependencies'],
  ['governance:check','Package governance gate'],
  ['security:check','Security baseline gate'],
  ['react:check','React composition boundary gate'],
  ['design-system:check','M4 design-system gate'],
  ['governance:sync-check','Stage B governance synchronization gate'],
  ['corrective:check','M4 corrective integrity gate'],
  ['vendor-types:check','M4 vendor declaration compatibility gate'],
  ['csp-dist:check','M4 production CSP serialization gate'],
  ['interactions:check','M5 primitive interaction gate'],
  ['runtime-schemas:check','M6 runtime-schema gate'],
  ['supabase-client:check','M7 Supabase client adapter gate'],
  ['tanstack-query:check','M8 TanStack Query migration gate'],
  ['client-state:check','M9 client-state ownership gate'],
  ['react-shell:check','M10 React shell gate'],
  ['global-overlays:check','M11 global overlays gate'],
  ['authentication-ui:check','M12 Authentication UI gate'],
  ['account-settings-users:check','M13 Account / Settings / User Management gate'],
  ['shared-app-ui:check','M14 Command Palette / Shared Application UI gate'],
  ['lint:eslint','Governed ESLint gate'],
  ['typecheck','TypeScript verification against M14 shared UI authority'],
]) run(script, label);

setState('active-pending-release-certification');
run('shared-app-ui:check', 'M14 active shared UI authority gate');
run('typecheck', 'TypeScript revalidation with active M14 shared UI authority');

if (release) {
  run('audit:ci', 'High-severity dependency audit');
  run('release:check', 'Complete production release gate');
  setState('active-certified');
  run('shared-app-ui:check', 'Final M14 certified-state gate');
}
console.log(`\nStage C M14 activation workflow complete for this run. Current state: ${readState(targetFile)}`);
if (!release) console.log('Run `npm run shared-app-ui:activate:release` to complete production release certification.');
