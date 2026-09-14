import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, 'config/stage-d-m15-react-board-presentation-facade-target.ts');
const release = process.argv.includes('--release');
const run = (script, label) => {
  console.log(`\n== ${label} ==`);
  const result = spawnSync('npm', ['run', script], { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
};
const readState = (file) => fs.readFileSync(path.join(root, file), 'utf8').match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const setState = (next) => {
  const source = fs.readFileSync(target, 'utf8');
  fs.writeFileSync(target, source.replace(/activationState:\s*'[^']+'/, `activationState: '${next}'`));
};
if (process.version !== 'v22.16.0') throw new Error(`M15 activation requires Node v22.16.0; current runtime is ${process.version}.`);
if (readState('config/stage-c-m14-command-shared-ui-target.ts') !== 'active-certified') throw new Error('M14 must remain active-certified before M15 activation.');
for (const [script, label] of [
  ['governance:restore','Synchronize repository governance artifacts'],
  ['dependencies:ensure','Ensure exact lockfile dependencies'],
  ['governance:check','Package governance gate'],
  ['security:check','Security baseline gate'],
  ['react:check','React composition boundary gate'],
  ['design-system:check','M4 design-system gate'],
  ['interactions:check','M5 interaction gate'],
  ['runtime-schemas:check','M6 runtime-schema gate'],
  ['supabase-client:check','M7 Supabase adapter gate'],
  ['tanstack-query:check','M8 TanStack Query gate'],
  ['client-state:check','M9 client-state gate'],
  ['react-shell:check','M10 React shell gate'],
  ['global-overlays:check','M11 global overlay gate'],
  ['authentication-ui:check','M12 authentication UI gate'],
  ['account-settings-users:check','M13 management UI gate'],
  ['shared-app-ui:check','M14 shared application UI gate'],
  ['board-presentation:check','M15 React Board presentation facade gate'],
  ['lint:eslint','Governed ESLint gate'],
  ['typecheck','TypeScript verification against M15 Board facade authority'],
]) run(script, label);
setState('active-pending-release-certification');
run('board-presentation:check', 'M15 active Board facade authority gate');
run('typecheck', 'TypeScript revalidation with active M15 Board facade authority');
if (release) {
  run('audit:ci', 'High-severity dependency audit');
  run('release:check', 'Complete production release gate');
  setState('active-certified');
  run('board-presentation:check', 'Final M15 certified-state gate');
}
console.log(`\nStage D M15 activation workflow complete for this run. Current state: ${readState('config/stage-d-m15-react-board-presentation-facade-target.ts')}`);
