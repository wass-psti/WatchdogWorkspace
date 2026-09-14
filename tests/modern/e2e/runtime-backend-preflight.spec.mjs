import { test, expect } from '@playwright/test';
import { installSupabaseFixture, seedAuthenticatedSession, waitForFixtureAuthentication, navigateFixtureRoute } from './helpers/m37-supabase-fixture.mjs';

async function boot(page,fixtureOptions={}){await seedAuthenticatedSession(page);await installSupabaseFixture(page,fixtureOptions);await page.goto('/#/');await waitForFixtureAuthentication(page);}

test('@m38-ready capability-complete backend does not leave Account behind the M38 gate', async ({page})=>{
 await boot(page);await navigateFixtureRoute(page,'account');await expect(page.locator('[data-wm-backend-preflight]')).toHaveCount(0,{timeout:10000});
});

test('@m38-missing module-specific missing Users RPC renders explicit gate', async ({page})=>{
 await boot(page,{runtimeCapabilityOverrides:{rpcs:[],missing_rpcs:['list_user_directory','admin_set_user_access']}});await navigateFixtureRoute(page,'users');const gate=page.locator('[data-wm-backend-preflight="users"]');await expect(gate).toBeVisible();await expect(gate).toContainText('rpc:list_user_directory');
});

test('@m38-schema capability schema mismatch is reported explicitly', async ({page})=>{
 await boot(page,{runtimeCapabilityOverrides:{schema_version:'1.43.2-m38-v1'}});await navigateFixtureRoute(page,'settings');const gate=page.locator('[data-wm-backend-preflight="settings"]');await expect(gate).toBeVisible();await expect(gate).toContainText('WM_BACKEND_CAPABILITY_SCHEMA_MISMATCH');
});

test('@m38-contract missing capability RPC is reported explicitly', async ({page})=>{
 await boot(page,{runtimeCapabilityFailure:true});await navigateFixtureRoute(page,'boards');const gate=page.locator('[data-wm-backend-preflight="boards"]');await expect(gate).toBeVisible();await expect(gate).toContainText('WM_BACKEND_PREFLIGHT_CONTRACT_MISSING');
});
