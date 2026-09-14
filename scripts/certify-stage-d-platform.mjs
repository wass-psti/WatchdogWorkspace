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
if (process.version !== 'v22.16.0') throw new Error(`Stage D certification requires Node v22.16.0; current runtime is ${process.version}.`);
run('governance:restore', 'Synchronize governed repository artifacts');
run('dependencies:ensure', 'Ensure exact lockfile dependencies');
run('stage-c:certify', 'Revalidate certified Stage C platform prerequisite');
if (readState('config/stage-c-m14-command-shared-ui-target.ts') !== 'active-certified') throw new Error('M14 must remain active-certified before Stage D certification.');
let m15 = readState('config/stage-d-m15-react-board-presentation-facade-target.ts');
if (m15 !== 'active-certified') {
  run('board-presentation:activate:release', 'Activate and release-certify M15');
  m15 = readState('config/stage-d-m15-react-board-presentation-facade-target.ts');
}
if (m15 !== 'active-certified') throw new Error(`M15 did not reach active-certified; current state is ${m15}.`);
let m16 = readState('config/stage-d-m16-board-component-decomposition-target.ts');
if (m16 !== 'active-certified') {
  run('board-components:activate:release', 'Activate and release-certify M16');
  m16 = readState('config/stage-d-m16-board-component-decomposition-target.ts');
}
if (m16 !== 'active-certified') throw new Error(`M16 did not reach active-certified; current state is ${m16}.`);
let m17 = readState('config/stage-d-m17-tanstack-table-evaluation-target.ts');
if (m17 !== 'active-certified') {
  run('tanstack-table-evaluation:activate:release', 'Activate and release-certify M17 TanStack Table evaluation');
  m17 = readState('config/stage-d-m17-tanstack-table-evaluation-target.ts');
}
if (m17 !== 'active-certified') throw new Error(`M17 did not reach active-certified; current state is ${m17}.`);
let m18 = readState('config/stage-d-m18-virtualization-target.ts');
if (m18 !== 'active-certified') {
  run('board-virtualization:activate:release', 'Activate and release-certify M18 Board virtualization');
  m18 = readState('config/stage-d-m18-virtualization-target.ts');
}
if (m18 !== 'active-certified') throw new Error(`M18 did not reach active-certified; current state is ${m18}.`);
let m19 = readState('config/stage-d-m19-drag-drop-evaluation-target.ts');
if (m19 !== 'active-certified') {
  run('drag-drop-evaluation:activate:release', 'Activate and release-certify M19 Drag-and-drop evaluation');
  m19 = readState('config/stage-d-m19-drag-drop-evaluation-target.ts');
}
if (m19 !== 'active-certified') throw new Error(`M19 did not reach active-certified; current state is ${m19}.`);
let m20 = readState('config/stage-d-m20-board-collaborative-realtime-target.ts');
if (m20 !== 'active-certified') {
  run('board-realtime:activate:release', 'Activate and release-certify M20 Board collaborative Realtime');
  m20 = readState('config/stage-d-m20-board-collaborative-realtime-target.ts');
}
if (m20 !== 'active-certified') throw new Error(`M20 did not reach active-certified; current state is ${m20}.`);
let m21 = readState('config/stage-d-m21-rich-item-workspace-target.ts');
if (m21 !== 'active-certified') {
  run('rich-item-workspace:activate:release', 'Activate and release-certify M21 Rich Item Workspace');
  m21 = readState('config/stage-d-m21-rich-item-workspace-target.ts');
}
if (m21 !== 'active-certified') throw new Error(`M21 did not reach active-certified; current state is ${m21}.`);
run('board-presentation:status', 'M15 final status');
run('board-components:status', 'M16 Board component decomposition final status');
run('tanstack-table-evaluation:status', 'M17 TanStack Table evaluation final status');
run('board-virtualization:status', 'M18 Board virtualization final status');
run('drag-drop-evaluation:status', 'M19 Drag-and-drop evaluation final status');
run('board-realtime:status', 'M20 Board collaborative Realtime final status');
run('rich-item-workspace:status', 'M21 Rich Item Workspace final status');
console.log('\nStage D platform certification: PASS');
console.log('M15 React Board presentation facade: active-certified');
console.log('M16 Board component decomposition: active-certified');
console.log('M17 TanStack Table evaluation: active-certified');
console.log('M18 Board virtualization: active-certified');
console.log('M19 Drag-and-drop evaluation: active-certified');
console.log('M20 Board collaborative Realtime: active-certified');
console.log('M21 Rich Item Workspace: active-certified');
