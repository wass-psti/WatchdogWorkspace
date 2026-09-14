import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const state = read('config/stage-d-m19-drag-drop-evaluation-target.ts').match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const prerequisite = read('config/stage-d-m18-virtualization-target.ts').match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const manifest = read('config/application-manifest.ts');
const target = read('config/stage-d-m19-drag-drop-evaluation-target.ts');
const evaluation = read('src/app/boards/evaluation/dnd-kit-evaluation.ts');
const requirements = read('src/app/boards/evaluation/board-drag-drop-requirements.ts');
const evaluationIndex = read('src/app/boards/evaluation/index.ts');
const itemDrag = read('assets/js/features/boards/controllers/drag-drop-controller.ts');
const structureDrag = read('assets/js/features/boards/controllers/structure-drag-controller.ts');
const engine = read('assets/js/boards-ui.ts');
const table = read('assets/js/features/boards/views/table-view.ts');
const kanban = read('assets/js/features/boards/views/kanban-view.ts');
const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const stageD = read('scripts/certify-stage-d-platform.mjs');
const cert = read('scripts/certify-stage-d-m19.sh');
const projectVerifier = read('verify-project.sh');
const doc = read('docs/WORK-MANAGEMENT-DRAG-DROP-EVALUATION.md');
const status = read('RELEASE-STATUS-v1.43.2-STAGE-D-M19-DRAG-DROP-EVALUATION.md');
const runbook = read('M19-ACTIVATION-RUNBOOK.md');
const ci = read('.github/workflows/ci.yml');
const deploy = read('.github/workflows/deploy-pages.yml');
const governedCi = read('governance-artifacts/github/workflows/ci.yml');
const governedDeploy = read('governance-artifacts/github/workflows/deploy-pages.yml');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);

assert(prerequisite === 'active-certified', `M19 requires M18 active-certified; found ${prerequisite}.`);
assert(['implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `M19 target exposes invalid activation state ${state}.`);
assert(architectureVersion >= 27, `M19 evaluation requires Architecture 27 or newer; found ${architectureVersion}.`);
assert(target.includes("runtimeArchitectureChange: false") && target.includes("adoptionDecision: 'defer-production-adoption'") && target.includes('productionDependencyInstalled: false'), 'M19 target must remain evaluation-only and defer production adoption.');
assert(target.includes("package: '@dnd-kit/react'") && target.includes("version: '0.5.0'") && target.includes("package: '@dnd-kit/dom'"), 'M19 target must record the current modern dnd-kit React/DOM candidates.');
assert(target.includes("coreVersion: '6.3.1'") && target.includes("sortableVersion: '10.0.0'"), 'M19 target must record the legacy stable dnd-kit reference line.');
assert(target.includes("reactCompatibility: 'react-18-or-19'") && target.includes("license: 'MIT'"), 'M19 target must record candidate compatibility/license evidence.');
assert(evaluation.includes("'@dnd-kit/react'") && evaluation.includes("'@dnd-kit/dom'") && evaluation.includes("'6.3.1 + 10.0.0'"), 'M19 evaluation authority must compare modern and legacy dnd-kit candidates.');
for (const marker of [
  'item-table-reorder', 'cross-group-item-move', 'kanban-status-move', 'group-reorder', 'column-reorder',
  'keyboard-order-contracts', 'screen-reader-announcements', 'optimistic-history-rollback',
  'command-service-authority', 'virtualization-drag-freeze', 'overlay-editor-isolation',
  'disposable-route-lifecycle', 'non-react-board-island', 'server-state-separation',
]) assert(requirements.includes(marker), `M19 requirements must evaluate ${marker}.`);
assert(evaluationIndex.includes('DND_KIT_EVALUATION') && evaluationIndex.includes('BOARD_DRAG_DROP_REQUIREMENTS'), 'M19 evaluation index must expose the governed drag/drop evaluation contracts.');

for (const marker of [
  "addEventListener('dragstart'", "addEventListener('dragover'", "addEventListener('drop'", 'new AbortController()',
  'async function keyboardReorder', "['ArrowUp', 'ArrowDown', 'Home', 'End']", 'history?.push', 'commands.moveItem',
  'data-board-drag-live', 'aria-live',
]) assert(itemDrag.includes(marker), `M19 must preserve item drag behavior marker ${marker}.`);
for (const marker of [
  "'[data-column-drag],[data-group-drag]'", 'new AbortController()', 'void keyboardMove(', 'commands.moveColumn', 'commands.moveGroup',
  'history?.push', 'data-board-structure-live',
]) assert(structureDrag.includes(marker), `M19 must preserve structural drag behavior marker ${marker}.`);
assert(engine.includes('dragDrop?.activeItemId') && engine.includes('tableVirtualization') && engine.includes('dragDrop?.dispose()') && engine.includes('structureDrag.dispose()'), 'M19 must preserve M18 drag/virtualization and route cleanup integration.');
assert(table.includes('data-drop-group') && kanban.includes('data-drop-status'), 'M19 must preserve Table group and Kanban status drop targets.');

for (const dependency of ['@dnd-kit/react','@dnd-kit/dom','@dnd-kit/core','@dnd-kit/sortable']) {
  assert(packageJson.dependencies?.[dependency] === undefined && packageJson.devDependencies?.[dependency] === undefined, `M19 evaluation must not install ${dependency}.`);
  assert(packageLock.packages?.[`node_modules/${dependency}`] === undefined, `M19 lockfile must remain free of ${dependency}.`);
}
assert(!read('src/app/boards/BoardPresentationFacade.tsx').includes('dnd-kit-evaluation'), 'M19 evaluation must not enter the production Board facade import graph.');
assert(!engine.includes('@dnd-kit/'), 'M19 must not replace the certified Board drag runtime during evaluation.');

assert(packageJson.scripts['drag-drop-evaluation:check'] && packageJson.scripts['drag-drop-evaluation:status'] && packageJson.scripts['drag-drop-evaluation:activate:release'], 'Package scripts must expose focused M19 verification/status/activation.');
assert(packageJson.scripts.check.includes('drag-drop-evaluation:check') && packageJson.scripts['release:check'].includes('drag-drop-evaluation:check'), 'M19 gate must participate in check and release gates.');
assert(stageD.includes('drag-drop-evaluation:activate:release') && stageD.includes('M19 Drag-and-drop evaluation'), 'Stage D certification must promote and report M19.');
assert(cert.includes('M19 EVALUATION PREFLIGHT') && cert.includes('npm run stage-d:certify'), 'Governed M19 certification must exercise complete Stage D certification.');
assert(projectVerifier.includes('verify-stage-d-m19-drag-drop-evaluation.mjs') && projectVerifier.includes('src/app/boards/evaluation/dnd-kit-evaluation.ts'), 'Aggregate verifier must require M19 artifacts.');
assert(doc.includes('defer-production-adoption') && doc.includes('@dnd-kit/react 0.5.0') && doc.includes('No Supabase migration'), 'M19 documentation must record the candidate, decision, and backend boundary.');
assert(status.includes('implementation-complete-pending-certification') && status.includes('Architecture Version:** 27'), 'M19 release status must ship pending certification at Architecture 27.');
assert(runbook.includes('scripts/certify-stage-d-m19.sh') && runbook.includes('drag-drop-evaluation:status'), 'M19 runbook must use the governed certification entrypoint.');
for (const [label, workflow] of [['CI', ci], ['deploy', deploy], ['governed CI', governedCi], ['governed deploy', governedDeploy]]) {
  assert(workflow.includes('Stage D M19 Drag-and-drop evaluation') && workflow.includes('npm run drag-drop-evaluation:check'), `${label} workflow must run M19 gate.`);
}
assert(!fs.readdirSync(path.join(root, 'supabase/migrations')).some((name) => /m19|dnd|drag[-_]?drop/i.test(name)), 'M19 must not introduce a Supabase migration.');

const execution = spawnSync(process.execPath, ['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-dnd-kit-evaluation-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M19 dnd-kit evaluation execution vectors failed.');

console.log(`Stage D Milestone 19 Drag-and-drop evaluation verification: PASS (state=${state}; architecture=${architectureVersion})`);
