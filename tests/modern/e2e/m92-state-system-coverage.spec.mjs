import { test, expect } from '@playwright/test';
test('M92 state presentation remains accessible and preference-safe', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--m92-state-system').trim())).toBe('1');
  await page.evaluate(()=>{document.body.innerHTML=`<main><div class="wm-skeleton-state" aria-busy="true" aria-label="Loading records"><span class="wm-skeleton-line" aria-hidden="true"></span><span class="wm-skeleton-line" aria-hidden="true"></span></div><div class="wm-validation-state" data-valid="false" role="alert" aria-live="assertive">Required field</div><div class="wm-feedback-state" data-wm-state="complete" data-tone="success"><h3>Complete</h3></div></main>`});
  await expect(page.locator('.wm-skeleton-state')).toHaveAttribute('aria-busy','true');
  await expect(page.locator('.wm-skeleton-state')).toHaveAttribute('aria-label','Loading records');
  await expect(page.locator('.wm-validation-state')).toHaveAttribute('role','alert');
  await expect(page.locator('[data-wm-state="complete"]')).toContainText('Complete');
});
