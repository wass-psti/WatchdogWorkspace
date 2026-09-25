import { test, expect } from '@playwright/test';
import {
  M53_DESKTOP_VIEWPORT,
  M53_MOBILE_VIEWPORT,
  assertFrameNoHorizontalOverflow,
  assertNoHorizontalOverflow,
  installM53Admin,
  openM53AdminRoute,
  timedRoute,
  waitForEmbeddedIdentity,
  waitForM39Identity,
} from './helpers/m53-hardening-fixture.mjs';

const hostReady = (page, route) => async () => {
  if (route === 'boards') await expect(page.getByRole('heading', { name: 'Boards', level: 1 })).toBeVisible();
  else await expect(page.locator(`[data-wm-management-view="${route}"]`)).toBeVisible();
};

const moduleRole = Object.freeze({ 'time-tracker': 'System Admin', 'fueltrack-plus': 'Admin', tradelink: 'General Manager' });

test('@m53-reload authenticated state, route access, board membership and module roles survive reloads', async ({ page }) => {
  await openM53AdminRoute(page, 'boards');
  await expect(page.locator('[data-board-id="52000000-0000-4000-8000-000000000001"]')).toBeVisible();
  await page.reload();
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  await expect(page.getByRole('heading', { name: 'Boards', level: 1 })).toBeVisible();
  await expect(page.locator('[data-board-id="52000000-0000-4000-8000-000000000003"] .board-card-meta').getByText('Viewer', { exact: true })).toBeVisible();

  for (const moduleId of Object.keys(moduleRole)) {
    await page.evaluate((id) => { location.hash = `#/app/${id}`; }, moduleId);
    await waitForEmbeddedIdentity(page, moduleId, moduleRole[moduleId]);
    await page.reload();
    await waitForM39Identity(page, { role: 'admin_general_manager' });
    const identity = await waitForEmbeddedIdentity(page, moduleId, moduleRole[moduleId]);
    expect(identity.module.role).toBe(moduleRole[moduleId]);
  }
});

test('@m53-backup-upgrade-restore backup v1 migrates to v4, restores transactionally, and survives reload', async ({ page }) => {
  await installM53Admin(page);
  await page.goto('/#/settings');
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  const outcome = await page.evaluate(async () => {
    const backup = await import('/assets/js/core/backup.ts');
    const legacy = {
      format: 'work-management-backup', backupVersion: 1, platformVersion: '1.0.0',
      createdAt: new Date().toISOString(), origin: location.origin, modules: [],
      data: { 'wm.platform.preferences': JSON.stringify({ theme: 'dark', m53: 'restored' }) }, moduleData: {}, activityData: {}, boardData: [],
    };
    const payload = backup.parseBackupObject(legacy, []);
    const restored = await backup.restoreWorkspaceBackup(payload);
    return { migration: payload.migration, version: payload.backupVersion, restored, value: localStorage.getItem('wm.platform.preferences') };
  });
  expect(outcome.version).toBe(4);
  expect(outcome.migration).toEqual({ fromVersion: 1, toVersion: 4 });
  expect(outcome.restored.phase).toBe('complete');
  expect(outcome.value).toContain('restored');
  await page.reload();
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  expect(await page.evaluate(() => localStorage.getItem('wm.platform.preferences'))).toContain('restored');
});

test('@m53-mobile-keyboard mobile navigation traps keyboard focus, Escape restores trigger focus, and repaired host routes stay responsive', async ({ page }) => {
  await page.setViewportSize(M53_MOBILE_VIEWPORT);
  await openM53AdminRoute(page, 'account');
  await assertNoHorizontalOverflow(page);
  const trigger = page.locator('[data-shell-navigation-mobile-toggle]');
  await expect(trigger).toBeVisible();
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#primarySidebar')).toBeVisible();
  await expect.poll(
    () => page.evaluate(() => document.querySelector('#primarySidebar')?.contains(document.activeElement) === true),
    { message: 'opened mobile navigation should transfer focus into the sidebar after its scheduled animation frame', timeout: 2000 },
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();

  for (const route of ['settings', 'users', 'boards', 'account']) {
    await timedRoute(page, route, hostReady(page, route));
    await assertNoHorizontalOverflow(page);
  }
});

test('@m53-responsive-modules embedded repaired modules retain identity and avoid document-level horizontal overflow after viewport transitions', async ({ page }) => {
  await installM53Admin(page);
  await page.setViewportSize(M53_DESKTOP_VIEWPORT);
  await page.goto('/#/account');
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  for (const moduleId of Object.keys(moduleRole)) {
    await timedRoute(page, `app/${moduleId}`, async () => { await waitForEmbeddedIdentity(page, moduleId, moduleRole[moduleId]); });
    await page.setViewportSize(M53_MOBILE_VIEWPORT);
    await waitForEmbeddedIdentity(page, moduleId, moduleRole[moduleId]);
    await assertNoHorizontalOverflow(page);
    await assertFrameNoHorizontalOverflow(page, moduleId, 4);
    await page.setViewportSize(M53_DESKTOP_VIEWPORT);
  }
});

test('@m53-focus-accessibility route transitions place focus on the route-owned main surface and critical controls expose accessible names', async ({ page }) => {
  await openM53AdminRoute(page, 'account');
  for (const route of ['settings', 'users', 'boards', 'account']) {
    await timedRoute(page, route, hostReady(page, route));
    await expect(page.locator('#main')).toBeFocused();
  }
  const unnamed = await page.evaluate(() => [...document.querySelectorAll('button,input,select,textarea,a[href]')].filter((element) => {
    if (element instanceof HTMLInputElement && element.type === 'hidden') return false;
    const aria = element.getAttribute('aria-label')?.trim();
    const labelled = element.getAttribute('aria-labelledby')?.trim();
    const nativeLabel = 'labels' in element && element.labels
      ? [...element.labels].some((label) => label.textContent?.trim())
      : false;
    const text = element.textContent?.trim();
    const title = element.getAttribute('title')?.trim();
    const alt = element.getAttribute('alt')?.trim();
    return !aria && !labelled && !nativeLabel && !text && !title && !alt;
  }).map((element) => element.outerHTML.slice(0, 180)));
  expect(unnamed).toEqual([]);
});

test('@m53-role-transition responsive session cannot retain stale admin authority after role/status change', async ({ page }) => {
  await page.setViewportSize(M53_MOBILE_VIEWPORT);
  const { fixture } = await openM53AdminRoute(page, 'users');
  await expect(page.locator('[data-wm-management-view="users"]')).toBeVisible();
  fixture.updateAccess({ role: 'employee', status: 'active', assignments: [
    { module_id: 'time-tracker', role: 'Employee', enabled: true },
    { module_id: 'fueltrack-plus', role: 'User', enabled: true },
    { module_id: 'tradelink', role: 'User', enabled: true },
  ] });
  await page.evaluate(() => globalThis.WorkManagementRuntime.execute('identity.revalidate'));
  await waitForM39Identity(page, { role: 'employee' });
  await expect(page.getByRole('heading', { name: 'Administrator access required' })).toBeVisible();
  await page.reload();
  await waitForM39Identity(page, { role: 'employee' });
  await expect(page.getByRole('heading', { name: 'Administrator access required' })).toBeVisible();
  fixture.updateAccess({ role: 'employee', status: 'disabled', assignments: [] });
  await page.evaluate(() => globalThis.WorkManagementRuntime.execute('identity.revalidate'));
  await expect(page.getByRole('heading', { name: 'This account is disabled' })).toBeVisible();
});
