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
const state = (file) => fs.readFileSync(path.join(root, file), 'utf8').match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';

if (process.version !== 'v22.16.0') throw new Error(`Stage E certification requires Node v22.16.0; current ${process.version}.`);
run('governance:restore', 'Synchronize governed repository artifacts');
run('dependencies:ensure', 'Ensure exact lockfile dependencies');
run('stage-d:certify', 'Revalidate certified Stage D platform prerequisite');
if (state('config/stage-d-m21-rich-item-workspace-target.ts') !== 'active-certified') throw new Error('M21 must remain active-certified before Stage E certification.');
if (state('config/stage-e-m22-normalized-module-data-target.ts') !== 'active-certified') throw new Error('M22 must remain active-certified before Stage E certification.');
run('normalized-module-data:check', 'Revalidate M22 normalized module data foundation');

let m23 = state('config/stage-e-m23-timetracker-stabilization-target.ts');
if (m23 !== 'active-certified') {
  run('timetracker-stabilization:activate:release', 'Activate and release-certify M23');
  m23 = state('config/stage-e-m23-timetracker-stabilization-target.ts');
}
if (m23 !== 'active-certified') throw new Error(`M23 did not reach active-certified; current state ${m23}.`);
run('timetracker-stabilization:check', 'Revalidate M23 TimeTracker stabilization');

let m24 = state('config/stage-e-m24-fueltrack-stabilization-target.ts');
if (m24 !== 'active-certified') {
  run('fueltrack-stabilization:activate:release', 'Activate and release-certify M24');
  m24 = state('config/stage-e-m24-fueltrack-stabilization-target.ts');
}
if (m24 !== 'active-certified') throw new Error(`M24 did not reach active-certified; current state ${m24}.`);
run('fueltrack-stabilization:check', 'Revalidate M24 FuelTrack+ stabilization');

let m25 = state('config/stage-e-m25-tradelink-stabilization-target.ts');
if (m25 !== 'active-certified') {
  run('tradelink-stabilization:activate:release', 'Activate and release-certify M25');
  m25 = state('config/stage-e-m25-tradelink-stabilization-target.ts');
}
if (m25 !== 'active-certified') throw new Error(`M25 did not reach active-certified; current state ${m25}.`);
run('tradelink-stabilization:check', 'Revalidate M25 TradeLink stabilization');

let m26 = state('config/stage-e-m26-iframe-retirement-target.ts');
if (m26 !== 'active-certified') {
  run('iframe-retirement:activate:release', 'Activate and release-certify M26');
  m26 = state('config/stage-e-m26-iframe-retirement-target.ts');
}
if (m26 !== 'active-certified') throw new Error(`M26 did not reach active-certified; current state ${m26}.`);

run('normalized-module-data:status', 'M22 final status');
run('timetracker-stabilization:status', 'M23 final status');
run('fueltrack-stabilization:status', 'M24 final status');
run('tradelink-stabilization:status', 'M25 final status');
run('iframe-retirement:status', 'M26 final status');
console.log('\nStage E platform certification: PASS');
console.log('M22 Normalized module data foundation: active-certified');
console.log('M23 TimeTracker stabilization: active-certified');
console.log('M24 FuelTrack+ stabilization: active-certified');
console.log('M25 TradeLink stabilization: active-certified');
console.log('M26 Iframe retirement: active-certified');
