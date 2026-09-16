import fs from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { installM39Fixture, seedM39Session, waitForM39Identity } from './helpers/m39-auth-fixture.mjs';

async function installStorageFixture(page) {
  await page.addInitScript(() => {
    if (window.top !== window) return;
    const persistentKey = 'm43.fixture.storage-persistent';
    const manager = {
      estimate: async () => ({ quota: 100 * 1024 * 1024, usage: 5 * 1024 * 1024 }),
      persisted: async () => localStorage.getItem(persistentKey) === '1',
      persist: async () => { localStorage.setItem(persistentKey, '1'); return true; },
    };
    try { Object.defineProperty(navigator, 'storage', { configurable: true, value: manager }); }
    catch {
      try {
        Object.defineProperty(navigator.storage, 'estimate', { configurable: true, value: manager.estimate });
        Object.defineProperty(navigator.storage, 'persisted', { configurable: true, value: manager.persisted });
        Object.defineProperty(navigator.storage, 'persist', { configurable: true, value: manager.persist });
      } catch {}
    }
  });
}

async function openSettings(page, options = {}) {
  await seedM39Session(page, { principal: 'admin' });
  await installStorageFixture(page);
  const fixture = await installM39Fixture(page, { principal: 'admin', ...options });
  await page.goto('/#/settings');
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  await expect(page.locator('[data-wm-management-view="settings"]')).toBeVisible();
  return fixture;
}

const setting = (page, name) => page.locator(`[data-wm-setting="${name}"]`);

async function preferenceSnapshot(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('wm.platform.preferences.v1');
    return raw ? JSON.parse(raw) : null;
  });
}

test('@m43-theme-density-reset theme and density persist across reload and preference reset remains scoped', async ({ page }) => {
  await openSettings(page);
  const theme = setting(page, 'theme');
  const density = setting(page, 'density');

  await theme.getByRole('button', { name: 'Dark' }).click();
  await expect(theme.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');

  await density.getByRole('button', { name: 'Comfortable' }).click();
  await expect(density).toContainText('Current mode: Compact');
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.density)).toBe('compact');

  let prefs = await preferenceSnapshot(page);
  expect(prefs.theme).toBe('dark');
  expect(prefs.compact).toBe(true);

  await page.reload();
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  await expect(setting(page, 'theme').getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  await expect(setting(page, 'density')).toContainText('Current mode: Compact');

  await setting(page, 'theme').getByRole('button', { name: 'Light' }).click();
  await expect(setting(page, 'theme').getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true');
  await setting(page, 'theme').getByRole('button', { name: 'System' }).click();
  await expect(setting(page, 'theme').getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true');
  await setting(page, 'theme').getByRole('button', { name: 'Dark' }).click();

  page.once('dialog', (dialog) => dialog.accept());
  await setting(page, 'preference-reset').getByRole('button', { name: 'Reset preferences' }).click();
  await expect(setting(page, 'theme').getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true');
  await expect(setting(page, 'density')).toContainText('Current mode: Comfortable');
  prefs = await preferenceSnapshot(page);
  expect(prefs.theme).toBe('system');
  expect(prefs.compact).toBe(false);
  expect(prefs.favorites).toEqual(['time-tracker']);
  expect(prefs.recent).toEqual([]);

  await page.reload();
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  await expect(setting(page, 'theme').getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true');
  await expect(setting(page, 'density')).toContainText('Current mode: Comfortable');
});

test('@m43-scans-diagnostics compatibility, diagnostics, and backend status are actionable, recoverable, and reload-resilient', async ({ page }) => {
  const fixture = await openSettings(page);

  await setting(page, 'compatibility').getByRole('button', { name: 'Verify applications' }).click();
  await expect(setting(page, 'compatibility').locator('.diagnostic-item')).not.toHaveCount(0);
  await expect(setting(page, 'compatibility')).toContainText('Verified');

  await setting(page, 'diagnostics').getByRole('button', { name: 'Run diagnostics' }).click();
  await expect(setting(page, 'diagnostics').locator('.diagnostic-item')).not.toHaveCount(0);
  await expect(setting(page, 'diagnostics')).toContainText('Preferences');

  const healthCallsBefore = fixture.authHealthCalls;
  await setting(page, 'auth-backend').getByRole('button', { name: 'Refresh backend status' }).click();
  await expect.poll(() => fixture.authHealthCalls).toBeGreaterThan(healthCallsBefore);
  await expect(setting(page, 'auth-backend')).toContainText('Verified');
  await expect(setting(page, 'auth-backend')).toContainText('Supabase Auth endpoint');

  fixture.setAuthHealthFailure(true);
  await setting(page, 'auth-backend').getByRole('button', { name: 'Refresh backend status' }).click();
  await expect(setting(page, 'auth-backend')).toContainText('Attention');
  await expect(setting(page, 'auth-backend')).toContainText('HTTP 503');

  fixture.setAuthHealthFailure(false);
  await setting(page, 'auth-backend').getByRole('button', { name: 'Refresh backend status' }).click();
  await expect(setting(page, 'auth-backend')).toContainText('Verified');
  await expect(setting(page, 'auth-backend')).toContainText('HTTP 200');

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem('wm.platform.settings.evidence.v1') || 'null'));
  expect(evidence?.version).toBe(1);
  expect(evidence?.compatibility?.passed).toBe(true);
  expect(evidence?.diagnostics?.passed).toBe(true);
  expect(evidence?.backendStatus?.passed).toBe(true);

  await page.reload();
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  await expect(setting(page, 'compatibility')).toContainText('Last checked');
  await expect(setting(page, 'diagnostics')).toContainText('Last checked');
  await expect(setting(page, 'auth-backend')).toContainText('Last checked');
});

test('@m43-storage persistent-storage request and storage-health refresh survive reload', async ({ page }) => {
  await openSettings(page);
  const row = setting(page, 'storage-health');
  await expect(row.getByRole('button', { name: 'Request persistence' })).toBeVisible();
  await row.getByRole('button', { name: 'Refresh status' }).click();
  await expect(row).toContainText('5.0 MB used of approximately 100.0 MB');
  await row.getByRole('button', { name: 'Request persistence' }).click();
  await expect(row).toContainText('Persistent');
  expect(await page.evaluate(() => localStorage.getItem('m43.fixture.storage-persistent'))).toBe('1');

  await page.reload();
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  await expect(setting(page, 'storage-health')).toContainText('Persistent');
  await setting(page, 'storage-health').getByRole('button', { name: 'Refresh status' }).click();
  await expect(setting(page, 'storage-health')).toContainText('5.0 MB used of approximately 100.0 MB');
});

test('@m43-backup-roundtrip backup export and guarded restore round-trip shell preferences across the restore reload', async ({ page }) => {
  const fixture = await openSettings(page);
  await setting(page, 'theme').getByRole('button', { name: 'Dark' }).click();
  await setting(page, 'density').getByRole('button', { name: 'Comfortable' }).click();
  await expect(setting(page, 'density')).toContainText('Current mode: Compact');

  const downloadPromise = page.waitForEvent('download');
  await setting(page, 'backup-recovery').getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const backupBuffer = await fs.readFile(downloadPath);
  const backupText = backupBuffer.toString('utf8');
  expect(backupText).toContain('work-management-backup');
  expect(backupText).not.toContain('wm.platform.auth.session.v1');
  expect(backupText).not.toContain('wm.platform.identity.v1');

  await setting(page, 'theme').getByRole('button', { name: 'Light' }).click();
  await setting(page, 'density').getByRole('button', { name: 'Compact' }).click();
  await expect(setting(page, 'density')).toContainText('Current mode: Comfortable');

  page.on('dialog', (dialog) => dialog.accept());
  const navigation = page.waitForEvent('framenavigated', { predicate: (frame) => frame === page.mainFrame(), timeout: 20_000 });
  await page.locator('#wmBackupFileInput').setInputFiles({ name: 'm43-roundtrip.json', mimeType: 'application/json', buffer: backupBuffer });
  await expect.poll(() => fixture.backupRestoreCalls).toBe(1);
  await navigation;
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  await expect(setting(page, 'theme').getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  await expect(setting(page, 'density')).toContainText('Current mode: Compact');
});
