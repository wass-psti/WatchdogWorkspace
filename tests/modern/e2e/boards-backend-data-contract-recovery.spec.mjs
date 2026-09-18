import { test, expect } from '@playwright/test';
import { installSupabaseFixture, seedAuthenticatedSession, waitForFixtureAuthentication, navigateFixtureRoute } from './helpers/m37-supabase-fixture.mjs';

const prepare = async (page, fixtureOptions = {}) => {
  await seedAuthenticatedSession(page);
  await installSupabaseFixture(page, fixtureOptions);
  await page.goto('/#/');
  await waitForFixtureAuthentication(page);
  await navigateFixtureRoute(page, 'boards');
};

test('@m46-contract-ready exact Board contract attestation keeps Boards available', async ({ page }) => {
  await prepare(page);
  await expect(page.locator('[data-wm-backend-preflight="boards"]')).toHaveCount(0);
  await expect(page.locator('[data-wm-board-presentation-host]')).toBeVisible();
});

test('@m46-contract-digest-mismatch stale deployed Board contract blocks Boards', async ({ page }) => {
  await prepare(page, { boardContractOverrides: { contract_digest:'0'.repeat(64) } });
  const gate = page.locator('[data-wm-backend-preflight="boards"]');
  await expect(gate).toBeVisible();
  await expect(gate).toContainText('WM_BACKEND_CAPABILITY_MISMATCH');
  await expect(gate).toContainText('contract-digest:');
  await expect(page.locator('[data-wm-board-presentation-host]')).toBeHidden();
});

test('@m46-contract-incompatible incompatible deployed Board catalog blocks Boards', async ({ page }) => {
  await prepare(page, { boardContractOverrides: { compatible:false } });
  const gate = page.locator('[data-wm-backend-preflight="boards"]');
  await expect(gate).toBeVisible();
  await expect(gate).toContainText('contract-compatible:false');
  await expect(page.locator('[data-wm-board-presentation-host]')).toBeHidden();
});
