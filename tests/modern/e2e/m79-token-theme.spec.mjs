import { test, expect } from '@playwright/test';

test('M79 Futuristic Minimalist semantic theme resolves governed tokens in light and dark modes', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const inspect = async (theme) => page.evaluate((mode) => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    const probe = document.createElement('div');
    probe.style.cssText = [
      'color:var(--wm-color-accent)',
      'background-color:var(--wm-color-surface-primary)',
      'border:var(--wm-border-width) solid var(--wm-color-border-primary)',
      'border-radius:var(--wm-semantic-radius-surface)',
      'backdrop-filter:blur(var(--wm-semantic-blur-overlay))',
      'transition-duration:var(--wm-semantic-motion-standard)',
      'transition-timing-function:var(--wm-semantic-ease-enter)',
    ].join(';');
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const rootStyle = getComputedStyle(root);
    const property = (name) => rootStyle.getPropertyValue(name).trim();
    const result = {
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderRadius: style.borderRadius,
      transitionDuration: style.transitionDuration,
      densityControl: property('--wm-semantic-density-control-default'),
      densityControlPrimitive: property('--wm-density-control-default'),
      breakpointTablet: property('--wm-semantic-breakpoint-tablet'),
      breakpointTabletPrimitive: property('--wm-breakpoint-tablet'),
      blurOverlay: property('--wm-semantic-blur-overlay'),
      blurOverlayPrimitive: property('--wm-blur-overlay'),
      accentRole: property('--wm-color-accent'),
      accentPrimitive: property(mode === 'dark' ? '--wm-palette-cyan-400' : '--wm-palette-cyan-700'),
    };
    probe.remove();
    return result;
  }, theme);

  const assertRuntimeAliasResolution = (state) => {
    expect(state.densityControl).toBe(state.densityControlPrimitive);
    expect(state.densityControl).toBe('36px');
    expect(state.breakpointTablet).toBe(state.breakpointTabletPrimitive);
    expect(state.breakpointTablet).toBe('840px');
    expect(state.blurOverlay).toBe(state.blurOverlayPrimitive);
    expect(state.blurOverlay).toBe('14px');
    expect(state.accentRole).toBe(state.accentPrimitive);
  };

  const light = await inspect('light');
  expect(light.color).toBe('rgb(0, 127, 145)');
  expect(light.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(light.borderRadius).toBe('10px');
  expect(light.transitionDuration).toBe('0.19s');
  assertRuntimeAliasResolution(light);

  const dark = await inspect('dark');
  expect(dark.color).toBe('rgb(85, 214, 231)');
  expect(dark.backgroundColor).toBe('rgb(14, 24, 33)');
  assertRuntimeAliasResolution(dark);
});
