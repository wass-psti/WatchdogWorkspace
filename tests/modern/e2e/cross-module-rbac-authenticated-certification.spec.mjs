import { test, expect } from '@playwright/test';
import { M52_ROLE_MATRIX, openM52Route, installM52Principal, waitForEmbeddedIdentity } from './helpers/m52-rbac-fixture.mjs';
import { waitForM39Identity } from './helpers/m39-auth-fixture.mjs';

const navigate = async (page, route) => page.evaluate((target) => { location.hash = `#/${target}`; }, route);

for (const [role, expected] of Object.entries(M52_ROLE_MATRIX)) {
  test(`@m52-host-${role} ${expected.label} receives the certified host-route authorization matrix`, async ({ page }) => {
    const { fixture } = await openM52Route(page, 'account', { role });
    await expect(page.locator('[data-wm-management-view="account"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: expected.label })).toBeVisible();

    await navigate(page, 'settings');
    await expect(page.locator('[data-wm-management-view="settings"]')).toBeVisible();

    await navigate(page, 'users');
    if (expected.users) {
      await expect(page.locator('[data-wm-management-view="users"]')).toBeVisible();
      await expect.poll(() => fixture.userDirectoryCalls).toBeGreaterThan(0);
    } else {
      await expect(page.getByRole('heading', { name: 'Administrator access required' })).toBeVisible();
      expect(fixture.userDirectoryCalls).toBe(0);
    }

    await navigate(page, 'boards');
    await expect(page.getByRole('heading', { name: 'Boards', level: 1 })).toBeVisible();
    const ownerCard = page.locator('[data-board-id="52000000-0000-4000-8000-000000000001"]');
    const editorCard = page.locator('[data-board-id="52000000-0000-4000-8000-000000000002"]');
    const viewerCard = page.locator('[data-board-id="52000000-0000-4000-8000-000000000003"]');
    await expect(ownerCard.getByRole('heading', { name: 'M52 Owner Board', level: 3 })).toBeVisible();
    await expect(editorCard.getByRole('heading', { name: 'M52 Editor Board', level: 3 })).toBeVisible();
    await expect(viewerCard.getByRole('heading', { name: 'M52 Viewer Board', level: 3 })).toBeVisible();
    await expect(ownerCard.locator('.board-card-meta').getByText('Owner', { exact: true })).toBeVisible();
    await expect(editorCard.locator('.board-card-meta').getByText('Editor', { exact: true })).toBeVisible();
    await expect(viewerCard.locator('.board-card-meta').getByText('Viewer', { exact: true })).toBeVisible();
    const ownerTemplate = ownerCard.locator('template[data-board-menu-template]');
    const editorTemplate = editorCard.locator('template[data-board-menu-template]');
    const viewerTemplate = viewerCard.locator('template[data-board-menu-template]');
    const [ownerMenuMarkup, editorMenuMarkup, viewerMenuMarkup] = await Promise.all([
      ownerTemplate.evaluate((template) => template.innerHTML),
      editorTemplate.evaluate((template) => template.innerHTML),
      viewerTemplate.evaluate((template) => template.innerHTML),
    ]);
    expect(ownerMenuMarkup).toContain('Archive board');
    expect(editorMenuMarkup).not.toContain('Archive board');
    expect(viewerMenuMarkup).not.toContain('Archive board');
  });

  test(`@m52-modules-${role} ${expected.label} receives correct application-scoped roles in every embedded module`, async ({ page }) => {
    await installM52Principal(page, { role });
    await page.goto('/#/account');
    await waitForM39Identity(page, { role });

    for (const assignment of expected.assignments) {
      await navigate(page, `app/${assignment.module_id}`);
      await page.waitForFunction((moduleId) => globalThis.WorkManagementRuntime?.getContext?.()?.moduleId === moduleId, assignment.module_id);
      const identity = await waitForEmbeddedIdentity(page, assignment.module_id, assignment.role);
      expect(identity.platformRole).toBe(role);
      expect(identity.module.enabled).toBe(true);
      expect(identity.module.role).toBe(assignment.role);
      await expect(page.getByRole('heading', { name: `${assignment.module_id === 'time-tracker' ? 'TimeTracker' : assignment.module_id === 'fueltrack-plus' ? 'FuelTrack+' : 'TradeLink'} is restricted` })).toHaveCount(0);

      if (assignment.module_id === 'time-tracker') {
        await expect(page.frameLocator('#moduleFrame').locator('.principal-pill strong')).toHaveText(assignment.role);
      }
      if (assignment.module_id === 'fueltrack-plus') {
        const frame = page.frameLocator('#moduleFrame');
        await expect(frame.locator('#roleBadgeText')).toHaveText(assignment.role);
        const adminOnly = frame.locator('[data-route="analytics"], [data-route="approvals"], [data-route="activity"], [data-route="roles"]');
        if (assignment.role === 'Admin') await expect(adminOnly.first()).toBeVisible();
        else await expect(adminOnly.first()).toBeHidden();
      }
      if (assignment.module_id === 'tradelink') {
        const currentRole = await page.evaluate(() => document.querySelector('#moduleFrame')?.contentWindow?.WM_IDENTITY_CONTEXT?.module?.role ?? null);
        expect(currentRole).toBe(assignment.role);
      }
    }
  });
}

test('@m52-disabled disabled account is fail-closed across host routes and embedded modules', async ({ page }) => {
  await installM52Principal(page, { role: 'employee', status: 'disabled' });
  await page.goto('/#/account');
  await expect(page.getByRole('heading', { name: 'This account is disabled' })).toBeVisible();
  await expect(page.locator('[data-wm-management-view="account"]')).toHaveCount(0);
  for (const route of ['boards', 'users', 'settings', 'app/time-tracker', 'app/fueltrack-plus', 'app/tradelink']) {
    await navigate(page, route);
    await expect(page.getByRole('heading', { name: 'This account is disabled' })).toBeVisible();
    await expect(page.locator('#moduleFrame')).toHaveCount(0);
  }
});

test('@m52-live-revocation live role/status reconciliation removes stale administrative authority', async ({ page }) => {
  const { fixture } = await openM52Route(page, 'users', { role: 'admin_general_manager' });
  await expect(page.locator('[data-wm-management-view="users"]')).toBeVisible();
  fixture.updateAccess({ role: 'employee', status: 'active', assignments: M52_ROLE_MATRIX.employee.assignments });
  await page.evaluate(() => globalThis.WorkManagementRuntime.execute('identity.revalidate'));
  await waitForM39Identity(page, { role: 'employee' });
  await expect(page.getByRole('heading', { name: 'Administrator access required' })).toBeVisible();

  fixture.updateAccess({ role: 'employee', status: 'disabled', assignments: M52_ROLE_MATRIX.employee.assignments });
  await page.evaluate(() => globalThis.WorkManagementRuntime.execute('identity.revalidate'));
  await expect(page.getByRole('heading', { name: 'This account is disabled' })).toBeVisible();
});
