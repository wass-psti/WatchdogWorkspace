import { test, expect } from '@playwright/test';
import { executeM39Runtime, installM39Fixture, seedM39Session, waitForM39BackendPreflight, waitForM39Identity } from './helpers/m39-auth-fixture.mjs';

const navigate = async (page, route) => {
  await page.evaluate((target) => { location.hash = `#/${target}`; }, route);
};

const expectAuthorizedRoute = async (page, routeName, capabilityModule = routeName) => {
  await page.waitForFunction((expectedRoute) => globalThis.WorkManagementRuntime?.getContext?.()?.route === expectedRoute, routeName);
  const preflight = await waitForM39BackendPreflight(page, capabilityModule);
  expect(preflight.state).toBe('ready');
  expect(preflight.modules[capabilityModule].ready).toBe(true);
  await expect(page.getByRole('heading', { name: 'Access validation is temporarily unavailable' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Administrator access required' })).toHaveCount(0);
  await expect(page.locator('[data-wm-backend-preflight]')).toHaveCount(0);
};

test('@m39-admin-restore admin session survives reload and same-browser application restart', async ({ page, context }) => {
  await seedM39Session(page, { principal: 'admin' });
  await installM39Fixture(page, { principal: 'admin' });
  await page.goto('/#/account');
  let identity = await waitForM39Identity(page, { role: 'admin_general_manager' });
  expect(identity.profile.platform_role).toBe('admin_general_manager');
  await expectAuthorizedRoute(page, 'account');

  await page.reload();
  identity = await waitForM39Identity(page, { role: 'admin_general_manager' });
  expect(identity.sessionPersistence).toBe('persistent');
  await expectAuthorizedRoute(page, 'account');

  const restarted = await context.newPage();
  await installM39Fixture(restarted, { principal: 'admin' });
  await restarted.goto('/#/users');
  await waitForM39Identity(restarted, { role: 'admin_general_manager' });
  await expectAuthorizedRoute(restarted, 'users');
  await restarted.close();
});

test('@m39-employee-authorization non-admin session persists across reload/restart and route/module authorization is fail closed', async ({ page, context }) => {
  await seedM39Session(page, { principal: 'employee' });
  await installM39Fixture(page, { principal: 'employee' });
  await page.goto('/#/account');
  const identity = await waitForM39Identity(page, { role: 'employee' });
  expect(identity.profile.platform_role).toBe('employee');
  expect(identity.assignments.find((entry) => entry.module_id === 'time-tracker')?.enabled).toBe(true);

  await navigate(page, 'users');
  await expect(page.getByRole('heading', { name: 'Administrator access required' })).toBeVisible();
  await expect(page.locator('[data-wm-management-view="users"]')).toHaveCount(0);

  await navigate(page, 'app/time-tracker');
  await page.waitForFunction(() => globalThis.WorkManagementRuntime?.getContext?.()?.route === 'app');
  await expect(page.locator('[data-wm-runtime-host][data-route="access-denied"]')).toHaveCount(0);

  await navigate(page, 'app/fueltrack-plus');
  await expect(page.getByRole('heading', { name: 'FuelTrack+ is restricted' })).toBeVisible();
  await page.reload();
  await waitForM39Identity(page, { role: 'employee' });
  await expect(page.getByRole('heading', { name: 'FuelTrack+ is restricted' })).toBeVisible();

  const restarted = await context.newPage();
  await installM39Fixture(restarted, { principal: 'employee' });
  await restarted.goto('/#/app/time-tracker');
  const restartedIdentity = await waitForM39Identity(restarted, { role: 'employee' });
  expect(restartedIdentity.sessionPersistence).toBe('persistent');
  expect(restartedIdentity.assignments.find((entry) => entry.module_id === 'time-tracker')?.enabled).toBe(true);
  await expectAuthorizedRoute(restarted, 'app', 'time-tracker');
  await expect(restarted.getByRole('heading', { name: 'TimeTracker is restricted' })).toHaveCount(0);
  await restarted.close();
});

test('@m39-refresh token rotation restores an expired stored session without aborting access hydration', async ({ page }) => {
  await seedM39Session(page, { principal: 'admin', expired: true });
  const fixture = await installM39Fixture(page, { principal: 'admin' });
  await page.goto('/#/account');
  const identity = await waitForM39Identity(page, { role: 'admin_general_manager' });
  expect(fixture.refreshCalls).toBe(1);
  expect(identity.accessContextRevision).toBe('m39-revision-1');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('wm.platform.auth.session.v1')));
  expect(stored.access_token).toBe('m39-refreshed-access-token-1');
  expect(stored.refresh_token).toBe('m39-rotated-refresh-token-1');
  await expectAuthorizedRoute(page, 'account');
});

test('@m39-rbac-reconcile live assignment revocation clears active module authorization', async ({ page }) => {
  await seedM39Session(page, { principal: 'employee' });
  const fixture = await installM39Fixture(page, { principal: 'employee' });
  await page.goto('/#/app/time-tracker');
  await waitForM39Identity(page, { role: 'employee' });
  await page.waitForFunction(() => globalThis.WorkManagementRuntime?.getContext?.()?.route === 'app');
  fixture.updateAccess({ assignments: [
    { module_id: 'time-tracker', role: 'Employee', enabled: false },
    { module_id: 'fueltrack-plus', role: 'User', enabled: false },
    { module_id: 'tradelink', role: 'User', enabled: false },
  ] });
  await executeM39Runtime(page, 'identity.revalidate');
  await expect(page.getByRole('heading', { name: 'TimeTracker is restricted' })).toBeVisible();
  const identity = await page.evaluate(() => JSON.parse(localStorage.getItem('wm.platform.identity.v1')));
  expect(identity.modules['time-tracker'].enabled).toBe(false);
});

test('@m39-account-status disabled account loses route authority during access reconciliation', async ({ page }) => {
  await seedM39Session(page, { principal: 'admin' });
  const fixture = await installM39Fixture(page, { principal: 'admin' });
  await page.goto('/#/account');
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  fixture.updateAccess({ status: 'disabled' });
  const revalidated = await executeM39Runtime(page, 'identity.revalidate');
  expect(revalidated.status).toBe('disabled');
  expect(revalidated.isAccountActive).toBe(false);
  await page.waitForFunction(() => globalThis.WorkManagementRuntime?.getContext?.()?.authenticated === false);
  await expect(page.getByRole('heading', { name: 'This account is disabled' })).toBeVisible();
  await expect(page.locator('[data-wm-management-view="account"]')).toHaveCount(0);
});

test('@m39-transient-recovery transient access-context failure preserves stored session and recovers explicitly', async ({ page }) => {
  await seedM39Session(page, { principal: 'admin' });
  const fixture = await installM39Fixture(page, { principal: 'admin', accessContextFailure: true });
  await page.goto('/#/account');
  await expect(page.getByRole('heading', { name: 'Access validation is temporarily unavailable' })).toBeVisible();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('wm.platform.auth.session.v1')));
  expect(before.refresh_token).toBe('m39-refresh-token');
  const returnRoute = await page.evaluate(() => sessionStorage.getItem('wm.platform.auth.return-to.v1'));
  expect(returnRoute).toBe('#/account');
  fixture.setAccessContextFailure(false);
  await page.getByRole('button', { name: 'Retry access validation' }).click();
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  await expectAuthorizedRoute(page, 'account');
});
