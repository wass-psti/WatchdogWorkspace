import { test, expect } from '@playwright/test';

test('M89 settings/configuration presentation is effective and responsive', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.body.innerHTML = `<main class="page settings-page" data-wm-management-view="settings" data-wm-settings-visual="m89"><section class="settings-card m89-settings-group" data-wm-configuration-surface="appearance-preferences"><div class="settings-row" data-wm-setting="theme" data-wm-configuration-control="theme"><div><span>APPEARANCE</span><h2>Interface theme</h2></div><div class="theme-options"><button class="theme-chip selected">System</button><button class="theme-chip">Light</button><button class="theme-chip">Dark</button></div></div><div class="settings-row" data-wm-setting="density"><div><h2>Workspace spacing</h2></div><button class="secondary-btn">Comfortable</button></div></section><section class="settings-card m89-settings-group" data-wm-configuration-surface="platform-operations"><div class="settings-row" data-wm-setting="storage-health"><div><h2>Shell preference persistence</h2></div><button class="secondary-btn">Refresh status</button></div></section></main>`;
  });
  const marker = await page.locator('html').evaluate((el) => getComputedStyle(el).getPropertyValue('--m89-settings-surface').trim());
  expect(marker).toBe('1');
  const radius = await page.locator('.m89-settings-group').first().evaluate((el) => getComputedStyle(el).borderRadius);
  expect(radius).not.toBe('0px');
  await page.setViewportSize({ width: 390, height: 844 });
  const columns = await page.locator('.settings-row').first().evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(columns.split(' ').length).toBe(1);
});
