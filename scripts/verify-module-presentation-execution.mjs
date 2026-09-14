import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const modulePresentation = await import(pathToFileURL(path.join(root, 'src/platform/contracts/module-presentation.ts')).href);
const runtime = await import(pathToFileURL(path.join(root, 'assets/js/runtime/module-presentation-host.ts')).href);
const { assessIframeRetirement } = modulePresentation;
const { createModulePresentationHost } = runtime;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const base = {
  name: 'Module', eyebrow: 'Test', description: 'Test module', route: './module.html', version: '1.0.0', status: 'active', accent: 'blue', icon: 'clock', capabilities: [], storageFormat: 'json', cloudStateKeys: [], userStateKeys: [], cloudStatePrefixes: [],
};
const retained = {
  ...base,
  id: 'time-tracker',
  presentationMode: 'same-origin-iframe',
  iframeRetirement: { decision: 'retain-iframe', blockers: ['native-mount-contract'] },
};
const premature = {
  ...base,
  id: 'fueltrack-plus',
  presentationMode: 'native-host',
  iframeRetirement: { decision: 'retire-iframe', blockers: ['native-regression-parity'], nativeBoundary: 'native/fueltrack.ts' },
};
const ready = {
  ...base,
  id: 'tradelink',
  presentationMode: 'native-host',
  iframeRetirement: { decision: 'retire-iframe', blockers: [], nativeBoundary: 'native/tradelink.ts' },
};
assert(assessIframeRetirement(retained).ready === false, 'Retained iframe module must not be retirement-ready.');
assert(assessIframeRetirement(premature).ready === false, 'Blocked native module must not be retirement-ready.');
assert(assessIframeRetirement(ready).ready === true, 'Fully governed native module must be retirement-ready.');

const iframeEvents = [];
const iframeHost = {
  moduleId: null,
  state: { kind: 'uninitialized', generation: 0, moduleId: null },
  attach(frame, module) { iframeEvents.push(['attach', frame, module.id]); this.moduleId = module.id; return () => {}; },
  detach() { iframeEvents.push(['detach']); this.moduleId = null; },
  publishIdentity() { return true; },
  invalidate(reason) { iframeEvents.push(['invalidate', reason]); return true; },
};
let nativeDisposed = false;
let nativeInvalidated = '';
const normalizedDataCalls = [];
const normalizedData = Object.freeze({
  registry: Object.freeze({ descriptors: [], list() { return []; }, resolve() { return null; }, resolveLegacy() { return null; } }),
  async load(moduleId, options) { normalizedDataCalls.push(['load', moduleId, options]); return { moduleId, entries: [], unmappedLegacyKeys: [] }; },
  async get(moduleId, canonicalKey, options) { normalizedDataCalls.push(['get', moduleId, canonicalKey, options]); return null; },
  async put(input) { normalizedDataCalls.push(['put', input]); return { moduleId: input.moduleId, canonicalKey: input.canonicalKey, legacyKey: input.canonicalKey, revision: 1, deleted: false }; },
  async delete(input) { normalizedDataCalls.push(['delete', input]); return { moduleId: input.moduleId, canonicalKey: input.canonicalKey, legacyKey: input.canonicalKey, revision: null, deleted: true }; },
  invalidate(moduleId) { normalizedDataCalls.push(['invalidate', moduleId]); return 1; },
});
const nativeAdapter = {
  moduleId: 'tradelink',
  boundary: 'native/tradelink.ts',
  async mount(context) {
    assert(context.identity.moduleId === 'tradelink', 'Native adapter must receive direct host identity.');
    assert(context.normalizedData.moduleId === 'tradelink', 'Native adapter must receive a module-scoped normalized-data port.');
    await context.normalizedData.load({ force: true });
    await context.normalizedData.get('state');
    await context.normalizedData.put({ canonicalKey: 'state', value: { ok: true } });
    await context.normalizedData.delete({ canonicalKey: 'state' });
    context.normalizedData.invalidate();
    return {
      dispose() { nativeDisposed = true; },
      invalidate(reason) { nativeInvalidated = reason; },
    };
  },
};
const nativeRegistry = {
  get(id) { return id === 'tradelink' ? nativeAdapter : null; },
  has(id) { return id === 'tradelink'; },
  list() { return [nativeAdapter]; },
};
const events = [];
const host = createModulePresentationHost({
  auth: { moduleIdentityContext(moduleId) { return { type: 'wm:module:identity', moduleId, user: { id: 'u1', email: 'user@example.com', displayName: 'User' }, role: 'Admin', permissions: [], issuedAt: new Date().toISOString() }; } },
  iframeHost,
  nativeRegistry,
  normalizedData,
  onEvent(event) { events.push(event.type); },
});
const frame = {};
host.attachIframe(frame, retained);
assert(host.mode === 'same-origin-iframe' && iframeEvents.some(([type]) => type === 'attach'), 'Hybrid host must delegate retained modules to iframe host.');
assert(await host.invalidate('host-refresh') === true, 'Iframe invalidation must delegate to iframe host.');
let rejected = false;
try { await host.mountNative({}, retained); } catch { rejected = true; }
assert(rejected, 'Hybrid host must reject native mounting for a retained iframe module.');
assert(await host.mountNative({}, ready) === true, 'Ready native adapter must report a committed mount.');
assert(host.mode === 'native-host' && events.includes('module:ready'), 'Hybrid host must mount a fully governed native adapter.');
assert(normalizedDataCalls.every((entry) => {
  const candidate = entry[0] === 'put' || entry[0] === 'delete' ? entry[1]?.moduleId : entry[1];
  return candidate === 'tradelink';
}), 'Native normalized-data calls must remain bound to the mounted module id.');
assert(await host.invalidate('backup-restore') === true && nativeInvalidated === 'backup-restore', 'Native invalidation must reach native adapter.');
host.detach();
assert(nativeDisposed, 'Native adapter must be disposed when host detaches.');

let resolveDeferred;
let staleDisposed = false;
const deferredRegistry = {
  get(id) {
    if (id !== 'tradelink') return null;
    return {
      moduleId: 'tradelink',
      boundary: 'native/tradelink.ts',
      async mount(context) {
        assert(context.normalizedData.moduleId === 'tradelink', 'Deferred native mount must retain module-scoped normalized-data authority.');
        await new Promise((resolve) => { resolveDeferred = resolve; });
        return { dispose() { staleDisposed = true; } };
      },
    };
  },
  has(id) { return id === 'tradelink'; },
  list() { return []; },
};
const staleHost = createModulePresentationHost({
  auth: { moduleIdentityContext(moduleId) { return { type: 'wm:module:identity', moduleId, user: { id: 'u1', email: 'user@example.com', displayName: 'User' }, role: 'Admin', permissions: [], issuedAt: new Date().toISOString() }; } },
  iframeHost: { ...iframeHost, detach() {} },
  nativeRegistry: deferredRegistry,
  normalizedData,
});
const pendingMount = staleHost.mountNative({}, ready);
staleHost.detach();
resolveDeferred();
assert(await pendingMount === false, 'Native mount resolving after detach must be rejected as stale.');
assert(staleDisposed, 'A stale native mount handle must be disposed immediately.');
assert(staleHost.mode === null && staleHost.moduleId === null, 'Stale native mount must not resurrect module ownership.');

let nativeFailureRejected = false;
const failureEvents = [];
const failureHost = createModulePresentationHost({
  auth: { moduleIdentityContext(moduleId) { return { type: 'wm:module:identity', moduleId, user: { id: 'u1', email: 'user@example.com', displayName: 'User' }, role: 'Admin', permissions: [], issuedAt: new Date().toISOString() }; } },
  iframeHost: { ...iframeHost, detach() {} },
  nativeRegistry: {
    get(id) {
      if (id !== 'tradelink') return null;
      return { moduleId: 'tradelink', boundary: 'native/tradelink.ts', async mount() { throw new Error('native-mount-test-failure'); } };
    },
    has(id) { return id === 'tradelink'; },
    list() { return []; },
  },
  normalizedData,
  onEvent(event) { failureEvents.push(event); },
});
try { await failureHost.mountNative({}, ready); } catch { nativeFailureRejected = true; }
assert(nativeFailureRejected, 'Native adapter mount failures must reject to the shell error boundary.');
assert(failureEvents.some((event) => event.type === 'module:error' && event.detail?.message === 'native-mount-test-failure'), 'Native adapter mount failures must publish module:error lifecycle parity.');
assert(failureEvents.some((event) => event.type === 'module:disposed'), 'Failed native mounts must release presentation ownership.');
assert(failureHost.mode === null && failureHost.moduleId === null, 'Failed native mounts must leave no active native ownership.');
console.log('Stage E M26 module-presentation execution vectors: PASS');
