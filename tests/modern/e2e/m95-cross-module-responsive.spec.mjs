import { test, expect } from '@playwright/test';

const base = process.env.WM_PLAYWRIGHT_BASE_URL;
const surfaces = [
  ['host', '/'],
  ['time-tracker', '/apps/time-tracker/index.html'],
  ['fueltrack', '/apps/fueltrack-plus/runtime.html'],
  ['tradelink', '/apps/tradelink/runtime.html'],
];
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'wide', width: 1440, height: 900 },
];

for (const vp of viewports) {
  for (const [name, path] of surfaces) {
    test(`${name} ${vp.name} viewport remains page-width stable`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(150);

      const result = await page.evaluate(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        return {
          client: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
          m95Breakpoints: {
            narrow: rootStyle.getPropertyValue('--wm-m95-breakpoint-narrow').trim(),
            tablet: rootStyle.getPropertyValue('--wm-m95-breakpoint-tablet').trim(),
            laptop: rootStyle.getPropertyValue('--wm-m95-breakpoint-laptop').trim(),
            wide: rootStyle.getPropertyValue('--wm-m95-breakpoint-wide').trim(),
          },
        };
      });

      // Verify the runtime contract itself instead of a bundler-dependent stylesheet URL.
      // Vite injects host CSS imported by src/main.ts without preserving the source filename
      // in document.styleSheets[].href, while embedded application HTML uses direct <link>s.
      expect(result.m95Breakpoints).toEqual({
        narrow: '40rem',
        tablet: '52.5rem',
        laptop: '70rem',
        wide: '90rem',
      });
      expect(result.scroll).toBeLessThanOrEqual(result.client + 2);
    });
  }
}
