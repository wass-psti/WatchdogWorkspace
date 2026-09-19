import { test, expect } from '@playwright/test';
import { installM39Fixture, retryM39RuntimeBoundary, seedM39Session, waitForM39Identity } from './helpers/m39-auth-fixture.mjs';

async function openManagement(page, path, { principal='admin' } = {}) {
  await seedM39Session(page, { principal });
  const fixture = await installM39Fixture(page, { principal });
  await page.goto(`/#/${path}`);
  await waitForM39Identity(page, { role:principal === 'employee' ? 'employee' : 'admin_general_manager' });
  return fixture;
}

async function waitForManagementRoute(page, route, { expectedHostToken = null, assignHostToken = null } = {}) {
  return retryM39RuntimeBoundary(() => page.evaluate(async ({ expected, expectedHostToken, assignHostToken }) => {
    const runtime = globalThis.WorkManagementRuntime;
    if (!runtime || typeof runtime.get !== 'function') return { ready:false, reason:'runtime-get-unavailable' };
    try {
      const lifecycle = await runtime.get('route-lifecycle.current');
      if (globalThis.WorkManagementRuntime !== runtime) return { ready:false, reason:'runtime-replaced-during-management-read' };
      const host = document.querySelector('[data-wm-authenticated-management-ui-host]');
      const main = host?.querySelector('#main');
      const visible = (element) => Boolean(element && element.isConnected && !element.hidden && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' && element.getClientRects().length > 0);
      const routeReady = lifecycle?.phase === 'committed'
        && lifecycle?.route?.name === expected
        && lifecycle?.owner === 'management'
        && host?.getAttribute('data-wm-management-route') === expected
        && visible(host)
        && visible(main);
      if (!routeReady) return { ready:false, reason:'management-route-not-ready' };
      const currentToken = host?.dataset.m44HostToken || null;
      if (expectedHostToken !== null && currentToken !== expectedHostToken) {
        return { ready:false, reason:'management-host-token-mismatch', hostToken:currentToken };
      }
      if (assignHostToken !== null) host.dataset.m44HostToken = assignHostToken;
      return { ready:true, reason:'', hostToken:host.dataset.m44HostToken || null };
    } catch (error) {
      return { ready:false, reason:error instanceof Error ? error.message : String(error) };
    }
  }, { expected:route, expectedHostToken, assignHostToken }), { label:`M44 management route ${route}` });
}

async function captureManagementAuthority(page, route, hostToken) {
  return retryM39RuntimeBoundary(() => page.evaluate(async ({ expected, hostToken }) => {
    const runtime = globalThis.WorkManagementRuntime;
    if (!runtime || typeof runtime.get !== 'function') return { ready:false, reason:'runtime-get-unavailable' };
    try {
      const lifecycle = await runtime.get('route-lifecycle.current');
      const features = await runtime.get('features.list');
      const owners = {};
      for (const name of ['account','settings','users']) owners[name] = await runtime.get('features.ownerForRoute', { route:name });
      if (globalThis.WorkManagementRuntime !== runtime) return { ready:false, reason:'runtime-replaced-during-authority-read' };
      const host = document.querySelector('[data-wm-authenticated-management-ui-host]');
      const main = host?.querySelector('#main');
      const visible = (element) => Boolean(element && element.isConnected && !element.hidden && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' && element.getClientRects().length > 0);
      const ready = lifecycle?.phase === 'committed'
        && lifecycle?.route?.name === expected
        && lifecycle?.owner === 'management'
        && host?.getAttribute('data-wm-management-route') === expected
        && visible(host)
        && visible(main);
      if (!ready) return { ready:false, reason:'management-authority-not-ready' };
      host.dataset.m44HostToken = hostToken;
      return { ready:true, reason:'', features, owners, architectureVersion:runtime.architectureVersion, hostToken:host.dataset.m44HostToken };
    } catch (error) {
      return { ready:false, reason:error instanceof Error ? error.message : String(error) };
    }
  }, { expected:route, hostToken }), { label:`M44 management authority ${route}` });
}

test('@m44-single-authority Account, Settings, and Users share one registered runtime owner and one persistent React host', async ({ page }) => {
  await openManagement(page, 'account');
  const hostToken = 'm44-persistent-management-host';
  const authority = await captureManagementAuthority(page, 'account', hostToken);
  expect(authority.architectureVersion).toBeGreaterThanOrEqual(52);
  expect(authority.owners).toEqual({ account:'management', settings:'management', users:'management' });
  expect(authority.features.filter((entry) => entry.id === 'management')).toHaveLength(1);
  expect(authority.features.some((entry) => ['account','settings','user-management'].includes(entry.id))).toBe(false);
  expect(authority.hostToken).toBe(hostToken);

  for (let cycle = 0; cycle < 3; cycle += 1) {
    for (const route of ['settings','users','account']) {
      await page.evaluate((next) => { location.hash = `#/${next}`; }, route);
      const routeState = await waitForManagementRoute(page, route, { expectedHostToken:hostToken });
      expect(routeState.hostToken).toBe(hostToken);
      await expect(page.locator('[data-wm-authenticated-management-ui-host]')).toHaveCount(1);
      await expect(page.locator('[data-wm-composition-owner="react-management"]')).toHaveCount(1);
      const readiness = await retryM39RuntimeBoundary(() => page.evaluate(async () => {
        const runtime = globalThis.WorkManagementRuntime;
        if (!runtime || typeof runtime.get !== 'function') return { ready:false, reason:'runtime-get-unavailable' };
        const snapshot = await runtime.get('presentation-readiness.current');
        if (globalThis.WorkManagementRuntime !== runtime) return { ready:false, reason:'runtime-replaced-during-readiness-read' };
        const ready = snapshot?.readyOwners?.includes('management') === true;
        return { ready, reason:ready ? '' : 'management-presentation-not-ready', snapshot };
      }), { label:`M44 presentation readiness ${route}` });
      expect(readiness.snapshot.readyOwners).toContain('management');
      expect(readiness.snapshot.readyOwners).not.toContain('account');
      expect(readiness.snapshot.readyOwners).not.toContain('settings');
      expect(readiness.snapshot.readyOwners).not.toContain('user-management');
    }
  }
});

test('@m44-users-authorization consolidated management ownership does not bypass Users authorization', async ({ page }) => {
  const fixture = await openManagement(page, 'users', { principal:'employee' });
  await retryM39RuntimeBoundary(() => page.evaluate(async () => {
    const runtime = globalThis.WorkManagementRuntime;
    if (!runtime || typeof runtime.get !== 'function') return { ready:false, reason:'runtime-get-unavailable' };
    try {
      const lifecycle = await runtime.get('route-lifecycle.current');
      if (globalThis.WorkManagementRuntime !== runtime) return { ready:false, reason:'runtime-replaced-during-authorization-read' };
      const management = document.querySelector('[data-wm-authenticated-management-ui-host]');
      const runtimeHost = document.querySelector('[data-wm-runtime-host]');
      const visible = (element) => Boolean(element && element.isConnected && !element.hidden && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' && element.getClientRects().length > 0);
      const ready = lifecycle?.phase === 'committed'
        && lifecycle?.route?.name === 'users'
        && lifecycle?.owner === 'shell'
        && visible(runtimeHost)
        && !visible(management);
      return { ready, reason:ready ? '' : 'users-authorization-presentation-not-ready' };
    } catch (error) {
      return { ready:false, reason:error instanceof Error ? error.message : String(error) };
    }
  }), { label:'M44 Users authorization presentation' });
  await expect(page.getByRole('heading', { name:'Administrator access required' })).toBeVisible();
  await expect(page.locator('[data-wm-management-form="user-access"]')).toHaveCount(0);
  expect(fixture.userMutationCalls).toBe(0);
});
