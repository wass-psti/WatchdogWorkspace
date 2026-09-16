import { test, expect } from '@playwright/test';
import { installM39Fixture, seedM39Session, waitForM39Identity } from './helpers/m39-auth-fixture.mjs';

async function openManagement(page, path, { principal='admin' } = {}) {
  await seedM39Session(page, { principal });
  const fixture = await installM39Fixture(page, { principal });
  await page.goto(`/#/${path}`);
  await waitForM39Identity(page, { role:principal === 'employee' ? 'employee' : 'admin_general_manager' });
  return fixture;
}

async function waitForManagementRoute(page, route) {
  await page.waitForFunction(async (expected) => {
    const runtime = globalThis.WorkManagementRuntime;
    const lifecycle = await runtime?.get('route-lifecycle.current');
    const host = document.querySelector('[data-wm-authenticated-management-ui-host]');
    const main = host?.querySelector('#main');
    const visible = (element) => Boolean(element && !element.hidden && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' && element.getClientRects().length > 0);
    return lifecycle?.phase === 'committed'
      && lifecycle?.route?.name === expected
      && lifecycle?.owner === 'management'
      && host?.getAttribute('data-wm-management-route') === expected
      && visible(host)
      && visible(main);
  }, route);
}

test('@m44-single-authority Account, Settings, and Users share one registered runtime owner and one persistent React host', async ({ page }) => {
  await openManagement(page, 'account');
  await waitForManagementRoute(page, 'account');

  const authority = await page.evaluate(async () => {
    const runtime = globalThis.WorkManagementRuntime;
    const features = await runtime.get('features.list');
    const owners = {};
    for (const route of ['account','settings','users']) owners[route] = await runtime.get('features.ownerForRoute', { route });
    return { features, owners, architectureVersion:runtime.architectureVersion };
  });
  expect(authority.architectureVersion).toBeGreaterThanOrEqual(52);
  expect(authority.owners).toEqual({ account:'management', settings:'management', users:'management' });
  expect(authority.features.filter((entry) => entry.id === 'management')).toHaveLength(1);
  expect(authority.features.some((entry) => ['account','settings','user-management'].includes(entry.id))).toBe(false);

  const hostToken = await page.evaluate(() => {
    const host = document.querySelector('[data-wm-authenticated-management-ui-host]');
    host.dataset.m44HostToken = `m44-${Math.random().toString(16).slice(2)}`;
    return host.dataset.m44HostToken;
  });

  for (let cycle = 0; cycle < 3; cycle += 1) {
    for (const route of ['settings','users','account']) {
      await page.evaluate((next) => { location.hash = `#/${next}`; }, route);
      await waitForManagementRoute(page, route);
      await expect(page.locator('[data-wm-authenticated-management-ui-host]')).toHaveCount(1);
      await expect(page.locator('[data-wm-composition-owner="react-management"]')).toHaveCount(1);
      expect(await page.evaluate(() => document.querySelector('[data-wm-authenticated-management-ui-host]')?.dataset.m44HostToken)).toBe(hostToken);
      const readiness = await page.evaluate(async () => globalThis.WorkManagementRuntime.get('presentation-readiness.current'));
      expect(readiness.readyOwners).toContain('management');
      expect(readiness.readyOwners).not.toContain('account');
      expect(readiness.readyOwners).not.toContain('settings');
      expect(readiness.readyOwners).not.toContain('user-management');
    }
  }
});

test('@m44-users-authorization consolidated management ownership does not bypass Users authorization', async ({ page }) => {
  const fixture = await openManagement(page, 'users', { principal:'employee' });
  await page.waitForFunction(async () => {
    const lifecycle = await globalThis.WorkManagementRuntime?.get('route-lifecycle.current');
    const management = document.querySelector('[data-wm-authenticated-management-ui-host]');
    const runtimeHost = document.querySelector('[data-wm-runtime-host]');
    const visible = (element) => Boolean(element && !element.hidden && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' && element.getClientRects().length > 0);
    return lifecycle?.phase === 'committed'
      && lifecycle?.route?.name === 'users'
      && lifecycle?.owner === 'shell'
      && visible(runtimeHost)
      && !visible(management);
  });
  await expect(page.getByRole('heading', { name:'Administrator access required' })).toBeVisible();
  await expect(page.locator('[data-wm-management-form="user-access"]')).toHaveCount(0);
  expect(fixture.userMutationCalls).toBe(0);
});
