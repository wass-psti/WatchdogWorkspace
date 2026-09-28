import { test, expect } from '@playwright/test';
import {
  assertFrameNoHorizontalOverflow,
  assertNoHorizontalOverflow,
  installM53Admin,
  waitForEmbeddedIdentity,
  waitForM39Identity,
} from './helpers/m53-hardening-fixture.mjs';

const VIEWPORTS = Object.freeze([
  Object.freeze({ id: 'mobile', width: 390, height: 844 }),
  Object.freeze({ id: 'tablet', width: 768, height: 1024 }),
  Object.freeze({ id: 'laptop', width: 1366, height: 768 }),
  Object.freeze({ id: 'desktop', width: 1440, height: 900 }),
]);
const moduleRole = Object.freeze({ 'time-tracker': 'System Admin', 'fueltrack-plus': 'Admin', tradelink: 'General Manager' });

async function openAdmin(page, route='account') {
  await installM53Admin(page);
  await page.goto(`/#/${route}`);
  await waitForM39Identity(page, { role: 'admin_general_manager' });
}

for (const viewport of VIEWPORTS) {
  test(`@m77-host-${viewport.id} host routes remain viewport-contained and keyboard-addressable`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openAdmin(page, 'account');
    for (const route of ['account','settings','users','boards']) {
      await page.evaluate((target) => { location.hash=`#/${target}`; }, route);
      if(route==='boards') await expect(page.getByRole('heading',{name:'Boards',level:1})).toBeVisible();
      else await expect(page.locator(`[data-wm-management-view="${route}"]`)).toBeVisible();
      await assertNoHorizontalOverflow(page, 4);
    }
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  });

  test(`@m77-modules-${viewport.id} embedded modules retain identity and remain viewport-contained`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openAdmin(page, 'account');
    for (const [moduleId, role] of Object.entries(moduleRole)) {
      await page.evaluate((id) => { location.hash=`#/app/${id}`; }, moduleId);
      await waitForEmbeddedIdentity(page, moduleId, role);
      await assertNoHorizontalOverflow(page, 4);
      await assertFrameNoHorizontalOverflow(page, moduleId, 6, 2500);
    }
  });
}

test('@m77-accessibility critical interactive controls expose accessible names', async ({ page }) => {
  await openAdmin(page, 'account');
  const unnamed=await page.evaluate(() => [...document.querySelectorAll('button,input,select,textarea,a[href]')].filter((element) => {
    if(element instanceof HTMLInputElement && element.type==='hidden') return false;
    const aria=element.getAttribute('aria-label')?.trim();
    const labelled=element.getAttribute('aria-labelledby')?.trim();
    const nativeLabel='labels' in element && element.labels ? [...element.labels].some((label)=>label.textContent?.trim()) : false;
    const text=element.textContent?.trim();
    const title=element.getAttribute('title')?.trim();
    const alt=element.getAttribute('alt')?.trim();
    return !aria&&!labelled&&!nativeLabel&&!text&&!title&&!alt;
  }).map((element)=>element.outerHTML.slice(0,180)));
  expect(unnamed).toEqual([]);
});

test('@m77-reduced-motion system reduced-motion preference remains honored without overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await openAdmin(page, 'account');
  await assertNoHorizontalOverflow(page, 4);
  const reduced=await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(reduced).toBe(true);
  for(const [moduleId,role] of Object.entries(moduleRole)){
    await page.evaluate((id)=>{location.hash=`#/app/${id}`;},moduleId);
    await waitForEmbeddedIdentity(page,moduleId,role);
    await assertFrameNoHorizontalOverflow(page,moduleId,6,2500);
  }
});
