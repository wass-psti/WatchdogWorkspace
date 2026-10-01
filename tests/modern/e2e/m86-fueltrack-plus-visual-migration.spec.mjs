import {test,expect} from '@playwright/test';
test('M86 FuelTrack+ presentation layer is effective without changing workflow affordances',async({page})=>{
 await page.goto('/apps/fueltrack-plus/runtime.html');
 await page.evaluate(()=>{document.body.innerHTML=`<main class="content"><section class="dashboard-page-head"><h2>Dashboard</h2></section><section class="analytics-kpi-grid"><div class="wm-metric-card">Metric</div></section><section class="request-table wm-data-region">Requests</section><section class="approval-card">Approval</section><section class="lightfuel-card">LightFuels</section><section class="activity-event-card">Activity</section><dialog class="app-dialog wm-dialog"></dialog><div class="refueling-completion-grid"><label>Amount<input></label><label>Invoice<input></label></div><button class="button primary">Complete</button></main>`;});
 const marker=await page.locator('body').evaluate(el=>getComputedStyle(el).getPropertyValue('--m86-ft-surface').trim());expect(marker).not.toBe('');
 const cardRadius=await page.locator('.wm-metric-card').evaluate(el=>getComputedStyle(el).borderRadius);expect(cardRadius).not.toBe('0px');
 const button=page.locator('.button.primary');await button.focus();await expect(button).toBeFocused();
 await page.setViewportSize({width:390,height:844});const cols=await page.locator('.refueling-completion-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns);expect(cols.split(' ').length).toBe(1);
});
