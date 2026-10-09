import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const release = process.argv.includes('--release');
const targetFile = path.join(root, 'config/stage-b-m6-runtime-schema-target.ts');
const m5File = path.join(root, 'config/stage-b-m5-interaction-target.ts');
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

if (process.version !== 'v22.16.0') throw new Error(`M6 certification requires Node v22.16.0; current runtime is ${process.version}.`);
if (readState(m5File) !== 'active-certified') {
  setState('blocked-pending-m5-certification');
  throw new Error('M6 requires Stage B M5 to be active-certified before runtime-schema promotion.');
}
if (readState(targetFile) === 'blocked-pending-m5-certification') setState('dependencies-installed-pending-certification');

run('governance:restore', 'Synchronize repository governance artifacts');
run('dependencies:ensure', 'Ensure exact lockfile dependencies');
run('governance:check', 'Package governance gate');
run('security:check', 'Security baseline gate');
run('react:check', 'React composition boundary gate');
run('design-system:check', 'M4 design-system gate');
run('corrective:check', 'M4 corrective integrity gate');
run('vendor-types:check', 'M4 vendor declaration compatibility gate');
run('csp-dist:check', 'M4 production CSP serialization gate');
run('interactions:check', 'M5 primitive interaction gate');
run('runtime-schemas:check', 'M6 runtime-schema source gate');
run('lint:eslint', 'Governed ESLint gate');
run('typecheck', 'TypeScript verification against runtime schemas');

setState('active-pending-release-certification');
run('runtime-schemas:check', 'M6 active-schema gate');
run('typecheck', 'TypeScript revalidation with active M6 schema authority');

if (release) {
  run('audit:ci', 'High-severity dependency audit');
  run('release:check', 'Complete production release gate');
  setState('active-certified');
  run('runtime-schemas:check', 'Final M6 certified-state gate');
}

console.log(`\nStage B M6 activation workflow complete for this run. Current state: ${readState(targetFile)}`);
if (!release) console.log('Run `npm run runtime-schemas:activate:release` to complete production release certification.');
