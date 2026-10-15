import { test, expect } from '@playwright/test';

// Fail closed if the isolated browser harness tries to contact any hosted endpoint.
test.beforeEach(async ({page}) => {
  await page.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.hostname === '127.0.0.1' && (u.protocol === 'http:' || u.protocol === 'ws:')) return route.continue();
    return route.abort();
  });
});

const launch = async (page) => {
  await page.goto('/tests/modern/e2e/m144-wizard-harness.html');
  await page.locator('#launch').click();
  await expect(page.getByRole('dialog', {name:'Board Import'})).toHaveCount(1);
};
const upload = async (page,csv='Name,Notes\nExisting,old note\nNew Item,new note\n') => {
  await page.locator('[data-wizard-file]').setInputFiles({name:'m144.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
  await expect(page.getByRole('heading',{name:'Map your columns'})).toBeVisible();
};
const toMatches = async (page) => {
  await page.locator('[data-wizard-next]').click();
  await expect(page.getByRole('heading',{name:'Handle matches'})).toBeVisible();
};
const getCalls = (page) => page.evaluate(()=>window.__m144.calls);
const configureMatch = async (page,behavior) => {
  await page.locator(`input[name="wizard-behavior"][value="${behavior}"]`).check();
  await page.locator('[data-wizard-match-column]').selectOption('item');
};

test('M144: view-only account cannot open import wizard or dispatch mutation',async({page})=>{
  await page.goto('/tests/modern/e2e/m144-wizard-harness.html');
  await page.evaluate(()=>window.__m144.setEdit(false));
  await page.locator('#launch').click();
  await expect(page.locator('[data-board-import-wizard]')).toHaveCount(0);
  expect(await getCalls(page)).toHaveLength(0);
  expect(await page.evaluate(()=>window.__m144.toasts.join(' '))).toMatch(/permission/i);
});

test('M144: upload, map new group/column, atomic Add and confirmed success',async({page})=>{
  await launch(page);await upload(page,'Name,Extra\nAlpha,new value\n');
  await page.locator('[data-wizard-group]').selectOption('create');
  await page.locator('[data-wizard-group-name]').fill('QA imported group');
  await page.locator('[data-wizard-group-name]').press('Tab');
  await page.locator('[data-wizard-mapping="1"]').selectOption('create');
  await toMatches(page);
  await expect(page.locator('[data-wizard-next]')).toBeEnabled();
  await page.locator('[data-wizard-next]').click();
  await expect(page.locator('[data-board-import-wizard]')).toHaveCount(0);
  const calls=await getCalls(page);expect(calls).toHaveLength(1);
  expect(calls[0].boardId).toBe('11111111-1111-4111-8111-111111111111');
  expect(calls[0].payload.newColumns).toHaveLength(1);
  expect(calls[0].payload.group).toMatchObject({action:'create',name:'QA imported group'});
  expect(calls[0].payload.rows[0].values.Extra).toBe('new value');
  await expect.poll(()=>page.evaluate(()=>window.__m144.refreshCount)).toBe(1);
  expect(await page.evaluate(()=>window.__m144.toasts.join(' '))).toMatch(/1 created.*1 columns.*1 groups/);
  await expect(page.locator('#launch')).toBeFocused();
});

test('M144: skip existing title and create only unmatched row',async({page})=>{
  await launch(page);await upload(page);await toMatches(page);await configureMatch(page,'skip');
  await expect(page.locator('[data-wizard-next]')).toBeEnabled();
  await expect(page.locator('.wm-import-wizard-summary')).toContainText('1 skipped');
  await page.locator('[data-wizard-next]').click();
  await expect.poll(async()=> (await getCalls(page)).length).toBe(1);
  const req=(await getCalls(page))[0];
  expect(req.payload.matches).toMatchObject({behavior:'skip',matchColumnId:'item'});
  expect(req.payload.rows).toHaveLength(2);
});

test('M144: update mode supplies matched Item CAS version',async({page})=>{
  await launch(page);await upload(page);await toMatches(page);await configureMatch(page,'update');
  await expect(page.locator('.wm-import-wizard-summary')).toContainText('1 to update');
  await page.locator('[data-wizard-next]').click();
  await expect.poll(async()=> (await getCalls(page)).length).toBe(1);
  const rows=(await getCalls(page))[0].payload.rows;
  expect(rows[0].expected_item_updated_at).toBe('2026-10-13T02:59:00.000Z');
  expect(rows[1].expected_item_updated_at).toBeUndefined();
});

test('M144: missing matching key is fail closed and never commits',async({page})=>{
  await launch(page);await upload(page);await toMatches(page);
  await page.locator('input[name="wizard-behavior"][value="update"]').check();
  await expect(page.locator('[data-wizard-next]')).toBeDisabled();
  expect(await getCalls(page)).toHaveLength(0);
});

test('M144: inflight transaction blocks duplicate dispatch, Back, Classic, Close and Escape',async({page})=>{
  await page.goto('/tests/modern/e2e/m144-wizard-harness.html');
  await page.evaluate(()=>window.__m144.setMode('pending'));
  await page.locator('#launch').click();await upload(page,'Name\nSolo\n');await toMatches(page);
  await page.locator('[data-wizard-next]').click();
  await expect.poll(async()=> (await getCalls(page)).length).toBe(1);
  for(const selector of ['[data-wizard-next]','[data-wizard-back]','[data-wizard-classic]','[data-wizard-close]']) {
    await expect(page.locator(selector)).toBeDisabled();
  }
  await page.locator('.wm-import-wizard').press('Escape');
  await page.evaluate(()=>window.__m144.open());
  await expect(page.locator('[data-board-import-wizard]')).toHaveCount(1);
  expect(await getCalls(page)).toHaveLength(1);
  expect(await page.evaluate(()=>window.__m144.classicCount)).toBe(0);
  await page.evaluate(()=>window.__m144.resolve());
  await expect(page.locator('[data-board-import-wizard]')).toHaveCount(0);
});

test('M144: uncertain RPC outcome disables resubmit until explicit restart',async({page})=>{
  await page.goto('/tests/modern/e2e/m144-wizard-harness.html');
  await page.evaluate(()=>window.__m144.setMode('reject'));
  await page.locator('#launch').click();await upload(page,'Name\nSolo\n');await toMatches(page);
  await page.locator('[data-wizard-next]').click();
  await expect(page.getByRole('alert').first()).toContainText(/RPC failure|not confirmed/i);
  await expect(page.locator('[data-wizard-next]')).toBeDisabled();
  await page.locator('.wm-import-wizard').press('Escape');
  await expect(page.locator('[data-board-import-wizard]')).toHaveCount(0);
  expect(await getCalls(page)).toHaveLength(1);
});

test('M144: stale Board snapshot and invalid numeric cell block RPC',async({page})=>{
  await launch(page);await upload(page,'Name,Amount\nSolo,not-a-number\n');
  await page.locator('[data-wizard-mapping="1"]').selectOption('create');
  await page.locator('[data-wizard-new-type="1"]').selectOption('number');
  await toMatches(page);
  await expect(page.locator('[data-wizard-next]')).toBeDisabled();
  expect(await getCalls(page)).toHaveLength(0);
  await page.locator('.wm-import-wizard').press('Escape');
  await page.locator('#launch').click();await upload(page,'Name\nSolo\n');await toMatches(page);
  await page.evaluate(()=>window.__m144.mutateVersion());
  await page.locator('[data-wizard-next]').click();
  await expect(page.getByRole('alert').first()).toContainText(/Board changed/i);
  expect(await getCalls(page)).toHaveLength(0);
});
