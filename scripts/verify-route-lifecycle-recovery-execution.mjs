import assert from 'node:assert/strict';
import { createRouteLifecycleCoordinator, resolveRoutePresentationOwner } from '../assets/js/runtime/route-lifecycle.ts';
import { createRouteController } from '../assets/js/runtime/route-controller.ts';
import { presentationReadinessRuntime } from '../src/app/composition/presentation-readiness-runtime.ts';
import { createPresentationFrameToken, isPresentationFrameCurrent } from '../assets/js/runtime/presentation-frame-guard.ts';

let vectors = 0;
const vector = (name, fn) => { fn(); vectors += 1; console.log(`PASS: ${name}`); };
const owners = new Map([
  ['home','home'],['boards','boards'],['board','boards'],['users','management'],['settings','management'],['account','management'],['app','module-host'],['login','auth'],['register','auth'],['verify','auth'],
]);
const ownerForRoute = (name) => owners.get(name) ?? null;

vector('allowed routes resolve to their declared feature owner', () => {
  assert.equal(resolveRoutePresentationOwner({ kind:'allow' }, { name:'home' }, ownerForRoute), 'home');
  assert.equal(resolveRoutePresentationOwner({ kind:'allow' }, { name:'boards' }, ownerForRoute), 'boards');
  assert.equal(resolveRoutePresentationOwner({ kind:'allow' }, { name:'users' }, ownerForRoute), 'management');
  assert.equal(resolveRoutePresentationOwner({ kind:'allow' }, { name:'settings' }, ownerForRoute), 'management');
  assert.equal(resolveRoutePresentationOwner({ kind:'allow' }, { name:'account' }, ownerForRoute), 'management');
  assert.equal(resolveRoutePresentationOwner({ kind:'allow' }, { name:'app', moduleId:'time-tracker' }, ownerForRoute), 'module-host');
});
vector('disabled/recovery/wait states are owned by authentication presentation', () => {
  assert.equal(resolveRoutePresentationOwner({ kind:'render-disabled' }, { name:'account' }, ownerForRoute), 'auth');
  assert.equal(resolveRoutePresentationOwner({ kind:'render-auth-recovery' }, { name:'settings' }, ownerForRoute), 'auth');
  assert.equal(resolveRoutePresentationOwner({ kind:'wait' }, { name:'app', moduleId:'time-tracker' }, ownerForRoute), 'auth');
});
vector('forbidden route presentation is neutral shell-owned rather than protected-feature-owned', () => {
  assert.equal(resolveRoutePresentationOwner({ kind:'render-forbidden', reason:'users' }, { name:'users' }, ownerForRoute), 'shell');
  assert.equal(resolveRoutePresentationOwner({ kind:'render-forbidden', reason:'module' }, { name:'app', moduleId:'fueltrack-plus' }, ownerForRoute), 'shell');
});
vector('route lifecycle rejects stale generation commits', () => {
  const lifecycle = createRouteLifecycleCoordinator();
  const first = lifecycle.begin({ name:'home' }, 'home');
  const second = lifecycle.begin({ name:'boards' }, 'boards');
  assert.equal(lifecycle.commit(first.revision), false);
  assert.equal(lifecycle.commit(second.revision), true);
  assert.equal(lifecycle.getSnapshot().route?.name, 'boards');
  assert.equal(lifecycle.getSnapshot().owner, 'boards');
});
vector('same committed route preserves the committed generation without superseding pending focus', () => {
  const lifecycle = createRouteLifecycleCoordinator();
  const first = lifecycle.begin({ name:'account' }, 'management');
  assert.equal(first.changed, true);
  assert.equal(lifecycle.commit(first.revision), true);
  const repeat = lifecycle.begin({ name:'account' }, 'management');
  assert.equal(repeat.changed, false);
  assert.equal(repeat.revision, first.revision);
  assert.equal(lifecycle.getSnapshot().phase, 'committed');
  assert.equal(lifecycle.isCurrent(first.revision), true);
  assert.equal(lifecycle.commit(repeat.revision), false);
});
vector('route identity includes module and board identifiers', () => {
  const lifecycle = createRouteLifecycleCoordinator();
  let transition = lifecycle.begin({ name:'app', moduleId:'time-tracker' }, 'module-host');
  lifecycle.commit(transition.revision);
  transition = lifecycle.begin({ name:'app', moduleId:'fueltrack-plus' }, 'module-host');
  assert.equal(transition.changed, true);
  lifecycle.commit(transition.revision);
  transition = lifecycle.begin({ name:'board', boardId:'board-a' }, 'boards');
  assert.equal(transition.changed, true);
});
vector('previous owner and route remain observable during transition', () => {
  const lifecycle = createRouteLifecycleCoordinator();
  let transition = lifecycle.begin({ name:'settings' }, 'management');
  lifecycle.commit(transition.revision);
  transition = lifecycle.begin({ name:'users' }, 'management');
  const snapshot = lifecycle.getSnapshot();
  assert.equal(snapshot.previousRoute?.name, 'settings');
  assert.equal(snapshot.previousOwner, 'management');
  assert.equal(snapshot.route?.name, 'users');
  assert.equal(snapshot.owner, 'management');
});
vector('dispose invalidates the active generation and clears ownership', () => {
  const lifecycle = createRouteLifecycleCoordinator();
  const transition = lifecycle.begin({ name:'boards' }, 'boards');
  lifecycle.commit(transition.revision);
  lifecycle.dispose();
  const snapshot = lifecycle.getSnapshot();
  assert.equal(snapshot.phase, 'disposed');
  assert.equal(snapshot.route, null);
  assert.equal(snapshot.owner, null);
  assert.equal(lifecycle.isCurrent(transition.revision), false);
});


vector('capability-gated routes commit shell ownership until the protected presentation is ready', () => {
  const lifecycle = createRouteLifecycleCoordinator();
  let ready = false;
  let rendered = '';
  const controller = createRouteController({
    auth: { isAuthenticated:true, canManageUsers:true, state:{ initialized:true, status:'authenticated' }, canAccessModule:()=>true },
    parseRoute: () => ({ name:'boards' }),
    navigate: () => undefined,
    runtimeClient: { setContext: () => undefined },
    featureRegistry: {
      ownerForRoute: (name) => name === 'boards' ? 'boards' : null,
      get: () => ({ implementation:{} }),
    },
    moduleHost: { detach: () => undefined },
    renderers: { boards: () => { rendered = 'boards'; } },
    routePolicy: { decide: () => ({ kind:'allow' }) },
    lifecycle,
    resolvePresentation: ({ defaultOwner, defaultRenderer }) => ready
      ? { owner:defaultOwner, renderer:defaultRenderer }
      : { owner:'shell', renderer:() => { rendered = 'preflight'; } },
  });
  controller.render();
  assert.equal(rendered, 'preflight');
  assert.equal(controller.owner(), 'shell');
  assert.equal(lifecycle.getSnapshot().owner, 'shell');
  ready = true;
  controller.render();
  assert.equal(rendered, 'boards');
  assert.equal(controller.owner(), 'boards');
  assert.equal(lifecycle.getSnapshot().owner, 'boards');
});

vector('deferred same-URL presentation work is invalidated by a newer lifecycle generation', () => {
  const lifecycle = createRouteLifecycleCoordinator();
  const preflight = lifecycle.begin({ name:'boards' }, 'shell');
  lifecycle.commit(preflight.revision);
  const staleToken = createPresentationFrameToken('#/boards', lifecycle.getSnapshot());
  assert.equal(isPresentationFrameCurrent(staleToken, '#/boards', lifecycle.getSnapshot(), true), true);
  const protectedRoute = lifecycle.begin({ name:'boards' }, 'boards');
  lifecycle.commit(protectedRoute.revision);
  const current = lifecycle.getSnapshot();
  assert.equal(isPresentationFrameCurrent(staleToken, '#/boards', current, true), false);
  assert.equal(current.route?.name, 'boards');
  assert.equal(current.owner, 'boards');
});

vector('presentation readiness focuses only after the current owner acknowledges a visible target', () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const documentStub = { activeElement:null };
  const element = {
    isConnected:true,
    hidden:false,
    tabIndex:0,
    getAttribute:()=>null,
    getClientRects:()=>[{}],
    focus(){ documentStub.activeElement = this; },
    scrollIntoView(){},
  };
  globalThis.document = documentStub;
  globalThis.window = { getComputedStyle:()=>({ display:'block', visibility:'visible' }) };
  try {
    presentationReadinessRuntime.resetForTest();
    assert.equal(presentationReadinessRuntime.requestFocus({ revision:7, owner:'auth', isCurrent:(revision)=>revision===7 }), false);
    assert.equal(documentStub.activeElement, null);
    assert.equal(presentationReadinessRuntime.acknowledge('shell', element), false);
    assert.equal(documentStub.activeElement, null);
    assert.equal(presentationReadinessRuntime.acknowledge('auth', element), true);
    assert.equal(documentStub.activeElement, element);
    assert.equal(presentationReadinessRuntime.getSnapshot().pendingRevision, null);
  } finally {
    presentationReadinessRuntime.resetForTest();
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  }
});
console.log(`Stage G M40 route ownership/lifecycle execution verification: PASS (vectors=${vectors}; exclusiveOwnership=true; staleGenerationGuard=true; teardownModel=true)`);
