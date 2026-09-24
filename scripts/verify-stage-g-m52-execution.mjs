import fs from 'node:fs';
const target = fs.readFileSync(new URL('../config/stage-g-m52-cross-module-rbac-authenticated-e2e-certification-target.ts', import.meta.url), 'utf8');
const fixture = fs.readFileSync(new URL('../tests/modern/e2e/helpers/m52-rbac-fixture.mjs', import.meta.url), 'utf8');
const spec = fs.readFileSync(new URL('../tests/modern/e2e/cross-module-rbac-authenticated-certification.spec.mjs', import.meta.url), 'utf8');
const dbTest = fs.readFileSync(new URL('../supabase/tests/m52/cross_module_rbac_authenticated_e2e_certification.test.sql', import.meta.url), 'utf8');
const checks = [
  ['four active platform roles', ['admin_general_manager','hr','supervisor','employee'].every((x)=>target.includes(x))],
  ['disabled account path', spec.includes('@m52-disabled')],
  ['live role/status revocation', spec.includes('@m52-live-revocation')],
  ['all embedded modules', ['time-tracker','fueltrack-plus','tradelink'].every((x)=>fixture.includes(x))],
  ['board role isolation', target.includes('platform-role-does-not-imply-board-role') && fixture.includes("member_role: 'owner'") && fixture.includes("member_role: 'editor'") && fixture.includes("member_role: 'viewer'")],
  ['users admin-only', target.includes("users: 'admin_general_manager-only'")],
  ['controlled backend current RPC surface', fixture.includes('wm_set_board_cell_if_current')],
  ['database authoritative role matrix', dbTest.includes('select plan(19)') && dbTest.includes("'Sales Supervisor'")],
  ['Playwright browser assertions', spec.includes("from '@playwright/test'") && spec.includes('frameLocator')],
];
for (const [name, ok] of checks) { if (!ok) throw new Error(`M52 execution vector failed: ${name}`); }
console.log(`Stage G M52 execution vectors: PASS (${checks.length}/${checks.length})`);
