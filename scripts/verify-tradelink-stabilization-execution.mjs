import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'apps/tradelink/stability-runtime.js'), 'utf8');

const listeners = new Map();
const window = {
  addEventListener(type, handler) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(handler); },
  removeEventListener(type, handler) { listeners.get(type)?.delete(handler); },
  dispatchEvent(event) { for (const handler of listeners.get(event.type) ?? []) handler(event); return true; },
};
const memory = new Map();
let forceDivergence = false;
const store = {
  getItem(key) { return memory.get(String(key)) ?? null; },
  setItem(key, value) { memory.set(String(key), String(value)); },
  async setItemAsync(key, value) { memory.set(String(key), forceDivergence ? `${value}-remote` : String(value)); return true; },
  removeItem(key) { memory.delete(String(key)); },
  async flush() { return true; },
  async refresh() { return true; },
};
let lockAvailable = true;
let released = 0;
const locks = {
  async acquire(key) { return lockAvailable ? { key, token: 'token-1' } : null; },
  async release() { released += 1; return true; },
};
const context = vm.createContext({ console, window, queueMicrotask, WMModuleStore: store, WMModuleLocks: locks, Error, Promise, Set, Map, Object, String, Number, Boolean });
vm.runInContext(source, context, { filename: 'stability-runtime.js' });
const api = context.WMTradeLinkStability;
assert.ok(api, 'stability runtime must publish WMTradeLinkStability');

const gate = api.createMutationGate('test');
let releaseFirst;
const first = gate.run('same', () => new Promise((resolve) => { releaseFirst = resolve; }));
await assert.rejects(() => gate.run('same', async () => true), /already in progress/i);
releaseFirst(true);
await first;
assert.equal(await gate.run('same', async () => 2), 2);

const queue = api.createSerialTaskQueue();
const order = [];
await Promise.all([
  queue.run(async () => { order.push('a1'); await Promise.resolve(); order.push('a2'); }),
  queue.run(async () => { order.push('b1'); }),
]);
assert.deepEqual(order, ['a1', 'a2', 'b1']);

await api.confirmedSet('shared', '{"ok":true}');
assert.equal(store.getItem('shared'), '{"ok":true}');
forceDivergence = true;
await assert.rejects(() => api.confirmedSet('shared', '{"ok":false}'), /diverged/i);
forceDivergence = false;
await api.confirmedRemove('shared');
assert.equal(store.getItem('shared'), null);

assert.equal(await api.withWorkspaceLock(async (lock) => lock.key), 'tradelink:workspace-state');
assert.equal(released, 1);
lockAvailable = false;
await assert.rejects(() => api.withWorkspaceLock(async () => true), /another session/i);
lockAvailable = true;

let bridgeEvents = 0;
const bridge = api.createStoreChangeBridge({ keys: ['shared'], onChange: async () => { bridgeEvents += 1; } });
window.dispatchEvent({ type: 'storage', key: 'shared' });
await new Promise((resolve) => { setImmediate(resolve); });
window.dispatchEvent({ type: 'wm:module-store-change', detail: { key: 'shared' } });
await new Promise((resolve) => { setImmediate(resolve); });
window.dispatchEvent({ type: 'pageshow', persisted: true });
await new Promise((resolve) => { setImmediate(resolve); });
assert.equal(bridgeEvents, 3);
bridge.dispose();
window.dispatchEvent({ type: 'storage', key: 'shared' });
await new Promise((resolve) => { setImmediate(resolve); });
assert.equal(bridgeEvents, 3);

console.log('Stage E M25 TradeLink stabilization execution vectors: PASS');
