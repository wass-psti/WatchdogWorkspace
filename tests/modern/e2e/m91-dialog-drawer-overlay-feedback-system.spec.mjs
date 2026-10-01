import { test, expect } from '@playwright/test';
test('M91 overlay hierarchy, Escape ownership and responsive drawer presentation remain coherent', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { document.body.innerHTML = `<button id="trigger">Open</button><div id="root-overlay" tabindex="-1">Root</div><div id="child-overlay" tabindex="-1">Child</div><div class="wm-react-drawer-positioner" data-placement="end"><section class="wm-react-drawer" data-wm-interaction="drawer" data-placement="end"><button id="drawer-close">Close</button></section></div><section class="wm-notification-stack" aria-label="Notifications"><div class="wm-status-message">Saved</div></section>`; });
  expect(await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--m91-overlay-feedback-system').trim())).toBe('1');
  await page.evaluate(async () => {
    const { createOverlayManager } = await import('/assets/js/platform/ui/overlay-manager.ts');
    const manager = createOverlayManager({scope:'m91-browser'});
    const trigger = document.querySelector('#trigger');
    const root = document.querySelector('#root-overlay');
    const child = document.querySelector('#child-overlay');
    window.__m91Closed = [];
    manager.open({id:'root',element:root,trigger,close:({restoreFocus})=>{window.__m91Closed.push(`root:${restoreFocus}`);if(restoreFocus)trigger.focus();}});
    manager.open({id:'child',element:child,trigger:root,parentId:'root',close:({restoreFocus})=>{window.__m91Closed.push(`child:${restoreFocus}`);if(restoreFocus)root.focus();}});
    window.__m91Manager = manager;
  });
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__m91Closed)).toEqual(['child:true']);
  expect(await page.evaluate(() => window.__m91Manager.topId)).toBe('root');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__m91Closed)).toEqual(['child:true','root:true']);
  expect(await page.locator('#trigger').evaluate(el=>document.activeElement===el)).toBe(true);
  await page.setViewportSize({width:390,height:844});
  expect(await page.locator('.wm-react-drawer').evaluate(el=>getComputedStyle(el).width)).toBe('390px');
  expect(await page.locator('.wm-notification-stack').getAttribute('aria-label')).toBe('Notifications');
});
