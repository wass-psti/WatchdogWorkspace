import { test, expect } from '@playwright/test';

const base = process.env.WM_PLAYWRIGHT_BASE_URL;
const retired = [
  '/assets/css/foundation/host-ui-migration.css',
  '/assets/css/foundation/boards-ui-migration.css',
  '/apps/time-tracker/m74-harmonization.css',
  '/apps/fueltrack-plus/m75-harmonization.css',
  '/apps/tradelink/m76-harmonization.css',
];

test('retired styling paths are no longer served as stylesheets', async ({ request }) => {
  for (const retiredPath of retired) {
    const response = await request.get(`${base}${retiredPath}`, { failOnStatusCode: false });
    const contentType = response.headers()['content-type'] ?? '';

    // Vite's SPA fallback may return index.html with HTTP 200 for a missing asset path.
    // Retirement means the URL must not resolve as a CSS resource. A non-2xx response
    // or a successful HTML fallback both prove that the retired stylesheet is absent.
    if (response.ok()) {
      expect(contentType, `${retiredPath} must not resolve as CSS`).not.toMatch(/(?:^|;)\s*text\/css\b/i);
      const body = await response.text();
      expect(body, `${retiredPath} returned an unexpected successful non-HTML resource`).toMatch(/<!doctype html>|<html[\s>]/i);
    }
  }
});

test('host preserves retired M72 update-banner composition under M95',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto(`${base}/`,{waitUntil:'domcontentloaded'});const cols=await page.evaluate(()=>{document.body.dataset.wmSurface='shell';const el=document.createElement('div');el.className='update-banner wm-status-message';el.style.cssText='display:grid;width:300px';el.innerHTML='<span>a</span><span>b</span>';document.body.append(el);return getComputedStyle(el).gridTemplateColumns;});expect(cols.trim().split(/\s+/)).toHaveLength(1);});
test('TimeTracker M85 owns the retired M74 reconciliation',async({page})=>{await page.goto(`${base}/apps/time-tracker/index.html`,{waitUntil:'domcontentloaded'});const x=await page.evaluate(()=>{const metric=document.createElement('div');metric.className='wm-metric-card overview-stat';document.body.append(metric);const region=document.createElement('div');region.className='wm-data-region log-list';document.body.append(region);return{radius:getComputedStyle(metric).borderRadius,shadow:getComputedStyle(metric).boxShadow,bg:getComputedStyle(region).backgroundColor};});expect(x.radius).toBe('0px');expect(x.shadow).toBe('none');expect(x.bg).toBe('rgba(0, 0, 0, 0)');});
test('FuelTrack+ M86 owns active M75 reconciliation without M75 marker',async({page})=>{await page.goto(`${base}/apps/fueltrack-plus/runtime.html`,{waitUntil:'domcontentloaded'});const x=await page.evaluate(()=>{const metric=document.createElement('div');metric.className='wm-metric-card';document.body.append(metric);const d=document.createElement('div');d.className='app-dialog wm-dialog';document.body.append(d);return{marker:document.body.dataset.wmFuelTrackHarmonized??'',min:getComputedStyle(metric).minWidth,pad:getComputedStyle(d).padding};});expect(x.marker).toBe('');expect(x.min).toBe('0px');expect(x.pad).toBe('0px');});
test('TradeLink M87 owns active M76 reconciliation without M76 marker',async({page})=>{await page.goto(`${base}/apps/tradelink/runtime.html`,{waitUntil:'domcontentloaded'});const x=await page.evaluate(()=>{const d=document.createElement('div');d.className='company-panel wm-dialog';document.body.append(d);return{marker:document.body.dataset.wmTradeLinkHarmonized??'',pad:getComputedStyle(d).padding};});expect(x.marker).toBe('');expect(x.pad).toBe('0px');});
