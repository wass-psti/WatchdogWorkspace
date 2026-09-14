import { test, expect } from '@playwright/test';
import { installM39Fixture, seedM39Session, waitForM39Identity } from './helpers/m39-auth-fixture.mjs';

async function openAccount(page, fixtureOptions = {}) {
  await seedM39Session(page, { principal:'admin' });
  const fixture = await installM39Fixture(page, { principal:'admin', ...fixtureOptions });
  await page.goto('/#/account');
  await waitForM39Identity(page, { role:'admin_general_manager' });
  await expect(page.locator('[data-wm-management-view="account"]')).toBeVisible();
  return fixture;
}

async function expectAuthenticatedAccount(page) {
  await expect(page).toHaveURL(/#\/account$/);
  await expect(page.getByText('Authenticated', { exact:true }).first()).toBeVisible();
  await expect(page.locator('[data-wm-management-view="account"]')).toBeVisible();
}

test('@m41-profile-access profile editing and session/access refresh use authenticated backend authority and update module-role presentation', async ({ page }) => {
  const fixture = await openAccount(page);
  const form = page.locator('[data-wm-management-form="profile"]');
  await form.locator('input[name="displayName"]').fill('M41 Recovered Admin');
  await form.getByRole('button', { name:'Save profile' }).click();
  await expect(page.getByRole('heading', { name:'M41 Recovered Admin' }).first()).toBeVisible();
  await expect(page.locator('[data-wm-account-feedback="success"]')).toContainText('Profile updated from the authenticated backend.');
  expect(fixture.profileUpdateCalls).toBe(1);
  expect(fixture.displayName).toBe('M41 Recovered Admin');

  const before = fixture.accessContextCalls;
  await page.getByRole('button', { name:'Refresh session & access' }).click();
  await expect(page.locator('[data-wm-account-feedback="success"]')).toContainText('Session and account access refreshed from the authenticated backend.');
  expect(fixture.accessContextCalls).toBeGreaterThan(before);
  await expect(page.locator('.role-map-list')).toContainText('System Admin');
  await expect(page.locator('.role-map-list')).toContainText('Admin');
  await expect(page.locator('.role-map-list')).toContainText('General Manager');
});

test('@m41-profile-recovery backend profile failure remains on Account and succeeds on retry', async ({ page }) => {
  const fixture = await openAccount(page);
  fixture.setProfileUpdateFailure(true);
  const form = page.locator('[data-wm-management-form="profile"]');
  await form.locator('input[name="displayName"]').fill('Retry User');
  await form.getByRole('button', { name:'Save profile' }).click();
  await expect(page.locator('[data-wm-account-feedback="warning"]')).toContainText('Temporary profile update failure');
  await expectAuthenticatedAccount(page);
  fixture.setProfileUpdateFailure(false);
  await form.getByRole('button', { name:'Save profile' }).click();
  await expect(page.locator('[data-wm-account-feedback="success"]')).toContainText('Profile updated');
  expect(fixture.profileUpdateCalls).toBe(2);
});

test('@m41-password-success password update revokes global sessions and returns to login only after both backend operations succeed', async ({ page }) => {
  const fixture = await openAccount(page);
  const form = page.locator('[data-wm-management-form="password"]');
  await form.locator('input[name="password"]').fill('M41-new-password-123');
  await form.locator('input[name="confirmPassword"]').fill('M41-new-password-123');
  await form.getByRole('button', { name:'Change password' }).click();
  await page.waitForURL(/#\/login$/);
  expect(fixture.passwordUpdateCalls).toBe(1);
  expect(fixture.logoutCalls).toContain('global');
  await expect(page.locator('[data-wm-authentication-ui-host]')).toBeVisible();
});

test('@m41-password-recovery password mutation is not falsely reported as failed when global revocation is temporarily unavailable', async ({ page }) => {
  const fixture = await openAccount(page);
  fixture.setGlobalLogoutFailure(true);
  const form = page.locator('[data-wm-management-form="password"]');
  await form.locator('input[name="password"]').fill('M41-new-password-456');
  await form.locator('input[name="confirmPassword"]').fill('M41-new-password-456');
  await form.getByRole('button', { name:'Change password' }).click();
  await expect(page.locator('[data-wm-account-feedback="warning"]')).toContainText('Password changed, but Work Management could not confirm global session revocation');
  await expectAuthenticatedAccount(page);
  expect(fixture.passwordUpdateCalls).toBe(1);
  expect(fixture.logoutCalls).toEqual(['global']);

  fixture.setGlobalLogoutFailure(false);
  await page.getByRole('button', { name:'Sign out all sessions' }).click();
  await page.waitForURL(/#\/login$/);
  expect(fixture.logoutCalls).toEqual(['global','global']);
});

test('@m41-local-signout local sign-out destroys this browser session and routes to login', async ({ page }) => {
  const fixture = await openAccount(page);
  await page.getByRole('button', { name:'Sign out this browser' }).click();
  await page.waitForURL(/#\/login$/);
  expect(fixture.logoutCalls).toContain('local');
  const stored = await page.evaluate(() => localStorage.getItem('wm.platform.auth.session.v1'));
  expect(stored).toBeNull();
});
