import assert from 'node:assert/strict';
import { createFeatureRegistry } from '../assets/js/runtime/feature-registry.ts';
import { createRouteLifecycleCoordinator, resolveRoutePresentationOwner } from '../assets/js/runtime/route-lifecycle.ts';

let checks = 0;
const check = (fn) => { fn(); checks += 1; };
const manifest = Object.freeze({
  routes: Object.freeze([
    Object.freeze({ id:'account', pattern:'#/account', owner:'management' }),
    Object.freeze({ id:'settings', pattern:'#/settings', owner:'management' }),
    Object.freeze({ id:'users', pattern:'#/users', owner:'management' }),
  ]),
  features: Object.freeze([
    Object.freeze({ id:'management', state:'active', boundary:'src/app/management/AuthenticatedManagementUI.tsx', dependencies:Object.freeze(['authenticated-management-ui-runtime']) }),
  ]),
});

check(() => {
  const registry = createFeatureRegistry(manifest);
  registry.register('management', { activate(){}, deactivate(){} }, { views:['account','settings','users'] });
  assert.equal(registry.validate().valid, true);
  assert.deepEqual(registry.validate().missing, []);
});
check(() => {
  const registry = createFeatureRegistry(manifest);
  const implementation = Object.freeze({});
  registry.register('management', implementation);
  assert.equal(registry.get('management')?.implementation, implementation);
});
check(() => {
  const registry = createFeatureRegistry(manifest);
  registry.register('management', {});
  assert.throws(() => registry.register('management', {}), /already registered/);
});
check(() => {
  const registry = createFeatureRegistry(manifest);
  registry.register('management', {});
  for (const route of ['account','settings','users']) assert.equal(registry.ownerForRoute(route), 'management');
});
check(() => {
  const ownerForRoute = (name) => ['account','settings','users'].includes(name) ? 'management' : null;
  for (const route of ['account','settings','users']) assert.equal(resolveRoutePresentationOwner({ kind:'allow' }, { name:route }, ownerForRoute), 'management');
});
check(() => {
  const lifecycle = createRouteLifecycleCoordinator();
  const first = lifecycle.begin({ name:'account' }, 'management');
  assert.equal(lifecycle.commit(first.revision), true);
  const second = lifecycle.begin({ name:'settings' }, 'management');
  assert.equal(second.changed, true, 'route identity must still change even under one owner');
  assert.equal(lifecycle.getSnapshot().previousOwner, 'management');
  assert.equal(lifecycle.commit(second.revision), true);
  assert.equal(lifecycle.getSnapshot().owner, 'management');
});
check(() => {
  const lifecycle = createRouteLifecycleCoordinator();
  let transition = lifecycle.begin({ name:'settings' }, 'management');
  lifecycle.commit(transition.revision);
  transition = lifecycle.begin({ name:'users' }, 'management');
  const snapshot = lifecycle.getSnapshot();
  assert.equal(snapshot.previousRoute?.name, 'settings');
  assert.equal(snapshot.previousOwner, 'management');
  assert.equal(snapshot.owner, 'management');
});
check(() => {
  const lifecycle = createRouteLifecycleCoordinator();
  const transition = lifecycle.begin({ name:'users' }, 'management');
  lifecycle.commit(transition.revision);
  const same = lifecycle.begin({ name:'users' }, 'management');
  assert.equal(same.changed, false);
  assert.equal(same.revision, transition.revision);
});
check(() => {
  const lifecycle = createRouteLifecycleCoordinator();
  const management = lifecycle.begin({ name:'users' }, 'management');
  lifecycle.commit(management.revision);
  const forbidden = lifecycle.begin({ name:'users' }, 'shell');
  assert.equal(forbidden.changed, true);
  assert.equal(lifecycle.getSnapshot().previousOwner, 'management');
  assert.equal(lifecycle.getSnapshot().owner, 'shell');
});
check(() => {
  const registry = createFeatureRegistry(manifest);
  registry.register('management', {});
  assert.equal(registry.has('account'), false);
  assert.equal(registry.has('settings'), false);
  assert.equal(registry.has('user-management'), false);
});

console.log(`Stage G M44 Management Authority Consolidation deterministic verification: PASS (checks=${checks})`);
