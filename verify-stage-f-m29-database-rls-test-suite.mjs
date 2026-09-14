import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname);
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const stateOf=(file)=>read(file).match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
const state=stateOf('config/stage-f-m29-database-rls-test-suite-target.ts');
const m28=stateOf('config/stage-f-m28-edge-functions-target.ts');
const target=read('config/stage-f-m29-database-rls-test-suite-target.ts');
const manifest=read('config/application-manifest.ts');
const manifestTypes=read('src/types/manifest.ts');
const manifestSchema=read('src/runtime-schemas/manifest.ts');
const schema=read('supabase/schema.sql');
const migration=read('supabase/migrations/v1.43.2-stage-f-m29-database-rls-hardening.sql');
const correctiveMigration=read('supabase/migrations/v1.43.2-stage-f-m29-database-rls-corrective.sql');
const supabaseConfig=read('supabase/config.toml');
const runner=read('scripts/run-database-rls-tests.mjs');
const pkg=JSON.parse(read('package.json'));
const ci=read('.github/workflows/ci.yml');
const deploy=read('.github/workflows/deploy-pages.yml');
const dbWorkflow=read('.github/workflows/database-tests.yml');
const project=read('verify-project.sh');
const docs=read('docs/WORK-MANAGEMENT-DATABASE-RLS-TESTS.md');
const bootstrapCompatibility=read('M29-LOCAL-DATABASE-BOOTSTRAP-COMPATIBILITY.md');
const arch=Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1]??0);

assert(m28==='active-certified',`M29 requires M28 active-certified; found ${m28}.`);
assert(['implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state),`Invalid M29 state ${state}.`);
assert(arch>=37,`M29 requires Architecture 37+; found ${arch}.`);
for(const marker of [
  "databaseRlsTests: 'pgtap-supabase-cli-v1'",
  "databaseRlsTestRoot: 'supabase/tests/database'",
  "databaseRlsTestRunner: 'scripts/run-database-rls-tests.mjs'",
  "databaseAuthorizationHardening: 'rpc-only-sensitive-mutations-v1'",
]) assert(manifest.includes(marker),`Application manifest missing M29 authority: ${marker}`);
assert(manifestTypes.includes("databaseRlsTests?: 'pgtap-supabase-cli-v1'")&&manifestTypes.includes("databaseAuthorizationHardening?: 'rpc-only-sensitive-mutations-v1'"),'Manifest types must expose Architecture 37 database/RLS authority.');
assert(manifestSchema.includes("databaseRlsTests: z.literal('pgtap-supabase-cli-v1').optional()")&&manifestSchema.includes('Architecture v37+ requires the pgTAP/Supabase CLI database-RLS test authority'),'Runtime manifest schema must enforce Architecture 37 database/RLS authority.');

const suites=[
 'supabase/tests/database/00_rls_structure.test.sql',
 'supabase/tests/database/10_account_rbac.test.sql',
 'supabase/tests/database/20_module_state_authorization.test.sql',
 'supabase/tests/database/30_board_authorization.test.sql',
];
for(const file of suites){
  assert(fs.existsSync(path.join(root,file)),`Missing M29 pgTAP suite ${file}.`);
  const sql=read(file);
  assert(/^begin;/m.test(sql)&&/select plan\(\d+\);/i.test(sql)&&/select \* from finish\(\);/i.test(sql)&&/rollback;/i.test(sql),`${file} must use transactional pgTAP structure.`);
}
const suitePlans=suites.map((file)=>Number(read(file).match(/plan\((\d+)\)/i)?.[1]??0));
assert(suitePlans.reduce((sum,count)=>sum+count,0)===87,'M29 corrective pgTAP suite must preserve the certified 87-assertion contract.');
assert(target.includes('assertions: 87'),'M29 target must declare the 87-assertion coverage contract.');
const suiteText=suites.map(read).join('\n');
for(const marker of [
 'anon cannot read profiles','employee sees only own profile','Admin cannot bypass safeguards with direct profile UPDATE',
 'Admin cannot bypass derived roles with direct UPDATE','last-admin safeguard remains enforced','bootstrap administrator safeguard remains enforced',
 'module state table is not directly readable','cross-module state key is rejected','another user cannot read caller-owned module state','disabled account cannot invoke module-state read RPC',
 'non-trigger public SECURITY DEFINER functions are not executable by PUBLIC','anon cannot execute any non-trigger public SECURITY DEFINER function','board tables remain RPC-only','editor cannot manage board lifecycle','viewer cannot edit board','non-member Board view helper fails closed','non-member Board edit helper fails closed','non-member Board manage helper fails closed','unknown Board access requirement fails closed','non-member cannot read board','disabled board member cannot read board','non-member cannot join Board realtime topic',
]) assert(suiteText.includes(marker),`M29 behavioral coverage missing: ${marker}`);

const rlsTables=[...schema.matchAll(/alter table\s+public\.([a-z0-9_]+)\s+enable row level security/gi)].map((m)=>m[1]);
assert(new Set(rlsTables).size===16,`M29 expects 16 public RLS tables; found ${new Set(rlsTables).size}.`);
assert(suites[0]&&read(suites[0]).match(/relrowsecurity/g)?.length===16,'Structural suite must explicitly assert all 16 public RLS tables.');
for(const marker of [
 'revoke update on table public.profiles from authenticated',
 'drop policy if exists "profiles_admin_update" on public.profiles',
 'revoke insert, update, delete on table public.module_role_assignments from authenticated',
 'drop policy if exists "assignments_admin_update" on public.module_role_assignments',
]){
  assert(migration.includes(marker),`M29 migration missing hardening marker: ${marker}`);
  assert(schema.includes(marker),`Authoritative schema missing M29 hardening marker: ${marker}`);
}
for(const marker of [
 'revoke all on function public.is_platform_admin(uuid) from public',
 'grant execute on function public.is_platform_admin(uuid) to authenticated',
]) assert(migration.includes(marker),`Original M29 migration provenance missing marker: ${marker}`);
for(const marker of [
  'revoke execute on all functions in schema public from anon',
  'revoke execute on all functions in schema public from public',
  'alter default privileges for role postgres in schema public revoke execute on functions from anon',
  'alter default privileges for role postgres in schema public revoke execute on functions from public',
  'grant execute on function public.is_platform_admin(uuid) to authenticated',
]) {
  assert(correctiveMigration.includes(marker),`M29 corrective migration missing function ACL hardening marker: ${marker}`);
  assert(schema.includes(marker),`M29 corrective schema missing function ACL hardening marker: ${marker}`);
}
assert(target.includes("correctiveMigration: 'supabase/migrations/v1.43.2-stage-f-m29-database-rls-corrective.sql'"),'M29 target must identify the corrective forward migration.');
assert(schema.includes("regexp_replace(trim(coalesce(p_display_name,'')), '[[:space:]]+', ' ', 'g')"),'M29 corrective schema must use deterministic POSIX whitespace normalization.');
assert(correctiveMigration.includes("regexp_replace(trim(coalesce(p_display_name,'')), '[[:space:]]+', ' ', 'g')"),'M29 corrective migration must deploy deterministic display-name normalization.');
for(const marker of [
  "return coalesce(member_role='owner',false)",
  "return coalesce(member_role in ('owner','editor'),false)",
  "return coalesce(member_role in ('owner','editor','viewer'),false)",
  "if p_required='view'",
  "return false;",
]) {
  assert(schema.includes(marker),`M29 corrective schema missing fail-closed Board authorization marker: ${marker}`);
  assert(correctiveMigration.includes(marker),`M29 corrective migration missing fail-closed Board authorization marker: ${marker}`);
}
assert(target.includes('boardAuthorizationFailsClosed: true')&&target.includes('displayNameNormalizationDeterministic: true'),'M29 target must declare corrective fail-closed Board authorization and deterministic profile normalization.');
const corrective=read('M29-DATABASE-RLS-CORRECTIVE-HOTFIX.md');
assert(corrective.includes('78 / 82')&&corrective.includes('three root causes')&&corrective.includes('fails closed'),'M29 corrective provenance must record the failed certification evidence and fail-closed correction.');

assert(target.includes("supabaseCliCertifiedVersion: '2.117.0'")&&target.includes('linkedOrProductionTestRunsForbiddenByCertification: true')&&target.includes("schemaBootstrapAuthority: 'supabase/schema.sql'")&&target.includes('historicalMigrationReplayDuringTests: false'),'M29 must pin the local-only schema-snapshot database test tooling policy.');
assert(supabaseConfig.includes('project_id = "work-management-local"'),'Supabase local project configuration must have a deterministic local project id.');
assert(!supabaseConfig.includes('[db.migrations]')&&!supabaseConfig.includes('[db.seed]'),'Test-only migration/seed disabling must not leak into the repository Supabase deployment config.');
assert(runner.includes("CERTIFIED_SUPABASE_CLI = '2.117.0'")&&runner.includes("LOCAL_PROJECT_ID = 'work-management-m29-tests'")&&runner.includes("[db.migrations]")&&runner.includes("enabled = false")&&runner.includes("schemaPath = resolve(projectRoot, 'supabase/schema.sql')")&&runner.includes("'psql', '-U', 'postgres'")&&runner.includes("['test', 'db', '--local', testsPath]"),'M29 runner must pin CLI, isolate a disposable stack, bootstrap the authoritative schema snapshot, and run local pgTAP tests.');
assert(!runner.includes("['db','reset'")&&!runner.includes("'--linked'"),'M29 test runner must not replay legacy migrations or contain linked-database execution.');
for(const script of ['database-rls:check','database-rls:test:local','database-rls:status','database-rls:activate','database-rls:activate:release']) assert(pkg.scripts?.[script],`package.json missing ${script}.`);
assert(pkg.scripts.check.includes('database-rls:check')&&pkg.scripts['release:check'].includes('database-rls:check'),'M29 static verification must participate in check and release:check.');
for(const workflow of [ci,deploy]) assert(workflow.includes('Stage F M29 Database/RLS test suite')&&workflow.includes('npm run database-rls:check'),'CI/deploy workflows must enforce the M29 static gate.');
assert(dbWorkflow.includes('supabase/setup-cli@v1')&&dbWorkflow.includes('version: 2.117.0')&&dbWorkflow.includes('actions/setup-node@v4')&&dbWorkflow.includes('npm run database-rls:test:local'),'Dedicated database workflow must run the pinned isolated local pgTAP suite through the governed runner.');
assert(!dbWorkflow.includes('supabase db reset')&&!dbWorkflow.includes('run: supabase start'),'Dedicated workflow must delegate stack lifecycle to the isolated M29 runner rather than replay repository migrations directly.');
assert(project.includes('verify-stage-f-m29-database-rls-test-suite.mjs'),'verify-project.sh must include M29 verification.');
assert(bootstrapCompatibility.includes('preserved')&&bootstrapCompatibility.includes('migration and seed replay')&&bootstrapCompatibility.includes('never targets a linked or production project'),'M29 must document the legacy-migration/local-bootstrap compatibility boundary.');
assert(docs.includes('pgTAP')&&docs.includes('supabase test db')&&docs.includes('production database is never reset')&&docs.includes('authoritative `supabase/schema.sql`')&&docs.includes('does **not** rename historical migration provenance'),'M29 documentation must describe the test framework, schema-snapshot bootstrap, legacy migration compatibility, and production safety boundary.');

const result=spawnSync(process.execPath,['--experimental-strip-types','--disable-warning=ExperimentalWarning','config/stage-f-m29-database-rls-test-suite-target.ts'],{cwd:root,encoding:'utf8'});
assert(result.status===0,`M29 target TypeScript parse failed: ${result.stderr}`);
console.log(`Stage F Milestone 29 Database/RLS test suite verification: PASS (state=${state}; architecture=${arch}; rlsTables=16; suites=${suites.length}; assertions=87; hardening=rpc-only-sensitive-mutations)`);
