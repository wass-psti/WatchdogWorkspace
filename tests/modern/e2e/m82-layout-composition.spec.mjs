import { test, expect } from '@playwright/test';

test('M82 layout composition preserves desktop/tablet/mobile geometry and density semantics', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 820 });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    const host=document.createElement('div'); host.id='m82-fixture';
    host.innerHTML=`<main class="wm-page wm-layout-page" data-wm-page-layout data-wm-layout-density="inherit">
      <div class="wm-container wm-layout-container" data-wm-content-container>
        <section class="wm-section wm-layout-section" data-wm-section-layout data-wm-layout-density="inherit">
          <div id="m82-grid" class="wm-grid wm-layout-responsive-grid" data-columns="3" data-collapse-at="tablet" data-wm-responsive-grid="dashboard"><div>A</div><div>B</div><div>C</div></div>
          <div id="m82-grid-laptop" class="wm-grid" data-columns="3" data-collapse-at="laptop"><div>A</div><div>B</div><div>C</div></div>
          <div id="m82-grid-wide" class="wm-grid" data-columns="3" data-collapse-at="wide"><div>A</div><div>B</div><div>C</div></div>
          <div id="m82-cluster" class="wm-cluster wm-layout-responsive-cluster" data-stack-at="narrow" data-wm-responsive-cluster="mobileStack"><button>A</button><button>B</button></div>
          <div id="m82-compact" class="wm-surface wm-layout-surface-section" data-wm-surface-section style="padding:var(--wm-semantic-density-space-compact)">Compact</div>
          <div id="m82-comfortable" class="wm-surface wm-layout-surface-section" data-wm-surface-section style="padding:var(--wm-semantic-density-space-comfortable)">Comfortable</div>
        </section>
      </div>
    </main>`;
    document.body.append(host);
  });
  const desktop=await page.evaluate(()=>{
    const grid=document.querySelector('#m82-grid'); const compact=document.querySelector('#m82-compact'); const comfortable=document.querySelector('#m82-comfortable');
    return {columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length, compact:Number.parseFloat(getComputedStyle(compact).paddingTop), comfortable:Number.parseFloat(getComputedStyle(comfortable).paddingTop), overflow:Math.max(document.documentElement.scrollWidth-document.documentElement.clientWidth,0)};
  });
  expect(desktop.columns).toBe(3); expect(desktop.compact).toBeLessThan(desktop.comfortable); expect(desktop.overflow).toBe(0);
  const wideAtDesktop=await page.evaluate(()=>getComputedStyle(document.querySelector('#m82-grid-wide')).gridTemplateColumns.split(' ').length);
  expect(wideAtDesktop).toBe(1);
  await page.setViewportSize({ width: 1100, height: 850 });
  const laptop=await page.evaluate(()=>getComputedStyle(document.querySelector('#m82-grid-laptop')).gridTemplateColumns.split(' ').length);
  expect(laptop).toBe(1);
  await page.setViewportSize({ width: 800, height: 900 });
  const tablet=await page.evaluate(()=>({columns:getComputedStyle(document.querySelector('#m82-grid')).gridTemplateColumns.split(' ').length, clusterDirection:getComputedStyle(document.querySelector('#m82-cluster')).flexDirection}));
  expect(tablet.columns).toBe(1); expect(tablet.clusterDirection).toBe('row');
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile=await page.evaluate(()=>({columns:getComputedStyle(document.querySelector('#m82-grid')).gridTemplateColumns.split(' ').length, clusterDirection:getComputedStyle(document.querySelector('#m82-cluster')).flexDirection, pagePadding:Number.parseFloat(getComputedStyle(document.querySelector('[data-wm-page-layout]')).paddingLeft), overflow:Math.max(document.documentElement.scrollWidth-document.documentElement.clientWidth,0)}));
  expect(mobile.columns).toBe(1); expect(mobile.clusterDirection).toBe('column'); expect(mobile.pagePadding).toBeGreaterThan(0); expect(mobile.overflow).toBe(0);
});
