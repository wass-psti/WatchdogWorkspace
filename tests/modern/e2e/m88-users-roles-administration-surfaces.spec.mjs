import {test,expect} from '@playwright/test';

test('M88 users and administration presentation layer is effective and responsive',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    document.body.innerHTML=`<main class="page users-page" data-wm-management-view="users" data-wm-users-admin-visual="m88"><section class="users-intro"><div class="role-policy"><span><b>Admin/General Manager</b>Full platform administration</span><span><b>HR</b>HR access</span><span><b>Supervisor</b>Supervisory access</span><span><b>Employee</b>Least privilege</span></div><div class="m88-role-boundaries"><article class="m88-boundary-card"><header><h4>Work Management global RBAC</h4></header><ul class="m88-scope-list"><li><strong>Global roles</strong><span>Admin/General Manager · HR · Supervisor · Employee</span></li></ul></article><article class="m88-boundary-card"><header><h4>Application-scoped authorization</h4></header></article></div></section><section class="settings-card user-directory-card"><div class="user-toolbar"><label class="app-search"><input /></label><button class="secondary-btn">Refresh</button></div><div class="user-directory"><form class="user-row"><div class="user-identity"><span class="avatar mini">AA</span><span><strong>Admin</strong><small>admin@example.test</small></span></div><label class="wm-field"><select><option>Admin/General Manager</option></select></label><label class="wm-field"><select><option>Active</option></select></label><div class="user-row-actions"><span class="status success">Active</span><button class="secondary-btn">Save</button></div></form></div></section></main>`;
  });
  const marker=await page.locator('html').evaluate((el)=>getComputedStyle(el).getPropertyValue('--m88-admin-surface').trim());
  expect(marker).toBe('1');
  const boundaryRadius=await page.locator('.m88-boundary-card').first().evaluate((el)=>getComputedStyle(el).borderRadius);
  expect(boundaryRadius).not.toBe('0px');
  await page.setViewportSize({width:390,height:844});
  const roleColumns=await page.locator('.role-policy').evaluate((el)=>getComputedStyle(el).gridTemplateColumns);
  expect(roleColumns.split(' ').length).toBe(1);
  const directoryMinWidth=await page.locator('.user-directory').evaluate((el)=>getComputedStyle(el).minWidth);
  expect(directoryMinWidth).not.toBe('0px');
});
