import { test, expect } from '@playwright/test';

async function establishKeyboardOrigin(page) {
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
  });
  await expect(page.locator('body')).toBeFocused();
}

async function expectKeyboardFocusVisible(page, selector) {
  await page.keyboard.press('Tab');
  const control = page.locator(selector);
  await expect(control).toBeFocused();
  expect(await control.evaluate(el => el.matches(':focus-visible'))).toBe(true);
  const focus = await control.evaluate(el => ({
    style: getComputedStyle(el).outlineStyle,
    width: getComputedStyle(el).outlineWidth,
    color: getComputedStyle(el).outlineColor,
  }));
  expect(focus.style).not.toBe('none');
  expect(focus.width).not.toBe('0px');
  expect(focus.color).not.toBe('rgba(0, 0, 0, 0)');
}

test('M93 preserves keyboard focus and harmonizes interaction states without resting-state redesign', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--m93-interaction-state-harmonization').trim())).toBe('1');
  await page.evaluate(() => {
    document.body.innerHTML = `<main>
      <button id="first" class="wm-react-button wm-m93-interactive">Primary</button>
      <button id="disabled" class="wm-react-button wm-m93-interactive" disabled>Disabled</button>
      <input id="invalid" class="wm-input" aria-invalid="true" value="bad" />
      <button id="last" class="wm-react-button wm-m93-interactive">Last</button>
    </main>`;
  });

  await establishKeyboardOrigin(page);
  await expectKeyboardFocusVisible(page, '#first');

  await page.keyboard.press('Tab');
  await expect(page.locator('#invalid')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#last')).toBeFocused();

  const disabled = await page.locator('#disabled').evaluate(el => ({ transform:getComputedStyle(el).transform, cursor:getComputedStyle(el).cursor }));
  expect(disabled.transform).toBe('none');
  expect(disabled.cursor).toBe('not-allowed');

  const validation = await page.locator('#invalid').evaluate(el => ({ border:getComputedStyle(el).borderColor, shadow:getComputedStyle(el).boxShadow }));
  expect(validation.shadow).not.toBe('none');
  expect(validation.border).not.toBe('rgba(0, 0, 0, 0)');
});

test('M93 reduced-motion suppresses active transforms and forced-colors keeps explicit focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => { document.body.innerHTML = '<button id="control" class="wm-react-button wm-m93-interactive">Control</button>'; });
  const box = await page.locator('#control').boundingBox();
  if (!box) throw new Error('M93 control has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect(await page.locator('#control').evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await page.mouse.up();

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await establishKeyboardOrigin(page);
  await expectKeyboardFocusVisible(page, '#control');
});
