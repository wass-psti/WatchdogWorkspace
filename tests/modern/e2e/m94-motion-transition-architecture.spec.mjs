import { test, expect } from '@playwright/test';

test('M94 marks motion zones and keeps persistent shell transform-free', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--m94-motion-transition-architecture').trim())).toBe('1');
  await page.waitForFunction(() => document.body.dataset.wmM94MotionReady === 'true');
  const nav = page.locator('[data-wm-global-navigation]').first();
  if (await nav.count()) {
    expect(await nav.getAttribute('data-wm-motion-zone')).toBe('persistent-shell');
    expect(await nav.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  }
  const content = page.locator('#main,[data-wm-global-page-frame]').first();
  if (await content.count()) expect(await content.getAttribute('data-wm-motion-zone')).toBe('replaceable-content');
});

test('M94 reduced motion exposes controlled preference and suppresses content latency', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.dataset.wmMotionArchitecture === 'reduced');
  await page.evaluate(() => { document.body.innerHTML='<main id="main" data-wm-motion-zone="replaceable-content">Content</main>'; });
  const value=await page.locator('#main').evaluate(el=>({duration:getComputedStyle(el).transitionDuration,transform:getComputedStyle(el).transform}));
  expect(value.transform).toBe('none');
  const durationSeconds = Number.parseFloat(value.duration);
  expect(Number.isFinite(durationSeconds)).toBe(true);
  expect(durationSeconds).toBeLessThanOrEqual(0.000001);
});
