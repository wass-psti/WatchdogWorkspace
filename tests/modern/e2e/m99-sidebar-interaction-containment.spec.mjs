import { test, expect } from '@playwright/test';
import { installM53Admin, waitForM39Identity } from './helpers/m53-hardening-fixture.mjs';

async function bootstrap(page) {
  await page.addInitScript(() => {
    localStorage.setItem('wm.platform.shell-navigation.v1', JSON.stringify({ state:'expanded', width:280, pinned:true }));
    localStorage.setItem('wm.platform.shell-sections.v1', JSON.stringify({ favorites:true, applications:true, boards:true }));
  });
  await installM53Admin(page);
  await page.goto('/#/');
  await waitForM39Identity(page, { role:'admin_general_manager' });
}

test('@m99-sidebar sections remain collapsed after React shell synchronization', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootstrap(page);

  const applicationsToggle = page.locator('[data-shell-section="applications"] [data-shell-section-toggle]');
  const applicationsBody = page.locator('[data-shell-section="applications"] .shell-nav-section-body');
  await expect(applicationsToggle).toHaveAttribute('aria-expanded', 'true');

  await applicationsToggle.click();
  await expect(applicationsToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(applicationsBody).toBeHidden();

  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      }),
  );
  await expect(applicationsToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(applicationsBody).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('wm.platform.shell-sections.v1') || '{}').applications)).toBe(false);

  await applicationsToggle.click();
  await expect(applicationsToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(applicationsBody).toBeVisible();
});

test('@m99-sidebar minimum-width resize clips all text-bearing navigation content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootstrap(page);

  const resizer = page.locator('[data-shell-resizer]');
  await expect(resizer).toBeVisible();
  await resizer.focus();
  await resizer.press('Home');
  await expect(resizer).toHaveAttribute('aria-valuenow', '224');

  const containment = await page.evaluate(() => {
    const shell = document.querySelector('[data-workspace-shell]');
    const sidebar = document.querySelector('#primarySidebar');
    const scroll = document.querySelector('.shell-navigation-scroll');
    const nav = document.querySelector('#primarySidebar nav');
    if (!shell || !sidebar || !scroll || !nav) throw new Error('Sidebar fixture is unavailable.');
    shell.setAttribute('data-shell-navigation-resizing', '');
    const sidebarRect = sidebar.getBoundingClientRect();
    const selectors = [
      '.brand-copy',
      '.nav-item b',
      '.nav-item kbd',
      '.shell-nav-section-toggle > span:first-child',
      '.shell-nav-section-toggle small',
      '.shell-resource-copy',
      '.shell-resource-empty',
      '.shell-resource-filter-empty',
      '.sidebar-foot > div',
    ].join(',');
    const leaks = [...sidebar.querySelectorAll(selectors)].filter((node) => {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = node.getBoundingClientRect();
      return rect.right > sidebarRect.right + 1 || rect.left < sidebarRect.left - 1;
    }).map((node) => ({ className: node.className, text: node.textContent?.trim().slice(0, 80) }));
    return {
      width: sidebarRect.width,
      leaks,
      scrollOverflowX: getComputedStyle(scroll).overflowX,
      navOverflowX: getComputedStyle(nav).overflowX,
      documentOverflow: Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, 0),
    };
  });

  expect(containment.width).toBeGreaterThanOrEqual(223);
  expect(containment.leaks).toEqual([]);
  expect(containment.scrollOverflowX).toBe('hidden');
  expect(containment.navOverflowX).toBe('hidden');
  expect(containment.documentOverflow).toBe(0);
});

test('@m99-sidebar resizer remains tooltip-free while horizontal drag resizing persists', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootstrap(page);

  const resizer = page.locator('[data-shell-resizer]');
  await expect(resizer).toBeVisible();
  await expect(resizer).not.toHaveAttribute('data-shell-tooltip', /.+/);
  await expect(resizer).not.toHaveAttribute('data-shell-tooltip-placement', /.+/);

  await resizer.hover();
  await page.waitForTimeout(450);
  await expect(page.locator('#wmShellTooltip')).toHaveCount(0);

  await resizer.focus();
  await page.waitForTimeout(50);
  await expect(page.locator('#wmShellTooltip')).toHaveCount(0);

  const before = Number(await resizer.getAttribute('aria-valuenow'));
  const box = await resizer.boundingBox();
  if (!box) throw new Error('Sidebar resizer bounding box is unavailable.');
  const startX = box.x + box.width / 2;
  const startY = box.y + Math.min(box.height / 2, 80);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 32, startY, { steps: 4 });
  await page.mouse.up();

  const after = Number(await resizer.getAttribute('aria-valuenow'));
  expect(after).toBeGreaterThan(before);
  await expect(page.locator('#wmShellTooltip')).toHaveCount(0);

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('wm.platform.shell-navigation.v1') || '{}').width);
  expect(Number(persisted)).toBe(after);
});
