import { test, expect } from '@playwright/test';
import { installM39Fixture, installM40CompositionDiagnostics, seedM39Session, waitForM39Identity, waitForM40ApplicationReady } from './helpers/m39-auth-fixture.mjs';

const routeTable = [
  { path:'boards', route:'boards', owner:'boards', surface:'boards' },
  { path:'users', route:'users', owner:'user-management', surface:'management' },
  { path:'settings', route:'settings', owner:'settings', surface:'management' },
  { path:'account', route:'account', owner:'account', surface:'management' },
  { path:'app/time-tracker', route:'app', owner:'module-host', surface:'runtime', moduleId:'time-tracker' },
  { path:'app/tradelink', route:'app', owner:'module-host', surface:'runtime', moduleId:'tradelink' },
  { path:'', route:'home', owner:'home', surface:'runtime' },
];

async function navigate(page, path) {
  const target = `#/${path}`;
  const current = await page.evaluate(() => location.hash || '#/');
  expect(current).not.toBe(target);
  await page.evaluate((nextHash) => { location.hash = nextHash; }, target);
}

async function triggerIdentityRevalidation(page) {
  await page.evaluate(() => {
    globalThis.__m40IdentityRevalidation = { settled:false, error:null };
    void globalThis.WorkManagementRuntime.execute('identity.revalidate').then(
      () => { globalThis.__m40IdentityRevalidation = { settled:true, error:null }; },
      (error) => { globalThis.__m40IdentityRevalidation = { settled:true, error:error instanceof Error ? error.message : String(error) }; },
    );
  });
}

async function expectIdentityRevalidationSettled(page) {
  await page.waitForFunction(() => globalThis.__m40IdentityRevalidation?.settled === true);
  const error = await page.evaluate(() => globalThis.__m40IdentityRevalidation?.error ?? null);
  expect(error).toBeNull();
}

async function surfaceSnapshot(page) {
  return page.evaluate(async () => {
    const visible = (element) => Boolean(element && !element.hidden && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' && element.getClientRects().length > 0);
    const auth = document.querySelector('[data-wm-authentication-ui-host]');
    const management = document.querySelector('[data-wm-authenticated-management-ui-host]');
    const boards = document.querySelector('[data-wm-board-presentation-host]');
    const runtime = document.querySelector('[data-wm-runtime-host]');
    const lifecycle = await globalThis.WorkManagementRuntime?.get('route-lifecycle.current');
    const context = globalThis.WorkManagementRuntime?.getContext();
    const activeSurfaces = { auth:visible(auth), management:visible(management), boards:visible(boards), runtime:visible(runtime) };
    return {
      hash: location.hash || '#/',
      lifecycle,
      context,
      active: Object.values(activeSurfaces).filter(Boolean).length,
      ...activeSurfaces,
      reactShellRoots: document.querySelectorAll('[data-wm-react-shell-root]').length,
      runtimeHosts: document.querySelectorAll('[data-wm-runtime-host]').length,
      boardHosts: document.querySelectorAll('[data-wm-board-presentation-host]').length,
      overlayHosts: document.querySelectorAll('[data-wm-global-overlay-host]').length,
      moduleFrames: document.querySelectorAll('#moduleFrame').length,
      nativeHosts: document.querySelectorAll('#nativeModuleHost').length,
      focusId: document.activeElement?.id || '',
      focusTag: document.activeElement?.tagName || '',
      managementRoute: management?.getAttribute('data-wm-management-route') ?? null,
      boardRoute: boards?.getAttribute('data-wm-board-presentation-route') ?? null,
      authView: auth?.getAttribute('data-wm-authentication-ui-view') ?? auth?.querySelector('[data-wm-authentication-ui-view]')?.getAttribute('data-wm-authentication-ui-view') ?? null,
      runtimeHidden: runtime?.hidden ?? null,
      managementHidden: management?.hidden ?? null,
      boardsHidden: boards?.hidden ?? null,
    };
  });
}

async function expectCommittedSurface(page, expected, diagnostics = null) {
  await page.waitForFunction(async ({ route, owner, moduleId, surface }) => {
    const runtime = globalThis.WorkManagementRuntime;
    if (!runtime) { globalThis.__wmM40CommittedStable = null; return false; }
    const lifecycle = await runtime.get('route-lifecycle.current');
    const context = runtime.getContext();
    const visible = (element) => Boolean(element && !element.hidden && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' && element.getClientRects().length > 0);
    const surfaces = {
      auth: visible(document.querySelector('[data-wm-authentication-ui-host]')),
      management: visible(document.querySelector('[data-wm-authenticated-management-ui-host]')),
      boards: visible(document.querySelector('[data-wm-board-presentation-host]')),
      runtime: visible(document.querySelector('[data-wm-runtime-host]')),
    };
    const ready = lifecycle?.phase === 'committed'
      && lifecycle?.route?.name === route
      && lifecycle?.owner === owner
      && context?.route === route
      && (!moduleId || context?.moduleId === moduleId)
      && document.querySelectorAll('[data-wm-react-shell-root]').length === 1
      && document.querySelectorAll('[data-wm-runtime-host]').length === 1
      && document.querySelectorAll('[data-wm-board-presentation-host]').length === 1
      && document.querySelectorAll('[data-wm-global-overlay-host]').length === 1
      && Object.values(surfaces).filter(Boolean).length === 1
      && surfaces[surface] === true;
    const key = ready ? `${route}:${owner}:${moduleId || ''}:${surface}:${performance.timeOrigin}` : '';
    const previous = globalThis.__wmM40CommittedStable;
    if (!ready) { globalThis.__wmM40CommittedStable = null; return false; }
    if (!previous || previous.key !== key) {
      globalThis.__wmM40CommittedStable = { key, since:performance.now() };
      return false;
    }
    return performance.now() - previous.since >= 250;
  }, expected, { timeout: 7_500 });

  const state = await surfaceSnapshot(page);
  const diagnosticState = diagnostics ? await diagnostics.read() : null;
  expect(state.reactShellRoots, JSON.stringify({ expected, state, diagnostics:diagnosticState }, null, 2)).toBe(1);
  expect(state.runtimeHosts, JSON.stringify({ expected, state, diagnostics:diagnosticState }, null, 2)).toBe(1);
  expect(state.boardHosts, JSON.stringify({ expected, state, diagnostics:diagnosticState }, null, 2)).toBe(1);
  expect(state.overlayHosts, JSON.stringify({ expected, state, diagnostics:diagnosticState }, null, 2)).toBe(1);
  expect(state.active, JSON.stringify({ expected, state, diagnostics:diagnosticState }, null, 2)).toBe(1);
  expect(state[expected.surface], JSON.stringify({ expected, state, diagnostics:diagnosticState }, null, 2)).toBe(true);
  expect(state.moduleFrames + state.nativeHosts, JSON.stringify({ expected, state, diagnostics:diagnosticState }, null, 2)).toBeLessThanOrEqual(1);
  if (expected.moduleId) expect(state.moduleFrames + state.nativeHosts, JSON.stringify({ expected, state, diagnostics:diagnosticState }, null, 2)).toBe(1);
  await page.waitForFunction((surface) => {
    const roots = {
      auth: document.querySelector('[data-wm-authentication-ui-host]'),
      management: document.querySelector('[data-wm-authenticated-management-ui-host]'),
      boards: document.querySelector('[data-wm-board-presentation-host]'),
      runtime: document.querySelector('[data-wm-runtime-host]'),
    };
    const active = document.activeElement;
    // Route commit initially targets #main, but an embedded/native application may
    // legitimately move focus deeper inside its owned runtime surface. M40 guards
    // focus ownership, not permanent focus pinning to one element.
    return Boolean(active)
      && active !== document.body
      && active !== document.documentElement
      && Boolean(roots[surface]?.contains(active));
  }, expected.surface, { timeout: 5_000 });
}

async function readPlatformSession(page) {
  return page.evaluate(() => localStorage.getItem('wm.platform.auth.session.v1'));
}

async function openCommandPalette(page) {
  const command = page.locator('[data-command]').first();
  if (await command.count()) {
    await command.click();
    await expect(page.locator('[data-wm-shared-command-palette]')).toBeVisible();
  }
}

test('@m40-route-cycle repeated Home/Boards/Users/Settings/Account/application transitions preserve one active owner and host', async ({ page }) => {
  test.setTimeout(60_000);
  const diagnostics = await installM40CompositionDiagnostics(page);
  await seedM39Session(page, { principal:'admin' });
  await installM39Fixture(page, { principal:'admin' });
  await page.goto('/#/');
  await waitForM39Identity(page, { role:'admin_general_manager' });
  await waitForM40ApplicationReady(page);
  const platformSessionBeforeEmbeddedRoutes = await readPlatformSession(page);
  expect(platformSessionBeforeEmbeddedRoutes).not.toBeNull();
  for (let cycle = 0; cycle < 3; cycle += 1) {
    for (const expected of routeTable) {
      await openCommandPalette(page);
      await navigate(page, expected.path);
      await expect(page.locator('[data-wm-shared-command-palette]')).toHaveCount(0);
      await expectCommittedSurface(page, expected, diagnostics);
      if (expected.moduleId) {
        expect(await readPlatformSession(page), `Embedded ${expected.moduleId} navigation must not rewrite the platform auth session.`).toBe(platformSessionBeforeEmbeddedRoutes);
      }
    }
  }
});

test('@m40-rbac-same-url live module revocation transfers presentation ownership to shell and tears down the embedded host', async ({ page }) => {
  test.setTimeout(30_000);
  const diagnostics = await installM40CompositionDiagnostics(page);
  await seedM39Session(page, { principal:'employee' });
  const fixture = await installM39Fixture(page, { principal:'employee' });
  await page.goto('/#/app/time-tracker');
  await waitForM39Identity(page, { role:'employee' });
  await waitForM40ApplicationReady(page);
  await expectCommittedSurface(page, { route:'app', owner:'module-host', surface:'runtime', moduleId:'time-tracker' }, diagnostics);
  fixture.updateAccess({ assignments: [
    { module_id:'time-tracker', role:'Employee', enabled:false },
    { module_id:'fueltrack-plus', role:'User', enabled:false },
    { module_id:'tradelink', role:'User', enabled:false },
  ] });
  await triggerIdentityRevalidation(page);
  await page.waitForFunction(async () => (await globalThis.WorkManagementRuntime.get('route-lifecycle.current'))?.owner === 'shell');
  await expectIdentityRevalidationSettled(page);
  await page.waitForFunction(() => { const active=document.activeElement; const runtime=document.querySelector('[data-wm-runtime-host]'); return active?.id === 'main' && Boolean(runtime?.contains(active)); });
  await expect(page.getByRole('heading', { name:'TimeTracker is restricted' })).toBeVisible();
  await expect(page.locator('#moduleFrame')).toHaveCount(0);
  await expect(page.locator('#nativeModuleHost')).toHaveCount(0);
  const lifecycle = await page.evaluate(() => globalThis.WorkManagementRuntime.get('route-lifecycle.current'));
  expect(lifecycle.phase).toBe('committed');
  expect(lifecycle.route.name).toBe('app');
  expect(lifecycle.owner).toBe('shell');
});

test('@m40-disabled-surface account disablement transfers same-URL ownership from management to authentication without stale management surface', async ({ page }) => {
  test.setTimeout(30_000);
  const diagnostics = await installM40CompositionDiagnostics(page);
  await seedM39Session(page, { principal:'admin' });
  const fixture = await installM39Fixture(page, { principal:'admin' });
  await page.goto('/#/account');
  await waitForM39Identity(page, { role:'admin_general_manager' });
  await waitForM40ApplicationReady(page);
  await expectCommittedSurface(page, { route:'account', owner:'account', surface:'management' }, diagnostics);
  fixture.updateAccess({ status:'disabled' });
  await triggerIdentityRevalidation(page);
  await expect(page.getByRole('heading', { name:'This account is disabled' })).toBeVisible();
  await expectIdentityRevalidationSettled(page);
  await page.waitForFunction(async () => (await globalThis.WorkManagementRuntime.get('route-lifecycle.current'))?.owner === 'auth');
  await page.waitForFunction(() => { const active=document.activeElement; const auth=document.querySelector('[data-wm-authentication-ui-host]'); return active?.id === 'main' && Boolean(auth?.contains(active) || auth === active); });
  await expect(page.locator('[data-wm-authenticated-management-ui-host]')).toHaveCount(0);
  await expect(page.locator('#moduleFrame')).toHaveCount(0);
  const lifecycle = await page.evaluate(() => globalThis.WorkManagementRuntime.get('route-lifecycle.current'));
  expect(lifecycle.phase).toBe('committed');
  expect(lifecycle.route.name).toBe('account');
  expect(lifecycle.owner).toBe('auth');
});
