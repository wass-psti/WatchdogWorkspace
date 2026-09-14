import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const state = read('config/stage-d-m17-tanstack-table-evaluation-target.ts').match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const prerequisite = read('config/stage-d-m16-board-component-decomposition-target.ts').match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const manifest = read('config/application-manifest.ts');
const target = read('config/stage-d-m17-tanstack-table-evaluation-target.ts');
const evaluation = read('src/app/boards/evaluation/tanstack-table-evaluation.ts');
const requirements = read('src/app/boards/evaluation/board-table-requirements.ts');
const evaluationIndex = read('src/app/boards/evaluation/index.ts');
const tableRenderer = read('assets/js/features/boards/views/table-view.ts');
const boardEngine = read('assets/js/boards-ui.ts');
const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const stageD = read('scripts/certify-stage-d-platform.mjs');
const cert = read('scripts/certify-stage-d-m17.sh');
const projectVerifier = read('verify-project.sh');
const doc = read('docs/WORK-MANAGEMENT-TANSTACK-TABLE-EVALUATION.md');
const status = read('RELEASE-STATUS-v1.43.2-STAGE-D-M17-TANSTACK-TABLE-EVALUATION.md');
const runbook = read('M17-ACTIVATION-RUNBOOK.md');
const ci = read('.github/workflows/ci.yml');
const deploy = read('.github/workflows/deploy-pages.yml');
const governedCi = read('governance-artifacts/github/workflows/ci.yml');
const governedDeploy = read('governance-artifacts/github/workflows/deploy-pages.yml');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);

assert(prerequisite === 'active-certified', `M17 requires M16 active-certified; found ${prerequisite}.`);
assert(architectureVersion >= 26, `M17 evaluation requires architecture 26 or newer; found ${architectureVersion}.`);
assert(target.includes("package: '@tanstack/react-table'") && target.includes("version: '9.2.4'"), 'M17 target must pin the evaluated TanStack Table candidate/version.');
assert(target.includes("adoptionDecision: 'defer-production-adoption'") && target.includes('productionDependencyInstalled: false'), 'M17 target must record the non-adoption decision and no production dependency.');
assert(target.includes('runtimeArchitectureChange: false') && target.includes('noSupabaseMigration: true'), 'M17 must explicitly remain evaluation-only with no backend/runtime architecture migration.');
assert(evaluation.includes("candidateVersion: '9.2.4'") && evaluation.includes("defer-production-adoption"), 'M17 evaluation authority must expose the pinned candidate and decision.');
for (const marker of ['board-group-sections', 'typed-cell-editors', 'drag-drop', 'optimistic-history', 'accessibility-keyboard', 'server-state', 'client-state']) {
  assert(requirements.includes(marker), `M17 requirements must evaluate ${marker}.`);
}
assert(evaluationIndex.includes('TANSTACK_TABLE_EVALUATION') && evaluationIndex.includes('BOARD_TABLE_REQUIREMENTS'), 'M17 evaluation index must expose the governed evaluation contracts.');
assert(tableRenderer.includes('renderBoardTableView') && boardEngine.includes('renderBoardTableView'), 'M17 must preserve the existing production Board Table compatibility renderer.');
assert(packageJson.dependencies?.['@tanstack/react-table'] === undefined && packageJson.devDependencies?.['@tanstack/react-table'] === undefined, 'M17 evaluation must not install @tanstack/react-table as a runtime or development dependency.');
assert(packageLock.packages?.['node_modules/@tanstack/react-table'] === undefined, 'M17 lockfile must remain free of @tanstack/react-table until an adoption milestone is approved.');
assert(!read('src/app/boards/BoardPresentationFacade.tsx').includes('evaluation/'), 'M17 evaluation must not enter the production Board facade import graph.');
assert(!read('src/app/boards/components/BoardPresentationRouteBoundary.tsx').includes('evaluation/'), 'M17 evaluation must not enter the production route boundary import graph.');
assert(!read('src/app/boards/components/BoardPresentationSurface.tsx').includes('evaluation/'), 'M17 evaluation must not enter the production compatibility surface import graph.');

assert(packageJson.scripts['tanstack-table-evaluation:check'] && packageJson.scripts['tanstack-table-evaluation:status'] && packageJson.scripts['tanstack-table-evaluation:activate:release'], 'Package scripts must expose focused M17 verification/status/activation.');
assert(packageJson.scripts.check.includes('tanstack-table-evaluation:check') && packageJson.scripts['release:check'].includes('tanstack-table-evaluation:check'), 'M17 gate must participate in check and release gates.');
assert(stageD.includes('tanstack-table-evaluation:activate:release') && stageD.includes('M17 TanStack Table evaluation'), 'Stage D certification must promote and report M17 after preserving M16.');
assert(cert.includes('M17 ARCHITECTURE PREFLIGHT') && cert.includes('npm run stage-d:certify'), 'Governed M17 certification entrypoint must exercise complete Stage D certification.');
assert(projectVerifier.includes('verify-stage-d-m17-tanstack-table-evaluation.mjs') && projectVerifier.includes('src/app/boards/evaluation/tanstack-table-evaluation.ts'), 'Aggregate verifier must require M17 artifacts.');
assert(doc.includes('defer-production-adoption') && doc.includes('No Supabase migration') && doc.includes('@tanstack/react-table 9.2.4'), 'M17 documentation must record the candidate, decision, and backend boundary.');
assert(status.includes('implementation-complete-pending-certification') && status.includes('Architecture Version:** 26'), 'M17 release status must ship pending certification without a runtime architecture bump.');
assert(runbook.includes('scripts/certify-stage-d-m17.sh') && runbook.includes('tanstack-table-evaluation:status'), 'M17 runbook must use the governed certification entrypoint.');
for (const [label, workflow] of [['CI', ci], ['deploy', deploy], ['governed CI', governedCi], ['governed deploy', governedDeploy]]) {
  assert(workflow.includes('Stage D M17 TanStack Table evaluation') && workflow.includes('npm run tanstack-table-evaluation:check'), `${label} workflow must run the M17 gate.`);
}
assert(!fs.readdirSync(path.join(root, 'supabase/migrations')).some((name) => /m17|tanstack.*table|table.*evaluation/i.test(name)), 'M17 must not introduce a Supabase migration.');

const execution = spawnSync(process.execPath, ['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-tanstack-table-evaluation-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M17 TanStack Table evaluation execution vectors failed.');
console.log(`Stage D Milestone 17 TanStack Table evaluation verification: PASS (state=${state}; architecture=${architectureVersion}; candidate=9.2.4; decision=defer-production-adoption)`);
