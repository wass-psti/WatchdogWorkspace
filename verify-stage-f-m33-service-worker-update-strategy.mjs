import { readFile } from 'node:fs/promises';
const req = async (path) => readFile(new URL(path, import.meta.url), 'utf8');
const target = await req('./config/stage-f-m33-service-worker-update-strategy-target.ts');
const m32 = await req('./config/stage-f-m32-observability-target.ts');
const manifest = await req('./config/application-manifest.ts');
const manifestTypes = await req('./src/types/manifest.ts');
const runtimeSchema = await req('./src/runtime-schemas/manifest.ts');
const contract = await req('./src/platform/contracts/service-worker-update.ts');
const coordinator = await req('./assets/js/platform/update/service-worker-update.ts');
const serviceWorker = await req('./service-worker.js');
const runtimeAssets = await req('./config/runtime-assets.js');
const vite = await req('./vite.config.js');
const buildManifest = await req('./scripts/lib/service-worker-build-manifest.mjs');
const platform = await req('./assets/js/core/platform.ts');
const app = await req('./assets/js/app.ts');
const distVerifier = await req('./scripts/verify-dist.mjs');
const m32Verifier = await req('./verify-stage-f-m32-observability.mjs');
const pkg = JSON.parse(await req('./package.json'));
const architecture = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const checks = [
  ['M32 prerequisite certified', m32.includes("activationState: 'active-certified'")],
  ['M33 state', /activationState: '(?:implementation-complete-pending-certification|active-pending-release-certification|active-certified)'/.test(target)],
  ['architecture >=41', architecture >= 41],
  ['manifest authority', manifest.includes("serviceWorkerUpdates: 'build-scoped-explicit-update-v1'") && manifest.includes("serviceWorkerActivation: 'explicit-user-controlled-v1'") && manifest.includes("serviceWorkerCacheIdentity: 'deterministic-build-scoped-v1'")],
  ['manifest types', manifestTypes.includes("readonly serviceWorkerUpdates?: 'build-scoped-explicit-update-v1'")],
  ['runtime schema', runtimeSchema.includes("serviceWorkerUpdates: z.literal('build-scoped-explicit-update-v1')") && runtimeSchema.includes('Architecture v41+ requires the governed build-scoped explicit service-worker update authority.')],
  ['client contract', contract.includes("'update-ready'") && contract.includes("'controller-changed'") && contract.includes('minimumUpdateCheckIntervalMs')],
  ['registration bypasses HTTP update cache', coordinator.includes("SERVICE_WORKER_UPDATE_VIA_CACHE = 'none'") && coordinator.includes('updateViaCache: SERVICE_WORKER_UPDATE_VIA_CACHE')],
  ['foreground online throttled checks', coordinator.includes('SERVICE_WORKER_MINIMUM_UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000') && coordinator.includes("visibilitychange") && coordinator.includes("addEventListener('online'") && coordinator.includes('registration.update()')],
  ['explicit activation only', coordinator.includes("SERVICE_WORKER_ACTIVATE_MESSAGE = 'WM_ACTIVATE_UPDATE'") && serviceWorker.includes("const UPDATE_MESSAGE = 'WM_ACTIVATE_UPDATE'") && !serviceWorker.includes("self.addEventListener('install', (event) => {\n  self.skipWaiting")],
  ['legacy activation bridge lifecycle', architecture >= 43 ? (!serviceWorker.includes("LEGACY_UPDATE_MESSAGE") && !serviceWorker.includes("SKIP_WAITING")) : (serviceWorker.includes("const LEGACY_UPDATE_MESSAGE = 'SKIP_WAITING'") && serviceWorker.includes('type === UPDATE_MESSAGE || type === LEGACY_UPDATE_MESSAGE'))],
  ['deterministic build metadata', buildManifest.includes("createHash('sha256')") && buildManifest.includes("SERVICE_WORKER_STRATEGY_REVISION = 'm33-explicit-update-v1'") && buildManifest.includes('self.WM_RUNTIME_RELEASE') && vite.includes("runtimeAssetsSource(core)") && runtimeAssets.includes('WM_RUNTIME_RELEASE')],
  ['build-scoped cache identity', serviceWorker.includes('`${CACHE_NAMESPACE}-shell-${RELEASE.buildId') && serviceWorker.includes('isOwnedCache')],
  ['current-cache-only lookup', serviceWorker.includes('const openCurrentCache = () => caches.open(CACHE)') && !serviceWorker.includes('caches.match(request)')],
  ['navigation preload', serviceWorker.includes('registration.navigationPreload?.enable()') && serviceWorker.includes('event.preloadResponse')],
  ['navigation offline shell fallback', serviceWorker.includes("cache.match('./index.html')") && serviceWorker.includes('canCacheNavigation')],
  ['sensitive request network-only', serviceWorker.includes('hasSensitiveRequestHeaders') && serviceWorker.includes("fetch(request, { cache: 'no-store' })")],
  ['embedded applications network authoritative', serviceWorker.includes('isEmbeddedModuleRequest') && target.includes("embeddedApplications: 'network-authoritative-no-store-v1'")],
  ['multi-tab convergence', coordinator.includes("addEventListener('controllerchange'") && coordinator.includes('if (previousController) location.reload()') && serviceWorker.includes('self.clients.claim()')],
  ['observability integration', app.includes('recordServiceWorkerLifecycle') && app.includes("service_worker.update_dismissed") && app.includes('activateServiceWorkerUpdate(swUpdate, recordServiceWorkerLifecycle)')],
  ['dismissed update remains dismissed for the session', app.includes('if (updateDismissed) return;') && !app.includes('updateDismissed = false;\n  writeUpdateDismissed(false);\n  sharedApplicationUiRuntime.showUpdate();')],
  ['platform delegation', platform.includes('registerManagedServiceWorker({ onUpdate, onLifecycle })') && platform.includes('activateWaitingServiceWorker(registration, onLifecycle)')],
  ['dist verifier release metadata', distVerifier.includes('WM_RUNTIME_RELEASE') && distVerifier.includes('m33-explicit-update-v1')],
  ['M32 verifier forward compatible', m32Verifier.includes("['architecture >=40'" )],
  ['governed scripts', pkg.scripts?.['service-worker-update:check:governed'] === 'node verify-stage-f-m33-service-worker-update-strategy.mjs' && pkg.scripts?.['service-worker-update:test:governed'] === 'node --experimental-strip-types scripts/verify-service-worker-update-execution.mjs'],
  ['database unchanged by target', target.includes('migrationRequired: false') && target.includes('schemaChangeRequired: false')],
];
for (const [name, ok] of checks) if (!ok) throw new Error(`M33 verifier failed: ${name}`);
console.log(`Stage F Milestone 33 Service worker / update strategy verification: PASS (architecture=${architecture}; checks=${checks.length}; activation=explicit; cache=build-scoped; updateViaCache=none)`);
