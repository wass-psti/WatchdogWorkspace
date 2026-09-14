import { test, expect } from '@playwright/test';
import { installSupabaseFixture, seedAuthenticatedSession, waitForFixtureAuthentication, navigateFixtureRoute } from './helpers/m37-supabase-fixture.mjs';

test('@m38-ready authenticated capability preflight exposes Account only after backend readiness', async ({ page }) => {
  await seedAuthenticatedSession(page);
  await installSupabaseFixture(page);
  await page.goto('/#/');
  await waitForFixtureAuthentication(page);
  await page.waitForFunction(() => globalThis.WorkManagementRuntime?.getContext?.()?.authenticated === true);
  await navigateFixtureRoute(page, 'account');
  await expect(page.locator('[data-wm-authenticated-management-ui-host][data-wm-management-route="account"]')).toBeVisible();
  await expect(page.locator('[data-wm-backend-preflight]')).toHaveCount(0);
});

test('@m38-blocked missing Board storage capability blocks Boards with explicit diagnostics', async ({ page }) => {
  await seedAuthenticatedSession(page);
  await installSupabaseFixture(page, { runtimeCapabilityOverrides: { storage:[], missing_storage:['work-board-files'] } });
  await page.goto('/#/');
  await waitForFixtureAuthentication(page);
  await navigateFixtureRoute(page, 'boards');
  const gate = page.locator('[data-wm-backend-preflight="boards"]');
  await expect(gate).toBeVisible();
  await expect(gate).toContainText('WM_BACKEND_CAPABILITY_MISMATCH');
  await expect(gate).toContainText('storage:work-board-files');
  const boardHost = page.locator('[data-wm-board-presentation-host]');
  await expect(boardHost).toBeHidden();
  await expect(boardHost).toHaveAttribute('data-wm-board-presentation-route', 'inactive');
});
