import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const run = (script, label) => {
  console.log(`\n================ ${label} ================`);
  const result = spawnSync('npm', ['run', script], { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
};
const readState = (file) => fs.readFileSync(path.join(root, file), 'utf8').match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
if (process.version !== 'v22.16.0') throw new Error(`Stage C certification requires Node v22.16.0; current runtime is ${process.version}.`);
run('governance:restore', 'Synchronize governed repository artifacts');
run('dependencies:ensure', 'Ensure exact lockfile dependencies');
run('stage-b:certify', 'Revalidate certified Stage B platform prerequisite');
const prerequisites = [
  ['config/stage-b-m4-design-system-target.ts','M4'],['config/stage-b-m5-interaction-target.ts','M5'],['config/stage-b-m6-runtime-schema-target.ts','M6'],
  ['config/stage-b-m7-supabase-client-target.ts','M7'],['config/stage-b-m8-tanstack-query-target.ts','M8'],['config/stage-b-m9-client-state-target.ts','M9'],
];
for (const [file, label] of prerequisites) if (readState(file) !== 'active-certified') throw new Error(`${label} must remain active-certified before Stage C certification.`);
let m10 = readState('config/stage-c-m10-react-shell-target.ts');
if (m10 !== 'active-certified') {
  run('react-shell:activate:release', 'Activate and release-certify M10');
  m10 = readState('config/stage-c-m10-react-shell-target.ts');
}
if (m10 !== 'active-certified') throw new Error(`M10 did not reach active-certified; current state is ${m10}.`);
let m11 = readState('config/stage-c-m11-global-overlays-target.ts');
if (m11 !== 'active-certified') {
  run('global-overlays:activate:release', 'Activate and release-certify M11');
  m11 = readState('config/stage-c-m11-global-overlays-target.ts');
}
if (m11 !== 'active-certified') throw new Error(`M11 did not reach active-certified; current state is ${m11}.`);
let m12 = readState('config/stage-c-m12-authentication-ui-target.ts');
if (m12 !== 'active-certified') {
  run('authentication-ui:activate:release', 'Activate and release-certify M12');
  m12 = readState('config/stage-c-m12-authentication-ui-target.ts');
}
if (m12 !== 'active-certified') throw new Error(`M12 did not reach active-certified; current state is ${m12}.`);
let m13 = readState('config/stage-c-m13-account-settings-user-management-target.ts');
if (m13 !== 'active-certified') {
  run('account-settings-users:activate:release', 'Activate and release-certify M13');
  m13 = readState('config/stage-c-m13-account-settings-user-management-target.ts');
}
if (m13 !== 'active-certified') throw new Error(`M13 did not reach active-certified; current state is ${m13}.`);
let m14 = readState('config/stage-c-m14-command-shared-ui-target.ts');
if (m14 !== 'active-certified') {
  run('shared-app-ui:activate:release', 'Activate and release-certify M14');
  m14 = readState('config/stage-c-m14-command-shared-ui-target.ts');
}
if (m14 !== 'active-certified') throw new Error(`M14 did not reach active-certified; current state is ${m14}.`);
run('react-shell:status', 'M10 final status');
run('global-overlays:status', 'M11 final status');
run('authentication-ui:status', 'M12 final status');
run('account-settings-users:status', 'M13 final status');
run('shared-app-ui:status', 'M14 final status');
console.log('\nStage C platform certification: PASS');
console.log('M4 React Design System: active-certified');
console.log('M5 Primitive Interaction Architecture: active-certified');
console.log('M6 Runtime Schemas: active-certified');
console.log('M7 Supabase Client Adapter: active-certified');
console.log('M8 TanStack Query Migration: active-certified');
console.log('M9 Client-state Ownership Model: active-certified');
console.log('M10 React Shell: active-certified');
console.log('M11 Global Overlays: active-certified');
console.log('M12 Authentication UI: active-certified');
console.log('M13 Account / Settings / User Management: active-certified');
console.log('M14 Command Palette and Shared Application UI: active-certified');
