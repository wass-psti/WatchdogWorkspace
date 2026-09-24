import { test, expect } from '@playwright/test';
const email=process.env.WM_M54_E2E_ADMIN_EMAIL||'';
const password=process.env.WM_M54_E2E_ADMIN_PASSWORD||'';
const productionUrl=(process.env.WM_PLAYWRIGHT_BASE_URL||'').replace(/\/?$/,'/');
const liveUrl=(hash)=>new URL(hash,productionUrl).href;
const go=async(page,route)=>page.evaluate((r)=>{location.hash=`#/${r}`;},route);
test('@m54-live authenticated production administrator can traverse certified host and module workflows',async({page})=>{
  await page.goto(liveUrl('#/login'));
  const form=page.locator('form[data-auth-form="login"]');
  await expect(form).toBeVisible();
  await form.locator('input[name="email"]').fill(email);
  await form.locator('input[name="password"]').fill(password);
  await form.getByRole('button',{name:'Sign in'}).click();
  await expect(form).toBeHidden({timeout:20000});
  await go(page,'account');
  await expect(page.locator('[data-wm-management-view="account"]')).toBeVisible({timeout:20000});
  await expect(page.locator('[data-wm-management-view="account"]')).toContainText(email,{ignoreCase:true});
  await go(page,'settings');
  await expect(page.locator('[data-wm-management-view="settings"]')).toBeVisible();
  await go(page,'users');
  await expect(page.locator('[data-wm-management-view="users"]')).toBeVisible();
  await go(page,'boards');
  await expect(page.getByRole('heading',{name:'Boards',level:1})).toBeVisible();
  for(const moduleId of ['time-tracker','fueltrack-plus','tradelink']){
    await go(page,`app/${moduleId}`);
    await expect(page.locator('#moduleFrame')).toBeVisible({timeout:15000});
    await page.waitForFunction((id)=>globalThis.WorkManagementRuntime?.getContext?.()?.moduleId===id,moduleId);
    const context=await page.evaluate(()=>globalThis.WorkManagementRuntime?.getContext?.());
    expect(context?.identity?.module?.enabled).toBe(true);
    expect(context?.identity?.module?.role).toBeTruthy();
  }
});
