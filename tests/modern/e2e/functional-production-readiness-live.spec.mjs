import { test, expect } from '@playwright/test';
const email=process.env.WM_M54_E2E_ADMIN_EMAIL||'';
const password=process.env.WM_M54_E2E_ADMIN_PASSWORD||'';
const productionUrl=(process.env.WM_PLAYWRIGHT_BASE_URL||'').replace(/\/?$/,'/');
const liveUrl=(hash)=>new URL(hash,productionUrl).href;
const go=async(page,route)=>page.evaluate((r)=>{location.hash=`#/${r}`;},route);
test('@m54-live authenticated production administrator can traverse certified host and module workflows',async({page})=>{
  test.setTimeout(120_000);
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
  for(const moduleId of ['time-tracker','fueltrack-plus','tradelink','material-tracker']){
    console.log('[M54] Checking module:', moduleId);
    // Material Tracker uses authenticated Supabase RPC bootstrap, not legacy
    // iframe WM_IDENTITY_CONTEXT / WM_MODULE_ACCESS globals.
    // Listen BEFORE navigating so the actual module bootstrap cannot be missed.
    const materialBootstrapPromise = moduleId === 'material-tracker'
      ? page.waitForResponse((response) => {
          const pathname = new URL(response.url()).pathname;
          return pathname === '/rest/v1/rpc/material_tracker_bootstrap'
            && response.request().method() === 'POST';
        }, { timeout: 30_000 })
      : null;
    await go(page,`app/${moduleId}`);
    const frame=page.locator('#moduleFrame');
    await expect(frame).toBeVisible({timeout:15000});
    await page.waitForFunction((id)=>globalThis.WorkManagementRuntime?.getContext?.()?.moduleId===id,moduleId);
    const hostContext=await page.evaluate(()=>globalThis.WorkManagementRuntime?.getContext?.());
    expect(hostContext?.moduleId).toBe(moduleId);
    expect(hostContext?.authenticated).toBe(true);
    const frameHandle=await frame.elementHandle();
    expect(frameHandle).toBeTruthy();
    const moduleFrame=await frameHandle.contentFrame();
    expect(moduleFrame).toBeTruthy();
    if (moduleId === 'material-tracker') {
      // A rendered UI alone is insufficient: require the actual role-granting
      // RPC from THIS iframe, a valid workspace, and the expected ADMIN role.
      const response = await materialBootstrapPromise;
      expect(response.frame()).toBe(moduleFrame);
      expect(response.ok(), 'Material Tracker bootstrap RPC failed').toBe(true);
      const bootstrap = await response.json();
      expect(bootstrap?.role, 'Material Tracker RPC must grant ADMIN role').toBe('ADMIN');
      const request = response.request().postDataJSON();
      expect(request?.p_workspace_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      await expect(moduleFrame.locator('[data-module="material-tracker"]')).toBeVisible({ timeout: 20_000 });
      await expect(moduleFrame.locator('body')).not.toContainText('Material Tracker could not initialize:');
      await expect(moduleFrame.getByRole('tab', { name: 'Add Material' })).toBeVisible();
      console.log('[M54] Material Tracker actual workspace bootstrap/ADMIN contract: PASS');
      continue;
    }
    try {
      await moduleFrame.waitForFunction(
        (id) => globalThis.WM_IDENTITY_CONTEXT?.moduleId === id
          && globalThis.WM_MODULE_ACCESS?.moduleId === id,
        moduleId,
        { timeout: 20_000 },
      );
    } catch (error) {
      const diagnostic = await moduleFrame.evaluate(() => ({
        documentReadyState: document.readyState,
        materialTrackerRendered: Boolean(
          document.querySelector('[data-module="material-tracker"]')
        ),
        identityBridgePresent: globalThis.WMIdentityReady !== undefined,
        identityModuleId: globalThis.WM_IDENTITY_CONTEXT?.moduleId ?? null,
        accessModuleId: globalThis.WM_MODULE_ACCESS?.moduleId ?? null,
      })).catch(() => ({ frameUnavailable: true }));

      console.error('[M54] Module identity diagnostic:',
        moduleId, JSON.stringify(diagnostic));
      throw error;
    }
    const identity=await moduleFrame.evaluate(()=>globalThis.WM_IDENTITY_CONTEXT);
    const access=await moduleFrame.evaluate(()=>globalThis.WM_MODULE_ACCESS);
    expect(identity?.accountStatus).toBe('active');
    expect(identity?.module?.enabled).toBe(true);
    expect(identity?.module?.role).toBeTruthy();
    expect(access?.allowed).toBe(true);
    expect(access?.role).toBe(identity?.module?.role);
    if(moduleId==='material-tracker'){
      await expect(moduleFrame.locator('[data-module="material-tracker"]')).toBeVisible({timeout:20000});
      await expect(moduleFrame.locator('body')).not.toContainText('Material Tracker could not initialize:',{timeout:20000});
    }
  }
});
