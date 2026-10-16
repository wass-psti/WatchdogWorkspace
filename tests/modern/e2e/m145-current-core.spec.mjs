import { test, expect } from '@playwright/test';
import { installM39Fixture, seedM39Session, waitForM39Identity, waitForM40ApplicationReady } from './helpers/m39-auth-fixture.mjs';

// One browser snapshot is used per assertion; the original approach sampled
// route lifecycle and URL separately during asynchronous hash transitions.
const move = async (page, route) => {
  await page.evaluate(value => { location.hash = `#/${value}`; }, route);
  await expect.poll(() => page.evaluate(() => location.hash), { timeout: 12000 })
    .toBe(`#/${route}`);
};
const state = page => page.evaluate(async () => {
  const runtime = globalThis.WorkManagementRuntime;
  const lifecycle = await runtime?.get?.('route-lifecycle.current');
  return {
    hash: location.hash,
    context: runtime?.getContext?.(), lifecycle,
    frames: document.querySelectorAll('#moduleFrame, #nativeModuleHost').length,
    root: document.querySelectorAll('[data-wm-react-shell-root]').length,
  };
});
async function core(page, route, owner) {
  // All details must agree in the SAME committed snapshot. A fast hashchange
  // can otherwise invalidate a previously observed route/owner pair.
  await expect.poll(async () => {
    const s = await state(page);
    return {
      route: s.context?.route ?? null,
      owner: s.lifecycle?.owner ?? null,
      phase: s.lifecycle?.phase ?? null,
      lifecycleRoute: s.lifecycle?.route?.name ?? null,
      hashMatches: route === 'app'
        ? s.hash.startsWith('#/app/') : s.hash === `#/${route}`,
      root: s.root, frames: s.frames,
    };
  }, { timeout: 15000, intervals: [50, 100, 250] }).toEqual({
    route, owner, phase: 'committed', lifecycleRoute: route,
    hashMatches: true, root: 1, frames: 0,
  });
}

test('@m145-auth anonymous login and authentic core management remain available', async ({page}) => {
  await page.goto('/#/login');
  await expect(page.locator('[data-wm-authentication-ui-form="login"]')).toBeVisible();
  await expect(page.locator('[data-wm-react-shell-root]')).toHaveCount(1);
  await seedM39Session(page,{principal:'admin'});
  await installM39Fixture(page,{principal:'admin'});
  await page.goto('/?m145-seeded-session=1#/account');
  await waitForM39Identity(page,{role:'admin_general_manager'});
  await waitForM40ApplicationReady(page);
  await core(page,'account','management');
  await page.reload();
  await waitForM39Identity(page,{role:'admin_general_manager'});
  await core(page,'account','management');
  for (const route of ['users','settings','boards','account']) {
    await move(page,route);
    await core(page,route,route==='boards'?'boards':'management');
  }
});

test('@m145-route repeated core navigation and all four retired routes never mount embedded applications', async ({page}) => {
  await seedM39Session(page,{principal:'admin'});
  await installM39Fixture(page,{principal:'admin'});
  await page.goto('/#/account');
  await waitForM39Identity(page,{role:'admin_general_manager'});
  await waitForM40ApplicationReady(page);
  for(let cycle=0;cycle<2;cycle++) {
    for(const route of ['boards','users','settings','account']) {
      await move(page,route);
      await core(page,route,route==='boards'?'boards':'management');
    }
    for(const moduleId of ['time-tracker','fueltrack-plus','tradelink','material-tracker']) {
      await move(page,`app/${moduleId}`);
      await core(page,'app','shell');
      await expect(page.locator('#moduleFrame,#nativeModuleHost')).toHaveCount(0);
    }
  }
});

test('@m145-auth employee cannot access Users or resurrect an assigned retired module', async ({page}) => {
  await seedM39Session(page,{principal:'employee'});
  await installM39Fixture(page,{principal:'employee'});
  await page.goto('/#/account');
  await waitForM39Identity(page,{role:'employee'});
  await move(page,'users');
  await expect(page.getByRole('heading',{name:'Administrator access required'})).toBeVisible();
  for(const moduleId of ['time-tracker','fueltrack-plus','tradelink','material-tracker']) {
    await move(page,`app/${moduleId}`);
    await core(page,'app','shell');
  }
  await move(page,'account');
  await core(page,'account','management');
});

test('@m145-quality mobile login remains accessible with reduced motion and no horizontal overflow', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/#/login');
  const form=page.locator('[data-wm-authentication-ui-form="login"]');
  await expect(form).toBeVisible();
  await expect(form.locator('input[type="email"]')).toBeVisible();
  await expect(form.locator('input[type="password"]')).toBeVisible();
  await expect(form.locator('button[type="submit"]')).toBeEnabled();
  const geometry=await page.evaluate(() => ({
    excess:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
    hostCount:document.querySelectorAll('[data-wm-react-shell-root]').length,
  }));
  expect(geometry.excess).toBeLessThanOrEqual(1);
  expect(geometry.reduced).toBe(true);
  expect(geometry.hostCount).toBe(1);
});
