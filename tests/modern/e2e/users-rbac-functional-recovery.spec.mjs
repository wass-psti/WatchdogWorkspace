import { test, expect } from '@playwright/test';
import { installM39Fixture, seedM39Session, waitForM39Identity } from './helpers/m39-auth-fixture.mjs';

async function openUsers(page, { principal='admin', ...options } = {}) {
  await seedM39Session(page, { principal });
  const fixture = await installM39Fixture(page, { principal, ...options });
  await page.goto('/#/users');
  await waitForM39Identity(page, { role:principal === 'employee' ? 'employee' : 'admin_general_manager' });
  return fixture;
}

const rowFor = (page, email) => page.locator('[data-wm-management-form="user-access"]').filter({ hasText:email });

test('@m42-directory-search-refresh Admin directory loads, searches, and refreshes from authenticated backend', async ({ page }) => {
  const fixture = await openUsers(page);
  await expect(page.locator('[data-wm-management-view="users"]')).toBeVisible();
  await expect(page.locator('[data-wm-management-form="user-access"]')).toHaveCount(3);
  expect(fixture.userDirectoryCalls).toBeGreaterThan(0);
  await page.locator('#userDirectorySearch').fill('employee');
  await expect(page.locator('[data-wm-management-form="user-access"]')).toHaveCount(1);
  const before = fixture.userDirectoryCalls;
  await page.getByRole('button', { name:'Refresh' }).click();
  await expect.poll(() => fixture.userDirectoryCalls).toBeGreaterThan(before);
});

test('@m42-role-status mutation updates role/status through protected RPC and refreshes authoritative directory', async ({ page }) => {
  const fixture = await openUsers(page);
  const row = rowFor(page, 'm39-employee@example.test');
  await row.locator('select[name="platformRole"]').selectOption('supervisor');
  await row.locator('select[name="status"]').selectOption('disabled');
  await row.getByRole('button', { name:'Save' }).click();
  await expect(page.locator('[data-wm-user-feedback="success"]')).toContainText('updated transactionally');
  expect(fixture.userMutationCalls).toBe(1);
  await expect(rowFor(page, 'm39-employee@example.test').locator('select[name="platformRole"]')).toHaveValue('supervisor');
  await expect(rowFor(page, 'm39-employee@example.test').locator('select[name="status"]')).toHaveValue('disabled');
});

test('@m42-protection bootstrap, self-disable, and last-admin safeguards are represented in UI and enforced by backend authority', async ({ page }) => {
  const fixture = await openUsers(page);
  const bootstrap = rowFor(page, 'bootstrap@example.test');
  await expect(bootstrap).toHaveAttribute('data-user-bootstrap','true');
  await expect(bootstrap.locator('select[name="platformRole"]')).toBeDisabled();
  await expect(bootstrap.locator('select[name="status"]')).toBeDisabled();

  fixture.setDirectory([{ id:'00000000-0000-4000-8000-000000000039', email:'m39-admin@example.test', display_name:'M39 Admin', platform_role:'admin_general_manager', status:'active', is_bootstrap_admin:false }]);
  await page.getByRole('button', { name:'Refresh' }).click();
  const self = rowFor(page, 'm39-admin@example.test');
  await expect(self).toHaveAttribute('data-user-last-admin','true');
  await expect(self.locator('select[name="platformRole"]')).toBeDisabled();
  await expect(self.locator('select[name="status"]')).toBeDisabled();
});

test('@m42-self-role self-demotion succeeds when another active admin exists and immediately removes user-management authority', async ({ page }) => {
  const fixture = await openUsers(page);
  const self = rowFor(page, 'm39-admin@example.test');
  const accessCallsBefore = fixture.accessContextCalls;
  const revisionBefore = fixture.accessRevision;
  await expect(self.locator('select[name="status"]')).toBeDisabled();
  await expect(self.locator('select[name="status"]')).toHaveValue('active');
  await self.locator('select[name="platformRole"]').selectOption('supervisor');
  await expect(self.locator('select[name="platformRole"]')).toHaveValue('supervisor');
  const save = self.getByRole('button', { name:'Save' });
  await expect(save).toBeEnabled();
  await save.click();
  await expect.poll(() => fixture.userMutationCalls).toBe(1);
  await expect.poll(() => fixture.accessRole).toBe('supervisor');
  await expect.poll(() => fixture.accessStatus).toBe('active');
  await expect.poll(() => fixture.accessRevision).toBeGreaterThan(revisionBefore);
  await expect.poll(() => fixture.accessContextCalls).toBeGreaterThan(accessCallsBefore);
  expect(fixture.accessAssignments.every((entry) => entry.user_id === '00000000-0000-4000-8000-000000000039')).toBe(true);
  await waitForM39Identity(page, { role:'supervisor' });
  await page.waitForFunction(async () => {
    const lifecycle = await globalThis.WorkManagementRuntime?.get('route-lifecycle.current');
    const runtime = document.querySelector('[data-wm-runtime-host]');
    const management = document.querySelector('[data-wm-authenticated-management-ui-host]');
    const visible = (element) => Boolean(element && !element.hidden && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' && element.getClientRects().length > 0);
    return lifecycle?.phase === 'committed'
      && lifecycle?.route?.name === 'users'
      && lifecycle?.owner === 'shell'
      && visible(runtime)
      && !visible(management);
  });
  await expect(page.getByRole('heading', { name:'Administrator access required' })).toBeVisible();
  await expect(page.locator('[data-wm-management-form="user-access"]')).toHaveCount(0);
});

test('@m42-recovery mutation and directory failures remain recoverable without false success reporting', async ({ page }) => {
  const fixture = await openUsers(page);
  fixture.setUserMutationFailure(true);
  let row = rowFor(page, 'm39-employee@example.test');
  await row.locator('select[name="platformRole"]').selectOption('hr');
  await row.getByRole('button', { name:'Save' }).click();
  await expect(page.locator('[data-wm-user-feedback="warning"]')).toContainText('Temporary user mutation failure');
  fixture.setUserMutationFailure(false);
  row = rowFor(page, 'm39-employee@example.test');
  await row.locator('select[name="platformRole"]').selectOption('hr');
  await row.getByRole('button', { name:'Save' }).click();
  await expect(page.locator('[data-wm-user-feedback="success"]')).toContainText('updated transactionally');
  fixture.setUserDirectoryFailure(true);
  await page.getByRole('button', { name:'Refresh' }).click();
  await expect(page.getByText('User directory unavailable')).toBeVisible();
  fixture.setUserDirectoryFailure(false);
  await page.getByRole('button', { name:'Retry' }).click();
  await expect(page.locator('[data-wm-management-form="user-access"]')).toHaveCount(3);
});

test('@m42-unauthorized non-admin roles cannot access or mutate Users', async ({ page }) => {
  const fixture = await openUsers(page, { principal:'employee' });
  await page.waitForFunction(async () => {
    const lifecycle = await globalThis.WorkManagementRuntime?.get('route-lifecycle.current');
    const runtime = document.querySelector('[data-wm-runtime-host]');
    const management = document.querySelector('[data-wm-authenticated-management-ui-host]');
    const visible = (element) => Boolean(element && !element.hidden && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' && element.getClientRects().length > 0);
    return lifecycle?.phase === 'committed'
      && lifecycle?.route?.name === 'users'
      && lifecycle?.owner === 'shell'
      && visible(runtime)
      && !visible(management);
  });
  await expect(page.getByRole('heading', { name:'Administrator access required' })).toBeVisible();
  await expect(page.locator('[data-wm-management-form="user-access"]')).toHaveCount(0);
  expect(fixture.userMutationCalls).toBe(0);
});
