import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname);
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const target = read('config/stage-g-m52-cross-module-rbac-authenticated-e2e-certification-target.ts');
const spec = read('tests/modern/e2e/cross-module-rbac-authenticated-certification.spec.mjs');
const fixture = read('tests/modern/e2e/helpers/m52-rbac-fixture.mjs');
const permissions = read('assets/js/platform/auth/permissions.ts');
const rolesSql = read('supabase/migrations/v1.14.2-rbac-reconciliation.sql');
const routePolicy = read('assets/js/runtime/services/route-policy.ts');
const moduleBridge = read('assets/js/core/module-identity-bridge.ts');
const dbTest = read('supabase/tests/m52/cross_module_rbac_authenticated_e2e_certification.test.sql');
const m51Verifier = read('verify-stage-g-m51-boards-realtime-concurrency-stabilization.mjs');
const required = (condition, message) => { if (!condition) throw new Error(message); };
required(target.includes("activationState: 'implementation-complete-pending-certification'") || target.includes("activationState: 'active-certified'"), 'M52 target activation state must be pending certification or active-certified.');
for (const role of ['admin_general_manager','hr','supervisor','employee']) required(target.includes(role), `M52 target missing role ${role}`);
for (const moduleId of ['time-tracker','fueltrack-plus','tradelink']) required(target.includes(moduleId), `M52 target missing module ${moduleId}`);
required(target.includes("users: 'admin_general_manager-only'"), 'M52 Users host-route policy missing.');
required(target.includes("boards: 'all-active-authenticated'"), 'M52 Boards host-route policy missing.');
required(target.includes("authority: 'board-membership-role'"), 'M52 must preserve board-scoped authorization.');
required(spec.includes('@m52-disabled') && spec.includes('@m52-live-revocation'), 'M52 browser suite must cover disabled and live revocation.');
required(spec.includes('data-wm-management-view=\\"users\\"') || spec.includes('data-wm-management-view="users"'), 'M52 suite must cover Users route.');
required(spec.includes("for (const assignment of expected.assignments)"), 'M52 suite must iterate all embedded module assignments.');
required(m51Verifier.includes('pending certification or active-certified'), 'M51 historical verifier must be successor-aware after M51 certification.');
required(dbTest.includes('select plan(19)') && dbTest.includes('Administrator access required'), 'M52 database suite must validate authoritative role mapping and admin-only directory access.');
required(fixture.includes("wm_set_board_cell_if_current"), 'M52 controlled backend must advertise the current M51 CAS RPC.');
required(fixture.includes("member_role: 'owner'") && fixture.includes("member_role: 'editor'") && fixture.includes("member_role: 'viewer'"), 'M52 Board fixture must prove platform role does not imply elevated Board role.');
required(permissions.includes("admin_general_manager: Object.freeze([CAPABILITIES.PLATFORM_ADMIN, CAPABILITIES.ROLE_MANAGE, CAPABILITIES.MODULE_ACCESS_ALL])"), 'Current platform-admin capability contract changed unexpectedly.');
required(routePolicy.includes("context.route.name==='users'&&!context.canManageUsers"), 'Users route must remain fail-closed for non-admin roles.');
required(moduleBridge.includes("parsed.data.accountStatus === 'active'") && moduleBridge.includes('parsed.data.module.enabled'), 'Embedded module identity bridge must require active account + enabled assignment.');
for (const expected of [
  "when 'admin_general_manager' then 'System Admin'",
  "when 'hr' then 'HR'",
  "when 'supervisor' then 'Supervisor'",
  "when 'admin_general_manager' then 'Admin'",
  "when 'admin_general_manager' then 'General Manager'",
  "when 'supervisor' then 'Sales Supervisor'",
]) required(rolesSql.includes(expected), `Authoritative sync_module_roles mapping missing: ${expected}`);
console.log('Stage G M52 Cross-Module RBAC & Authenticated E2E Certification verification: PASS');
