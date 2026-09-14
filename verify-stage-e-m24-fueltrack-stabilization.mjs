import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const activationState = (file) => read(file).match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';

const target = read('config/stage-e-m24-fueltrack-stabilization-target.ts');
const state = activationState('config/stage-e-m24-fueltrack-stabilization-target.ts');
const m23 = activationState('config/stage-e-m23-timetracker-stabilization-target.ts');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const types = read('src/types/manifest.ts');
const schema = read('src/runtime-schemas/manifest.ts');
const runtimeHtml = read('apps/fueltrack-plus/runtime.html');
const app = read('apps/fueltrack-plus/app.v3.17.0-wm6.js');
const stability = read('apps/fueltrack-plus/stability-runtime.js');
const domain = read('apps/fueltrack-plus/domain-config.js');
const analytics = read('assets/js/runtime/fueltrack-analytics.ts');
const vite = read('vite.config.js');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const project = read('verify-project.sh');
const architecture = read('docs/architecture/ARCHITECTURE.md');
const ci = read('.github/workflows/ci.yml');
const deploy = read('.github/workflows/deploy-pages.yml');
const stageECertifier = read('scripts/certify-stage-e-platform.mjs');
const notices = read('THIRD_PARTY_NOTICES.md');

const runtimeAssets = read('config/runtime-assets.js');
const serviceWorker = read('service-worker.js');
const distVerifier = read('scripts/verify-dist.mjs');

assert(m23 === 'active-certified', `M24 requires M23 active-certified; found ${m23}.`);
assert(['implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Invalid M24 state ${state}.`);
assert(architectureVersion >= 32, `M24 requires Architecture 32+; found ${architectureVersion}.`);

for (const marker of [
  "fuelTrackStabilization: 'embedded-fueltrack-stability-v1'",
  "fuelTrackStabilityRuntime: 'apps/fueltrack-plus/stability-runtime.js'",
  "fuelTrackRuntime: 'apps/fueltrack-plus/app.v3.17.0-wm6.js'",
  "fuelTrackAnalytics: 'apache-echarts-6.1-route-lazy'",
  "fuelTrackAnalyticsRuntime: 'assets/js/runtime/fueltrack-analytics.ts'",
]) assert(manifest.includes(marker), `Manifest missing M24 authority: ${marker}`);

assert(types.includes("fuelTrackStabilization?: 'embedded-fueltrack-stability-v1'") && types.includes("fuelTrackAnalytics?: 'apache-echarts-6.1-route-lazy'"), 'Manifest types must expose M24 authorities.');
assert(schema.includes("z.literal('embedded-fueltrack-stability-v1')") && schema.includes("z.literal('apache-echarts-6.1-route-lazy')") && schema.includes('architectureVersion >= 32'), 'Runtime manifest schema must enforce Architecture 32 M24 authorities.');

assert(runtimeHtml.indexOf('./domain-config.js') < runtimeHtml.indexOf('./stability-runtime.js'), 'FuelTrack+ domain configuration must load before the M24 stability runtime.');
assert(runtimeHtml.indexOf('./stability-runtime.js') < runtimeHtml.indexOf('startEmbeddedModule'), 'M24 stability runtime must load before the authenticated embedded bootstrap.');
assert(runtimeHtml.includes("entry: './app.v3.17.0-wm6.js'"), 'FuelTrack+ wm6 runtime must remain the production authority.');
assert(!runtimeHtml.includes("entry: './app.js'"), 'FuelTrack+ must not regress to the stale app.js compatibility copy.');

for (const marker of [
  'createMutationGate',
  'createConfirmedStateWriter',
  'createSerialTaskQueue',
  'createStoreChangeBridge',
  'WM_FUELTRACK_COMMIT_DIVERGED',
  "window.addEventListener('storage'",
  "window.addEventListener('wm:module-store-change'",
]) assert(stability.includes(marker), `FuelTrack+ stability runtime missing ${marker}`);

for (const marker of [
  'globalThis.WMFuelTrackStability',
  'requestMutationGate',
  'preferenceWriteQueue',
  'activityWorkspaceWriteQueue',
  'await globalThis.WMModuleStore.refresh()',
  'recoverAuthoritativeFuelTrackState',
  'if(committed!==serialized)',
  'requestMutationGate.run("request:create"',
  'requestMutationGate.run(`request:${requestId}`',
  'requestMutationGate.run(`request:${id}`',
  'persistActivityWorkspace',
  'loadAnalyticsModule',
  'enhanceAnalyticsTrend(series)',
]) assert(app.includes(marker), `FuelTrack+ production runtime missing M24 marker: ${marker}`);

assert(app.includes('await commitRequestsWithActivity') && app.includes('approvalDecisionDialog.close()'), 'Approval workflow must retain the atomic request/activity commit and dialog lifecycle.');
const approvalSubmitIndex = app.indexOf('async function commitApprovalDecision');
assert(approvalSubmitIndex >= 0, 'Approval decision submit authority is missing.');
const approvalBlock = app.slice(approvalSubmitIndex, approvalSubmitIndex + 4500);
const approvalAwait = approvalBlock.indexOf('await applyTransition'); const approvalSaved = approvalBlock.indexOf('if(saved)', approvalAwait); const approvalClose = approvalBlock.indexOf('approvalDecisionDialog.close()', approvalSaved); assert(approvalAwait >= 0 && approvalSaved > approvalAwait && approvalClose > approvalSaved, 'Approval dialog must close only after the confirmed transition resolves successfully.');

assert(app.includes('status:"Completed"') || app.includes('status: "Completed"'), 'Refueling completion must preserve the Completed state.');
assert(app.includes('fuelQuantityLiters') && app.includes('invoiceNumber') && app.includes('receiptPhoto'), 'Refueling completion evidence fields must remain intact.');
assert(!app.includes('inventoryDeduction') && !app.includes('deductInventoryForRequest'), 'M24 must not invent unsupported LightFuels stock deduction semantics.');

for (const marker of ['requests','inventory','prefs','activityWorkspace']) assert(domain.includes(marker), `FuelTrack+ domain must retain ${marker} state authority.`);
assert(domain.includes('VALID_TRANSITIONS') && domain.includes('PERMISSIONS'), 'FuelTrack+ request state machine and RBAC authorities must remain intact.');

const legacyAnalyticsImportAuthority = analytics.includes("from 'echarts'");
const treeShakenAnalyticsImportAuthority =
  analytics.includes("from 'echarts/core'") &&
  analytics.includes("from 'echarts/charts'") &&
  analytics.includes("from 'echarts/components'") &&
  analytics.includes("from 'echarts/renderers'") &&
  analytics.includes('echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])');
const analyticsImportAuthority = architectureVersion >= 39
  ? treeShakenAnalyticsImportAuthority
  : legacyAnalyticsImportAuthority;
assert(analyticsImportAuthority && analytics.includes("version: '6.1.0'") && analytics.includes("loading: 'analytics-route-lazy'"), 'Analytics runtime must use the governed Apache ECharts 6.1.0 route-lazy authority for this architecture.');
assert(analytics.includes("prefers-reduced-motion: reduce") && analytics.includes('animation: !reducedMotion'), 'FuelTrack+ ECharts enhancement must honor reduced-motion preferences at the canvas engine boundary.');
assert(vite.includes("'fueltrack-analytics': resolve(rootDir, 'assets/js/runtime/fueltrack-analytics.ts')") && vite.includes("if (chunk.name === 'fueltrack-analytics') return 'assets/js/runtime/fueltrack-analytics.js'"), 'Vite must emit the stable same-origin FuelTrack analytics entry.');

assert(runtimeAssets.includes("'./assets/js/runtime/fueltrack-analytics.ts'"), 'Source runtime manifest must track the M24 analytics TypeScript entry.');
assert(serviceWorker.includes("'/assets/js/runtime/fueltrack-analytics.js'"), 'Service worker must treat the stable analytics entry as a mutable shared runtime.');
assert(distVerifier.includes("'assets/js/runtime/fueltrack-analytics.ts', 'assets/js/runtime/fueltrack-analytics.js'"), 'Dist verifier must require the M24 analytics source/output pair.');
assert(pkg.dependencies?.echarts === '6.1.0', 'package.json must exact-pin echarts@6.1.0.');
const m4Verifier = read('verify-stage-b-m4-react-design-system.mjs');
assert(m4Verifier.includes("config/stage-e-m24-fueltrack-stabilization-target.ts"), 'Historical M4 verifier must recognize legitimate M24 ECharts ownership.');
assert(m4Verifier.includes('Direct ECharts ownership must match the exact governed M24 target.'), 'Historical M4 verifier must exact-govern M24 ECharts instead of unconditionally rejecting it.');
const m4ForbiddenBlock = m4Verifier.match(/const forbiddenDirectDependencies = \[([\s\S]*?)\];/)?.[1] ?? '';
assert(!m4ForbiddenBlock.includes("'echarts'"), 'Historical M4 later-milestone denylist must not reject the M24-governed ECharts dependency.');
assert(lock.packages?.['node_modules/echarts']?.version === '6.1.0' && lock.packages?.['node_modules/zrender']?.version === '6.1.0', 'package-lock must resolve ECharts/ZRender 6.1.0.');
assert(lock.packages?.['node_modules/echarts']?.integrity && lock.packages?.['node_modules/zrender']?.integrity, 'ECharts/ZRender lock entries require integrity hashes.');
assert(lock.packages?.['node_modules/echarts/node_modules/tslib']?.version === '2.3.0' && lock.packages?.['node_modules/zrender/node_modules/tslib']?.version === '2.3.0', 'ECharts/ZRender exact tslib@2.3.0 dependency graph must remain lockfile-complete.');
assert(notices.includes('Apache ECharts 6.1.0') && notices.includes('ZRender 6.1.0') && notices.includes('tslib 2.3.0'), 'Third-party notices must cover the complete M24 analytics runtime graph.');

for (const key of ['fueltrack-stabilization:check','fueltrack-stabilization:status','fueltrack-stabilization:activate','fueltrack-stabilization:activate:release']) assert(pkg.scripts[key], `Package scripts missing ${key}.`);
assert(pkg.scripts.check.includes('fueltrack-stabilization:check') && pkg.scripts['release:check'].includes('fueltrack-stabilization:check'), 'Aggregate package gates must include M24.');
assert(ci.includes('Stage E M24 FuelTrack+ stabilization') && ci.includes('npm run fueltrack-stabilization:check'), 'CI must enforce M24.');
assert(deploy.includes('Stage E M24 FuelTrack+ stabilization') && deploy.includes('npm run fueltrack-stabilization:check'), 'Pages deployment must enforce M24.');
assert(project.includes('verify-stage-e-m24-fueltrack-stabilization.mjs') && project.includes('scripts/verify-fueltrack-stabilization-execution.mjs') && project.includes('apps/fueltrack-plus/stability-runtime.js') && project.includes('assets/js/runtime/fueltrack-analytics.ts'), 'Aggregate verifier must require M24 artifacts.');
assert(stageECertifier.includes('fueltrack-stabilization:activate:release') && stageECertifier.includes('M24 FuelTrack+ stabilization: active-certified'), 'Stage E certifier must release-certify M24.');
assert(architecture.includes('## Stage E M24 — FuelTrack+ stabilization'), 'Architecture documentation must record M24.');
assert(!fs.existsSync(path.join(root, 'supabase/migrations/v1.43.2-stage-e-m24-fueltrack-stabilization.sql')), 'M24 must not introduce a Supabase migration.');
assert(target.includes("newExternalDependency: 'echarts@6.1.0'") && target.includes('supabaseMigrationRequired: false'), 'M24 target must declare dependency and no-migration boundaries.');

const execution = spawnSync(process.execPath, ['scripts/verify-fueltrack-stabilization-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M24 execution vectors failed.');

console.log(`Stage E Milestone 24 FuelTrack+ stabilization verification: PASS (state=${state}; architecture=${architectureVersion})`);
