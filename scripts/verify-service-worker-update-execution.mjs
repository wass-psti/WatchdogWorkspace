import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import {
  SERVICE_WORKER_ACTIVATE_MESSAGE,
  SERVICE_WORKER_MINIMUM_UPDATE_CHECK_INTERVAL_MS,
  SERVICE_WORKER_UPDATE_VIA_CACHE,
  activateWaitingServiceWorker,
  shouldCheckForServiceWorkerUpdate,
} from '../assets/js/platform/update/service-worker-update.ts';
import { createServiceWorkerRuntimeManifest } from './lib/service-worker-build-manifest.mjs';

let assertions = 0;
const assert = (condition, message) => {
  if (!condition) throw new Error(`M33 execution verifier failed: ${message}`);
  assertions += 1;
};

assert(SERVICE_WORKER_UPDATE_VIA_CACHE === 'none', 'registration must bypass HTTP cache during update checks');
assert(SERVICE_WORKER_MINIMUM_UPDATE_CHECK_INTERVAL_MS === 300_000, 'foreground/online update checks must use the five-minute throttle');
assert(shouldCheckForServiceWorkerUpdate(0, 1000), 'first update check must be eligible');
assert(!shouldCheckForServiceWorkerUpdate(1000, 1000 + 299_999), 'update check must be throttled before five minutes');
assert(shouldCheckForServiceWorkerUpdate(1000, 1000 + 300_000), 'update check must be eligible at five minutes');

const activationMessages = [];
const activationEvents = [];
activateWaitingServiceWorker({
  waiting: {
    scriptURL: 'https://example.test/service-worker.js',
    postMessage(message) { activationMessages.push(message); },
  },
}, (event) => activationEvents.push(event));
assert(activationMessages[0]?.type === SERVICE_WORKER_ACTIVATE_MESSAGE, 'client activation must use WM_ACTIVATE_UPDATE');
assert(activationEvents[0]?.type === 'activation-requested', 'activation request must be observable');

let noWaitingFailed = false;
try { activateWaitingServiceWorker({ waiting: null }); } catch { noWaitingFailed = true; }
assert(noWaitingFailed, 'activation must fail closed when no worker is waiting');

const manifestA = createServiceWorkerRuntimeManifest(['./index.html', './build/b.js', './build/a.js', './index.html']);
const manifestB = createServiceWorkerRuntimeManifest(['./build/a.js', './index.html', './build/b.js']);
const manifestC = createServiceWorkerRuntimeManifest(['./build/a.js', './index.html', './build/c.js']);
assert(manifestA.release.buildId === manifestB.release.buildId, 'build id must be deterministic regardless of input ordering/duplicates');
assert(manifestA.release.buildId !== manifestC.release.buildId, 'build id must change when the emitted runtime asset graph changes');
assert(manifestA.assets.length === 3 && manifestA.assets[0] === './build/a.js', 'generated runtime assets must be unique and deterministic');
assert(manifestA.source.includes('WM_RUNTIME_RELEASE') && manifestA.source.includes('m33-explicit-update-v1'), 'generated manifest source must contain M33 release metadata');

const source = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');
const listeners = new Map();
const stores = new Map();
const deletedCaches = [];
const fetchCalls = [];
let networkFailure = false;
let skipWaitingCalls = 0;
let claimCalls = 0;
let navigationPreloadCalls = 0;
const clientMessages = [];

const normalizeKey = (request) => typeof request === 'string' ? request : request.url;
const currentResponses = new Map();
const cacheApi = (name) => ({
  async addAll(paths) {
    for (const path of paths) currentResponses.set(`${name}:${path}`, new Response(`cached:${path}`, { status: 200 }));
  },
  async match(request) {
    return currentResponses.get(`${name}:${normalizeKey(request)}`) ?? null;
  },
  async put(request, response) {
    currentResponses.set(`${name}:${normalizeKey(request)}`, response);
  },
});
const caches = {
  async open(name) { if (!stores.has(name)) stores.set(name, cacheApi(name)); return stores.get(name); },
  async keys() { return ['unrelated-cache', 'work-management-v1.43.2', 'work-management-v1.43.2-shell-old-build', ...stores.keys()]; },
  async delete(name) { deletedCaches.push(name); stores.delete(name); return true; },
};

const release = Object.freeze({
  schema: 'wm-runtime-release-v1',
  appVersion: '1.43.2',
  strategyRevision: 'm33-explicit-update-v1',
  buildId: 'fixture-build-1234',
  cacheNamespace: 'work-management-v1.43.2',
});
const selfObject = {
  WM_RUNTIME_RELEASE: undefined,
  WM_RUNTIME_ASSETS: undefined,
  location: { origin: 'https://example.test' },
  registration: { navigationPreload: { async enable() { navigationPreloadCalls += 1; } } },
  clients: {
    async claim() { claimCalls += 1; },
    async matchAll() { return [{ postMessage(message) { clientMessages.push(message); } }]; },
  },
  async skipWaiting() { skipWaitingCalls += 1; },
  addEventListener(type, listener) { listeners.set(type, listener); },
};
const context = vm.createContext({
  self: selfObject,
  caches,
  URL,
  Request,
  Response,
  Headers,
  Promise,
  console,
  importScripts(path) {
    if (path !== './config/runtime-assets.js') throw new Error(`unexpected importScripts path: ${path}`);
    selfObject.WM_RUNTIME_RELEASE = release;
    selfObject.WM_RUNTIME_ASSETS = Object.freeze(['./', './index.html', './build/index-fixture.js']);
  },
  async fetch(request, init = {}) {
    fetchCalls.push({ url: normalizeKey(request), init });
    if (networkFailure) throw new Error('fixture network offline');
    return new Response(`network:${normalizeKey(request)}`, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  },
});
vm.runInContext(source, context, { filename: 'service-worker.js' });

for (const type of ['install', 'message', 'activate', 'fetch']) assert(listeners.has(type), `service worker must register ${type} listener`);

const installWaits = [];
listeners.get('install')({ waitUntil(promise) { installWaits.push(Promise.resolve(promise)); } });
await Promise.all(installWaits);
const cacheName = 'work-management-v1.43.2-shell-fixture-build-1234';
assert(stores.has(cacheName), 'install must create deterministic build-scoped cache');
assert(currentResponses.has(`${cacheName}:./index.html`), 'install must precache the shell fallback');

const legacyAliasPresent = source.includes("SKIP_WAITING");
const legacyWaits = [];
listeners.get('message')({ data: { type: 'SKIP_WAITING' }, waitUntil(promise) { legacyWaits.push(Promise.resolve(promise)); } });
await Promise.all(legacyWaits);
assert(skipWaitingCalls === (legacyAliasPresent ? 1 : 0), legacyAliasPresent ? 'legacy SKIP_WAITING alias must remain functional before retirement' : 'retired SKIP_WAITING alias must not activate M35+ workers');
const modernWaits = [];
listeners.get('message')({ data: { type: 'WM_ACTIVATE_UPDATE' }, waitUntil(promise) { modernWaits.push(Promise.resolve(promise)); } });
await Promise.all(modernWaits);
assert(skipWaitingCalls === (legacyAliasPresent ? 2 : 1), 'M33 activation message must promote the waiting worker');

const releaseReplies = [];
listeners.get('message')({ data: { type: 'WM_GET_RELEASE' }, ports: [{ postMessage(message) { releaseReplies.push(message); } }] });
assert(releaseReplies[0]?.release?.buildId === release.buildId, 'release query must expose active build identity');
assert(releaseReplies[0]?.cacheName === cacheName, 'release query must expose current cache identity');

const activateWaits = [];
listeners.get('activate')({ waitUntil(promise) { activateWaits.push(Promise.resolve(promise)); } });
await Promise.all(activateWaits);
assert(deletedCaches.includes('work-management-v1.43.2'), 'activation must remove the legacy permanent cache');
assert(deletedCaches.includes('work-management-v1.43.2-shell-old-build'), 'activation must remove obsolete build-scoped caches');
assert(!deletedCaches.includes('unrelated-cache'), 'activation must not delete unrelated caches');
assert(navigationPreloadCalls === 1, 'activation must enable Navigation Preload best effort');
assert(claimCalls === 1, 'activated update must claim controlled clients for convergence');
assert(clientMessages[0]?.type === 'WM_SW_ACTIVATED', 'activation must broadcast release metadata to clients');

async function dispatchFetch(request, preloadResponse = undefined) {
  let responsePromise;
  listeners.get('fetch')({
    request,
    preloadResponse: Promise.resolve(preloadResponse),
    respondWith(promise) { responsePromise = Promise.resolve(promise); },
  });
  return responsePromise ? responsePromise : null;
}

const sensitive = new Request('https://example.test/api/private', { headers: { authorization: 'Bearer secret' } });
await dispatchFetch(sensitive);
assert(fetchCalls.at(-1)?.init?.cache === 'no-store', 'credential-bearing requests must bypass caches');

const embedded = new Request('https://example.test/apps/time-tracker/app.js');
Object.defineProperty(embedded, 'destination', { value: 'script' });
await dispatchFetch(embedded);
assert(fetchCalls.at(-1)?.init?.cache === 'no-store', 'embedded application assets must remain network-authoritative');

const hashedRequest = new Request('https://example.test/build/index-fixture.js');
Object.defineProperty(hashedRequest, 'destination', { value: 'script' });
const currentCache = await caches.open(cacheName);
await currentCache.put(hashedRequest, new Response('hashed-cache-hit'));
const fetchCountBeforeHashed = fetchCalls.length;
const hashedResponse = await dispatchFetch(hashedRequest);
assert(await hashedResponse.text() === 'hashed-cache-hit', 'hashed build assets must use the current build cache first');
assert(fetchCalls.length === fetchCountBeforeHashed, 'hashed current-cache hit must not reach network');

const mutable = new Request('https://example.test/assets/js/runtime/module-bootstrap.js');
Object.defineProperty(mutable, 'destination', { value: 'script' });
await dispatchFetch(mutable);
assert(fetchCalls.at(-1)?.init?.cache === 'no-store', 'mutable shared runtime must remain network-first');

const navigationRequest = new Request('https://example.test/', { method: 'GET' });
Object.defineProperty(navigationRequest, 'mode', { value: 'navigate' });
const preload = new Response('navigation-preload', { status: 200 });
const navResponse = await dispatchFetch(navigationRequest, preload);
assert(await navResponse.text() === 'navigation-preload', 'navigation must consume preload response before duplicate network fetch');

const queryNavigation = new Request('https://example.test/?debug=1', { method: 'GET' });
Object.defineProperty(queryNavigation, 'mode', { value: 'navigate' });
await dispatchFetch(queryNavigation, new Response('query-navigation', { status: 200 }));
assert(!currentResponses.has(`${cacheName}:https://example.test/?debug=1`), 'query-bearing navigation must not be cached');

networkFailure = true;
const offlineNavigation = new Request('https://example.test/offline-route', { method: 'GET' });
Object.defineProperty(offlineNavigation, 'mode', { value: 'navigate' });
const offlineNavigationResponse = await dispatchFetch(offlineNavigation);
assert((await offlineNavigationResponse.text()).includes('cached:./index.html'), 'offline host navigation must fall back to the current build shell');

const offlineEmbedded = new Request('https://example.test/apps/tradelink/app.js');
Object.defineProperty(offlineEmbedded, 'destination', { value: 'script' });
const offlineEmbeddedResponse = await dispatchFetch(offlineEmbedded);
assert(offlineEmbeddedResponse.status === 503, 'offline embedded application requests must fail explicitly with HTTP 503');
networkFailure = false;

console.log(`M33 service-worker/update execution vectors: PASS (assertions=${assertions}; activation=explicit; cache=build-scoped; updateViaCache=none; navigationPreload=verified; offlinePolicy=verified; legacyBridge=${legacyAliasPresent ? 'verified' : 'retired'})`);
