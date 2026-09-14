import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const activationState = (file) => read(file).match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';

const state = activationState('config/stage-e-m26-iframe-retirement-target.ts');
const m25 = activationState('config/stage-e-m25-tradelink-stabilization-target.ts');
const target = read('config/stage-e-m26-iframe-retirement-target.ts');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const types = read('src/types/manifest.ts');
const moduleTypes = read('src/types/modules.ts');
const modulePresentationContract = read('src/platform/contracts/module-presentation.ts');
const schema = read('src/runtime-schemas/manifest.ts');
const moduleSchema = read('src/runtime-schemas/modules.ts');
const modules = read('config/modules.ts');
const presentationHost = read('assets/js/runtime/module-presentation-host.ts');
const nativeRegistry = read('assets/js/features/modules/native-module-registry.ts');
const app = read('assets/js/app.ts');
const pkg = JSON.parse(read('package.json'));
const ci = read('.github/workflows/ci.yml');
const deploy = read('.github/workflows/deploy-pages.yml');
const project = read('verify-project.sh');
const stageECertifier = read('scripts/certify-stage-e-platform.mjs');
const architecture = read('docs/architecture/ARCHITECTURE.md');
const historicalNonvisualVerifier = read('verify-v1410-nonvisual-runtime.mjs');

assert(m25 === 'active-certified', `M26 requires M25 active-certified; found ${m25}.`);
assert(['implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Invalid M26 state ${state}.`);
assert(architectureVersion >= 34, `M26 requires Architecture 34+; found ${architectureVersion}.`);
for (const marker of [
  "modulePresentation: 'hybrid-native-retirement-gated-v1'",
  "modulePresentationHost: 'assets/js/runtime/module-presentation-host.ts'",
  "moduleRetirementPolicy: 'config/stage-e-m26-iframe-retirement-target.ts'",
  "moduleIsolation: 'hybrid-native-or-same-origin-iframe'",
]) assert(manifest.includes(marker), `Application manifest missing M26 authority: ${marker}`);
assert(types.includes("modulePresentation?: 'hybrid-native-retirement-gated-v1'") && types.includes("moduleIsolation: 'same-origin-iframe' | 'hybrid-native-or-same-origin-iframe'"), 'Manifest types must expose the Architecture 34 hybrid presentation authority.');
assert(schema.includes("modulePresentation: z.literal('hybrid-native-retirement-gated-v1').optional()") && schema.includes('Architecture v34+ requires the hybrid module-presentation host and explicit iframe-retirement policy.'), 'Runtime manifest schema must enforce the Architecture 34 hybrid presentation contract.');
assert(moduleTypes.includes("export type ModulePresentationMode = 'same-origin-iframe' | 'native-host'") && moduleTypes.includes('export type IframeRetirementBlocker =') && moduleTypes.includes('presentationMode: ModulePresentationMode') && moduleTypes.includes('iframeRetirement: IframeRetirementProfile'), 'Module type contract must own presentation mode and iframe-retirement metadata without depending on the presentation service.');
assert(moduleSchema.includes("modulePresentationModeSchema = z.enum(['same-origin-iframe', 'native-host'])") && moduleSchema.includes('cannot retire iframe isolation without native-host presentation'), 'Module runtime schema must validate native retirement readiness.');

for (const marker of [
  "export type { IframeRetirementBlocker, IframeRetirementDecision, IframeRetirementProfile, ModulePresentationMode } from '../../types/modules.ts'",
  'assessIframeRetirement',
  "module.presentationMode === 'native-host'",
  'blockers.length === 0',
  'nativeBoundary !== null',
  'export interface NativeModuleDataPort',
  "readonly normalizedData: NativeModuleDataPort",
]) assert(modulePresentationContract.includes(marker), `M26 retirement contract missing ${marker}.`);
for (const marker of ['createModulePresentationHost', 'attachIframe', 'mountNative', 'assessIframeRetirement(module)', 'nativeRegistry.get(module.id)', 'auth.moduleIdentityContext(module.id)', 'bindNormalizedData(normalizedData, module.id)', 'lifecycleEpoch', 'mountedHandle.dispose()', "type: 'module:error'", "type: 'module:disposed'", 'return false']) assert(presentationHost.includes(marker), `Hybrid presentation host missing ${marker}.`);
assert(app.includes('normalizedData: platformServices.modules.normalizedData'), 'Shell must inject the M22 normalized module-data service into the native presentation host.');
assert(nativeRegistry.includes('registerNativeModuleAdapter') && nativeRegistry.includes('Native module adapter already registered'), 'Native module registry must provide duplicate-safe adapter registration.');

const assessmentBlocks = [...modules.matchAll(/presentationMode:\s*'([^']+)'[\s\S]*?iframeRetirement:\s*\{[\s\S]*?decision:\s*'([^']+)'[\s\S]*?blockers:\s*\[([\s\S]*?)\][\s\S]*?\}/g)];
assert(assessmentBlocks.length === 3, `Expected explicit retirement metadata for 3 modules; found ${assessmentBlocks.length}.`);
for (const [, mode, decision, blockers] of assessmentBlocks) {
  assert(mode === 'same-origin-iframe', `No M26 module is justified for native-host yet; found ${mode}.`);
  assert(decision === 'retain-iframe', `No M26 module should claim iframe retirement yet; found ${decision}.`);
  assert(blockers.includes('native-mount-contract') && blockers.includes('native-regression-parity'), 'Retained iframe module must declare concrete retirement blockers.');
}
for (const moduleId of ['time-tracker','fueltrack-plus','tradelink']) assert(target.includes(`moduleId: '${moduleId}'`) && target.includes(`'${moduleId}'`), `M26 target missing ${moduleId} assessment.`);
assert(target.includes('retiredModuleIds: Object.freeze([] as ModuleId[])'), 'M26 must not claim an unsafe iframe retirement.');
assert(target.includes("retainedModuleIds: Object.freeze(['time-tracker', 'fueltrack-plus', 'tradelink']"), 'M26 must retain all three current compatibility islands.');
assert(target.includes('justifiedRetirementCount: 0') && target.includes('unsafeIframeRetirementAttempted: false') && target.includes('iframeIsPlatformDefault: false'), 'M26 target must record zero justified retirements and per-module compatibility ownership.');
assert(target.includes('requireModuleScopedNormalizedDataPort: true') && target.includes('nativeDataPortModuleScoped: true') && target.includes('nativeMountFailureLifecycleParity: true'), 'M26 target must preserve module-scoped native data isolation and native mount failure lifecycle parity.');

for (const marker of [
  "const iframeMode = mod.presentationMode === 'same-origin-iframe'",
  'modulePresentationHost.attachIframe(moduleFrame, mod)',
  'modulePresentationHost.mountNative(nativeHost, mod)',
  'if (!mounted) return',
  "presentationMode: 'native-host'",
  'modulePresentationHost.detach()',
]) assert(app.includes(marker), `Shell module route must implement the hybrid presentation path: ${marker}`);
assert(app.includes("featureRegistry.register('module-host', modulePresentationHost") && app.includes('nativeRetirementGate: true'), 'Runtime feature registry must advertise the retirement-gated hybrid module host.');
assert(app.includes("wm:module-store-invalidate") && app.includes('modulePresentationHost.invalidate(reason)'), 'Shell invalidation must route through the hybrid presentation authority.');
assert(historicalNonvisualVerifier.includes('/wm:module-store-invalidate[\\s\\S]+modulePresentationHost\\.invalidate/') && !historicalNonvisualVerifier.includes('/wm:module-store-invalidate[\\s\\S]+moduleHost\\.invalidate/'), 'Historical v1.41 verifier must follow the Architecture 34 presentation-host invalidation authority.');

for (const key of ['iframe-retirement:check','iframe-retirement:status','iframe-retirement:activate','iframe-retirement:activate:release']) assert(pkg.scripts[key], `Package scripts missing ${key}.`);
assert(pkg.scripts.check.includes('iframe-retirement:check') && pkg.scripts['release:check'].includes('iframe-retirement:check'), 'Aggregate package gates must include M26.');
assert(ci.includes('Stage E M26 iframe retirement') && ci.includes('npm run iframe-retirement:check'), 'CI must enforce M26.');
assert(deploy.includes('Stage E M26 iframe retirement') && deploy.includes('npm run iframe-retirement:check'), 'Pages deployment must enforce M26.');
assert(project.includes('verify-stage-e-m26-iframe-retirement.mjs') && project.includes('scripts/verify-module-presentation-execution.mjs') && project.includes('assets/js/runtime/module-presentation-host.ts'), 'Aggregate verifier must require M26 artifacts.');
assert(stageECertifier.includes('iframe-retirement:activate:release') && stageECertifier.includes('M26 Iframe retirement: active-certified'), 'Stage E certifier must activate and report M26.');
assert(architecture.includes('## Stage E M26 — Retire iframe compatibility where justified'), 'Architecture documentation must record M26.');
assert(target.includes('newExternalDependency: null') && target.includes('supabaseMigrationRequired: false'), 'M26 must declare no dependency and no migration.');
assert(!fs.existsSync(path.join(root, 'supabase/migrations/v1.43.2-stage-e-m26-iframe-retirement.sql')), 'M26 must not introduce a Supabase migration.');

const historicalSources = fs.readdirSync(root).filter((name) => /^verify-.*\.mjs$/.test(name));
for (const name of historicalSources) {
  if (name === 'verify-stage-e-m26-iframe-retirement.mjs') continue;
  const source = read(name);
  assert(!/architectureVersion\s*===\s*33/.test(source), `${name} contains an obsolete exact Architecture 33 assertion.`);
  assert(!/moduleIsolation[^\n]*(?:===|==|includes\([^\n]*)[^\n]*same-origin-iframe/.test(source), `${name} contains an obsolete iframe-only module-isolation assertion.`);
}

const execution = spawnSync(process.execPath, ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', 'scripts/verify-module-presentation-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M26 module-presentation execution vectors failed.');

console.log(`Stage E Milestone 26 iframe-retirement verification: PASS (state=${state}; architecture=${architectureVersion}; retired=0; retained=3)`);
