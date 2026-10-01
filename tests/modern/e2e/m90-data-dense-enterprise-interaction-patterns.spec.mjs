import { test, expect } from '@playwright/test';
test('M90 enterprise dense-data patterns remain keyboard accessible and responsive', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { document.body.innerHTML = `<main data-wm-data-dense-visual="m90"><div class="wm-dense-toolbar" role="toolbar" aria-label="Data tools"><input type="search" aria-label="Search records"><button type="button">Filter</button></div><div class="wm-data-summary" role="status" aria-live="polite"><span>Records</span><strong>12 of 20 results</strong></div><div class="wm-bulk-action-bar" role="toolbar" aria-label="Bulk actions" data-selection-active="true"><span class="wm-bulk-selection" role="status" aria-live="polite">2 selected</span><div class="wm-bulk-actions"><button>Archive</button></div></div><div class="wm-dense-data-viewport" role="region" aria-label="Records table" tabindex="0"><table class="wm-table" data-density="compact"><tbody><tr><td>Alpha</td><td>Active</td></tr></tbody></table></div><nav class="wm-pagination" aria-label="Pagination"><button aria-label="Previous page">Previous</button><span class="wm-pagination-status" aria-current="page">Page 2 of 5</span><button aria-label="Next page">Next</button></nav></main>`; });
  expect(await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--m90-data-dense-enterprise').trim())).toBe('1');
  await page.locator('.wm-dense-data-viewport').focus(); expect(await page.locator('.wm-dense-data-viewport').evaluate(el=>document.activeElement===el)).toBe(true);
  await page.keyboard.press('Tab'); expect(await page.getByLabel('Previous page').evaluate(el=>document.activeElement===el)).toBe(true);
  expect(await page.getByRole('status').first().textContent()).toContain('12 of 20');
  await page.setViewportSize({width:390,height:844}); expect((await page.locator('.wm-dense-toolbar').evaluate(el=>getComputedStyle(el).flexWrap))).toBe('wrap');
});
