import {test,expect} from '@playwright/test';
test('M85 TimeTracker presentation layer is effective without changing interaction affordances',async({page})=>{
  await page.goto('/apps/time-tracker/index.html');
  await page.evaluate(()=>{document.body.innerHTML=`<main data-tt-v2-screen="clock" class="clock-view"><section class="clock-card wm-panel"><div class="selector-grid"><label><span>Location</span><select><option>Offsite (Home)</option></select></label><label><span>Department</span><select><option>IT</option></select></label></div><label class="note-field"><span>Work note</span><input value="Field work"></label><div class="gps-panel">GPS evidence</div><div class="map-placeholder">Map</div><div class="clock-actions"><button class="clock-btn">Clock In</button></div></section><section class="log-record">Log</section><section class="report-kpi">Report</section><section class="calendar-day today">Calendar</section><section class="role-card current">Role</section><section class="ot-card">OT</section></main>`;});
  const marker=await page.locator('body').evaluate(el=>getComputedStyle(el).getPropertyValue('--m85-tt-surface').trim());expect(marker).not.toBe('');
  const mapRadius=await page.locator('.map-placeholder').evaluate(el=>getComputedStyle(el).borderRadius);expect(mapRadius).not.toBe('0px');
  const button=page.locator('.clock-btn');await button.focus();await expect(button).toBeFocused();
  await page.setViewportSize({width:390,height:844});const formColumns=await page.locator('.selector-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns);expect(formColumns.split(' ').length).toBeLessThanOrEqual(2);
});
