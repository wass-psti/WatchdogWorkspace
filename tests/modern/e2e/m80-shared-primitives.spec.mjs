import { test, expect } from '@playwright/test';

test('M80 shared primitive presentation resolves accessible Futuristic Minimalist states', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const result = await page.evaluate(() => {
    const host = document.createElement('div');
    host.innerHTML = `
      <button class="wm-button wm-button--primary" id="m80-button">Create</button>
      <input class="wm-field-control" id="m80-input" aria-label="Name" />
      <span class="wm-badge" data-tone="success" id="m80-badge">Ready</span>
      <div class="wm-alert" data-tone="warning" id="m80-alert"><span>Warning</span><span>Review</span></div>
      <div class="wm-card" id="m80-card">Card</div>
    `;
    document.body.append(host);
    const button = getComputedStyle(document.querySelector('#m80-button'));
    const input = getComputedStyle(document.querySelector('#m80-input'));
    const badge = getComputedStyle(document.querySelector('#m80-badge'));
    const alert = getComputedStyle(document.querySelector('#m80-alert'));
    const card = getComputedStyle(document.querySelector('#m80-card'));
    const state = {
      buttonMinHeight: button.minHeight,
      buttonRadius: button.borderRadius,
      inputMinHeight: input.minHeight,
      inputRadius: input.borderRadius,
      badgeRadius: badge.borderRadius,
      alertDisplay: alert.display,
      cardBorderStyle: card.borderStyle,
      overflow: Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, 0),
    };
    host.remove();
    return state;
  });
  expect(Number.parseFloat(result.buttonMinHeight)).toBeGreaterThanOrEqual(36);
  expect(Number.parseFloat(result.inputMinHeight)).toBeGreaterThanOrEqual(36);
  expect(result.buttonRadius).not.toBe('0px');
  expect(result.inputRadius).not.toBe('0px');
  expect(result.badgeRadius).not.toBe('0px');
  expect(result.alertDisplay).toBe('grid');
  expect(result.cardBorderStyle).not.toBe('none');
  expect(result.overflow).toBe(0);
});
