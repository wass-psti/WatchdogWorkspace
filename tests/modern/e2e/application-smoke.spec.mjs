import { test, expect } from '@playwright/test';

test('boots the real Work Management login composition with exclusive React ownership', async ({ page }) => {
  await page.goto('/#/login');

  await expect(page.locator('[data-wm-authentication-ui-view="login"]')).toHaveCount(1);
  await expect(page.locator('[data-wm-authentication-ui-form="login"]')).toHaveCount(1);
  await expect(page.locator('[data-wm-react-shell-root]')).toHaveCount(1);
  await expect(page.locator('[data-wm-runtime-host]')).toHaveCount(1);
  await expect(page.locator('[data-wm-runtime-host]')).toBeHidden();
  await expect(page.locator('[data-wm-global-overlay-host]')).toHaveCount(1);
  await expect(page.locator('[data-wm-shared-application-ui-host]')).toHaveCount(1);
  await expect(page.locator('[data-wm-board-presentation-host]')).toHaveCount(1);
  await expect(page.locator('[data-wm-board-presentation-host]')).toBeHidden();
  await expect(page.locator('[data-workspace-shell]')).toHaveCount(0);
});
