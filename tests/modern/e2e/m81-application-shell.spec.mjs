import { test, expect } from '@playwright/test';

test('M81 shell stays geometrically stable across desktop compact/expanded and mobile modal navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 820 });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    document.body.dataset.wmSurface = 'shell';
    const host = document.createElement('div');
    host.id = 'm81-fixture';
    host.innerHTML = `<style>#m81-fixture .sidebar,#m81-fixture .workspace{transition:none!important}</style><div class="shell" data-shell-navigation-state="expanded" data-shell-navigation-pinned="true" data-shell-navigation-peek="false" data-shell-mobile-open="false" style="--wm-shell-navigation-user-width: 280px">
      <aside class="sidebar" data-wm-global-navigation><div class="shell-sidebar-header" data-wm-shell-header></div><div class="shell-navigation-scroll"><nav aria-label="Main"></nav></div></aside>
      <div class="workspace" data-wm-global-page-frame><header class="topbar" data-wm-shell-page-header></header><main id="main"></main></div>
    </div>`;
    document.body.append(host);
  });
  const expanded = await page.evaluate(() => {
    const shell = document.querySelector('#m81-fixture .shell');
    const sidebar = document.querySelector('#m81-fixture .sidebar');
    const workspace = document.querySelector('#m81-fixture .workspace');
    return { sidebarWidth: sidebar.getBoundingClientRect().width, margin: Number.parseFloat(getComputedStyle(workspace).marginLeft), width: workspace.getBoundingClientRect().width, shellWidth: shell.getBoundingClientRect().width };
  });
  expect(expanded.sidebarWidth).toBeGreaterThanOrEqual(224);
  expect(expanded.margin).toBeGreaterThanOrEqual(224);
  expect(expanded.width + expanded.margin).toBeCloseTo(expanded.shellWidth, 0);
  const compact = await page.evaluate(() => {
    const shell = document.querySelector('#m81-fixture .shell');
    const workspace = document.querySelector('#m81-fixture .workspace');
    const before = workspace;
    shell.setAttribute('data-shell-navigation-resizing','');
    shell.setAttribute('data-shell-navigation-state','compact');
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve({ sameHost: before === document.querySelector('#m81-fixture .workspace'), margin: Number.parseFloat(getComputedStyle(workspace).marginLeft) });
        });
      });
    });
  });
  expect(compact.sameHost).toBe(true);
  expect(compact.margin).toBeLessThan(expanded.margin);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.evaluate(() => {
    const shell = document.querySelector('#m81-fixture .shell');
    const sidebar = document.querySelector('#m81-fixture .sidebar');
    const workspace = document.querySelector('#m81-fixture .workspace');
    shell.setAttribute('data-shell-mobile-open','true');
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve({ sidebarLeft: sidebar.getBoundingClientRect().left, workspaceMargin: Number.parseFloat(getComputedStyle(workspace).marginLeft), overflow: Math.max(document.documentElement.scrollWidth-document.documentElement.clientWidth,0), headerMarker: Boolean(document.querySelector('[data-wm-shell-page-header]')), pageFrameMarker: Boolean(document.querySelector('[data-wm-global-page-frame]')) });
        });
      });
    });
  });
  expect(mobile.sidebarLeft).toBeGreaterThanOrEqual(-1);
  expect(mobile.workspaceMargin).toBe(0);
  expect(mobile.overflow).toBe(0);
  expect(mobile.headerMarker).toBe(true);
  expect(mobile.pageFrameMarker).toBe(true);
});
