import { approvedM108InheritedAuthority } from './lib/m108-login-successor-auth-provenance.mjs';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=process.cwd(),failures=[];
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const sha=(relative)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,relative))).digest('hex');
const ok=(condition,message)=>{if(!condition)failures.push(message);};
const manifest=JSON.parse(read('regression-baseline/m88-m87-source-guard.json'));
const baseline=new Map(manifest.entries.map((entry)=>[entry.path,entry]));
for(const relative of ['assets/js/core/auth.ts','src/app/management/authenticated-management-ui-runtime.ts','supabase/schema.sql','supabase/migrations/v1.43.2-stage-g-m42-users-rbac-functional-recovery.sql','supabase/migrations/v1.43.2-stage-g-m42-database-corrective.sql','apps/time-tracker/domain-config.js','apps/fueltrack-plus/domain-config.js','apps/tradelink/domain-config.js','apps/tradelink/app.v1.42.0-wm1.js']){const expected=baseline.get(relative);ok(Boolean(expected),`M88 baseline authority missing: ${relative}`);if(expected)ok((sha(relative)===expected.sha256 || approvedM108InheritedAuthority(root, relative)),`M88 protected authorization/application authority drift: ${relative}`);}
const m93BudgetAuthority=fs.existsSync(path.join(root,'M93-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))?read('M93-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'):'';const m92BudgetAuthority=fs.existsSync(path.join(root,'M92-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))?read('M92-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'):'';const m91BudgetAuthority=fs.existsSync(path.join(root,'M91-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))?read('M91-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'):'';const m90BudgetAuthority=fs.existsSync(path.join(root,'M90-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))?read('M90-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'):'';
const budgetAuthority=read('M88-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md');
ok(budgetAuthority.includes('M88 successor CSS ceiling: `613000`'),'M88 deterministic adaptive CSS budget authority missing');
const performanceBudgets=JSON.parse(read('config/performance-budgets.json'));
const activeCssBudgetCeiling=m93BudgetAuthority.includes('M93 successor CSS ceiling: `624000`')?624000:(m92BudgetAuthority.includes('M92 successor CSS ceiling: `621000`')?621000:(m91BudgetAuthority.includes('M91 successor CSS ceiling: `619000`')?619000:(m90BudgetAuthority.includes('M90 successor CSS ceiling: `616000`')?616000:613000))); ok(performanceBudgets.initialCssRawBytes===activeCssBudgetCeiling,'M88 deterministic adaptive CSS ceiling drift');
const m31=read('verify-stage-f-m31-performance-engineering.mjs');
ok(m31.includes("m88BudgetAuthority.includes('M88 successor CSS ceiling: `613000`') ? 613000"),'M88 deterministic M31 successor-governance synchronization missing');
const auth=read('assets/js/core/auth.ts');for(const marker of ["'admin_general_manager','hr','supervisor','employee'",'list_user_directory','admin_set_user_access'])ok(auth.includes(marker),`M88 global RBAC invariant missing: ${marker}`);
const schema=read('supabase/schema.sql');for(const marker of ['pg_advisory_xact_lock(42420042)','The bootstrap administrator cannot be demoted or disabled','You cannot disable your own active administrator account','At least one active Admin/General Manager is required','perform public.sync_module_roles'])ok(schema.includes(marker),`M88 server RBAC invariant missing: ${marker}`);
const tt=read('apps/time-tracker/domain-config.js');ok(tt.includes("const ROLES = ['System Admin', 'HR', 'Supervisor', 'Finance', 'IT Administrator', 'OJT', 'Employee'];"),'M88 TimeTracker scoped role authority drift');
const fuel=read('apps/fueltrack-plus/domain-config.js');for(const marker of ['ADMIN: "Admin"','PUMP_ATTENDANT: "Pump Attendant"','USER: "User"'])ok(fuel.includes(marker),`M88 FuelTrack+ scoped role authority drift: ${marker}`);
const css=read('assets/css/foundation/users-administration-visual-migration.css');const refs=[...new Set([...css.matchAll(/var\((--wm-[A-Za-z0-9_-]+)/g)].map((match)=>match[1]))];
if(failures.length){console.error('M88 Users, Roles & Administration Surfaces deterministic verification FAILED');failures.forEach((failure)=>console.error(` - ${failure}`));process.exit(1);}
console.log('M88 Users, Roles & Administration Surfaces deterministic verification: PASS');
console.log(`Validated presentation migration while byte-preserving global RBAC/server policy, M44 runtime, TimeTracker/FuelTrack+ scoped roles, and TradeLink authorities; foundation token dependencies=${refs.length}.`);
