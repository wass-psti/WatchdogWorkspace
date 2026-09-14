import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const state = read('config/stage-d-m16-board-component-decomposition-target.ts').match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const prerequisite = read('config/stage-d-m15-react-board-presentation-facade-target.ts').match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const manifest = read('config/application-manifest.ts');
const facade = read('src/app/boards/BoardPresentationFacade.tsx');
const routeBoundary = read('src/app/boards/components/BoardPresentationRouteBoundary.tsx');
const surface = read('src/app/boards/components/BoardPresentationSurface.tsx');
const model = read('src/app/boards/components/board-presentation-model.ts');
const componentIndex = read('src/app/boards/components/index.ts');
const host = read('src/app/boards/board-presentation-host.ts');
const runtime = read('src/app/boards/board-presentation-facade-runtime.ts');
const boardEngine = read('assets/js/boards-ui.ts');
const boardFeature = read('assets/js/features/boards/index.ts');
const types = read('src/types/manifest.ts');
const schemas = read('src/runtime-schemas/manifest.ts');
const packageJson = JSON.parse(read('package.json'));
const stageD = read('scripts/certify-stage-d-platform.mjs');
const cert = read('scripts/certify-stage-d-m16.sh');
const projectVerifier = read('verify-project.sh');
const viteVerifier = read('scripts/verify-vite-server.mjs');
const m15Verifier = read('verify-stage-d-m15-react-board-presentation-facade.mjs');
const doc = read('docs/WORK-MANAGEMENT-BOARD-COMPONENT-DECOMPOSITION.md');
const status = read('RELEASE-STATUS-v1.43.2-STAGE-D-M16-BOARD-COMPONENT-DECOMPOSITION.md');
const runbook = read('M16-ACTIVATION-RUNBOOK.md');
const ci = read('.github/workflows/ci.yml');
const deploy = read('.github/workflows/deploy-pages.yml');
const governedCi = read('governance-artifacts/github/workflows/ci.yml');
const governedDeploy = read('governance-artifacts/github/workflows/deploy-pages.yml');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);

assert(prerequisite === 'active-certified', `M16 requires M15 active-certified; found ${prerequisite}.`);
assert(architectureVersion >= 26, `M16 requires current architecture 26 or newer; found ${architectureVersion}.`);
assert(manifest.includes("boardComponentDecomposition: 'react-board-component-decomposition-v1'"), 'Manifest must declare M16 Board component decomposition ownership.');
assert(manifest.includes("boardPresentationRouteBoundary: 'src/app/boards/components/BoardPresentationRouteBoundary.tsx'"), 'Manifest must identify the M16 route component boundary.');
assert(manifest.includes("boardPresentationSurface: 'src/app/boards/components/BoardPresentationSurface.tsx'"), 'Manifest must identify the M16 stable presentation surface.');
assert(manifest.includes("boardPresentationModel: 'src/app/boards/components/board-presentation-model.ts'"), 'Manifest must identify the M16 derived presentation model.');
assert(types.includes("'react-board-component-decomposition-v1'") && types.includes('boardPresentationRouteBoundary') && types.includes('boardPresentationSurface') && types.includes('boardPresentationModel'), 'Typed manifest contract must include M16 component authorities.');
assert(schemas.includes("z.literal('react-board-component-decomposition-v1')") && schemas.includes('Architecture v26+ requires typed React Board component decomposition'), 'Runtime manifest schema must enforce Architecture v26 component decomposition.');

assert(facade.includes('<BoardPresentationRouteBoundary') && facade.includes('useBoardPresentationFacadeRuntime'), 'M16 facade must delegate to the typed route component boundary.');
assert(!facade.includes('data-wm-board-presentation-host'), 'M16 facade must not retain host DOM responsibility after decomposition.');
assert(routeBoundary.includes('deriveBoardPresentationRouteModel') && routeBoundary.includes('<BoardPresentationSurface'), 'M16 route boundary must derive one typed model and delegate to the surface component.');
assert(routeBoundary.includes('memo('), 'M16 route boundary must be memoized.');
assert(surface.includes('data-wm-board-presentation-host') && surface.includes("data-wm-board-component-decomposition=\"react-board-component-decomposition-v1\""), 'M16 surface must own the compatibility host and decomposition marker.');
assert(surface.includes('React must never render children here'), 'M16 surface must document the imperative-descendant compatibility invariant.');
assert(surface.includes('memo('), 'M16 compatibility surface must be memoized.');
assert(model.includes("kind: 'inactive'") && model.includes("kind: 'collection'") && model.includes("kind: 'workspace'"), 'M16 presentation model must exhaustively distinguish inactive, collection, and workspace states.');
assert(model.includes('Active Board workspace presentation requires a board identifier.'), 'M16 model must enforce the Board detail identifier invariant.');
assert(componentIndex.includes('BoardPresentationRouteBoundary') && componentIndex.includes('BoardPresentationSurface') && componentIndex.includes('BoardPresentationRouteModel'), 'M16 component index must expose the decomposed presentation contracts.');

for (const [label, source] of [['facade', facade], ['route boundary', routeBoundary], ['surface', surface], ['model', model]]) {
  assert(!source.includes('assets/js/'), `${label} must not import legacy/domain implementation authorities.`);
  assert(!/board-domain-service|board-command-service|board-repository|tanstack|zustand|supabase/i.test(source), `${label} must remain presentation-only and not absorb Board domain/server/client persistence authority.`);
}
assert(runtime.includes("'hidden' | 'boards' | 'board'") && host.includes('[data-wm-board-presentation-host]'), 'M16 must preserve the certified M15 external-store and host resolver contracts.');
assert(boardFeature.includes("presentation: 'react-board-presentation-facade-v1'") && boardFeature.includes("presentationEngine: 'assets/js/boards-ui.ts'"), 'M16 must preserve the M15 compatibility-engine declaration.');
assert(boardEngine.includes('createBoardDataController') && boardEngine.includes('createBoardInlineEditController') && boardEngine.includes('createBoardMenuController'), 'M16 must preserve the mature Board engine behavior stack.');
assert(m15Verifier.includes('architectureVersion >= 25') && m15Verifier.includes('BoardPresentationSurface.tsx'), 'M15 historical verifier must be synchronized to permit M16 while still validating the delegated compatibility host.');

assert(packageJson.scripts['board-components:check'] && packageJson.scripts['board-components:status'] && packageJson.scripts['board-components:activate:release'], 'Package scripts must expose focused M16 verification/status/activation.');
assert(packageJson.scripts.check.includes('board-components:check') && packageJson.scripts['release:check'].includes('board-components:check'), 'M16 gate must participate in check and release gates.');
assert(stageD.includes('board-components:activate:release') && stageD.includes('M16 Board component decomposition'), 'Stage D certification must promote and report M16 after preserving M15.');
assert(cert.includes('M16 ARCHITECTURE PREFLIGHT') && cert.includes('npm run stage-d:certify'), 'Governed M16 certification entrypoint must exercise complete Stage D certification.');
assert(projectVerifier.includes('verify-stage-d-m16-board-component-decomposition.mjs') && projectVerifier.includes('src/app/boards/components/BoardPresentationSurface.tsx'), 'Aggregate verifier must require M16 artifacts.');
assert(viteVerifier.includes('data-wm-board-component-decomposition') && viteVerifier.includes('M16 browser contract'), 'Dev/preview browser verifier must validate the M16 component marker.');
assert(doc.includes('single stable compatibility host') && doc.includes('No Supabase migration'), 'M16 documentation must record the stable-host and backend boundaries.');
assert(status.includes('implementation-complete-pending-certification') && status.includes('Architecture Version:** 26'), 'M16 release status must ship pending certification at Architecture 26.');
assert(runbook.includes('scripts/certify-stage-d-m16.sh') && runbook.includes('board-components:status'), 'M16 runbook must use the governed certification entrypoint.');
for (const [label, workflow] of [['CI', ci], ['deploy', deploy], ['governed CI', governedCi], ['governed deploy', governedDeploy]]) {
  assert(workflow.includes('Stage D M16 Board component decomposition') && workflow.includes('npm run board-components:check'), `${label} workflow must run the M16 gate.`);
}
assert(!fs.readdirSync(path.join(root, 'supabase/migrations')).some((name) => /m16|component.*decomposition|board.*component/i.test(name)), 'M16 must not introduce a Supabase migration.');

const execution = spawnSync(process.execPath, ['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-board-component-decomposition-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M16 Board component decomposition execution vectors failed.');
console.log(`Stage D Milestone 16 Board component decomposition verification: PASS (state=${state}; architecture=${architectureVersion})`);
