import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(f)=>fs.readFileSync(f,'utf8');
let checks=0;const check=(value,message)=>{assert.ok(value,message);checks+=1;};
const manifest=read('config/application-manifest.ts');
const types=read('src/types/manifest.ts');
const schema=read('src/runtime-schemas/manifest.ts');
const target=read('config/stage-g-m44-management-authority-consolidation-target.ts');
const m43=read('config/stage-g-m43-settings-functional-recovery-target.ts');
const app=read('assets/js/app.ts');
const runtimeGateway=read('assets/js/runtime/index.ts');
const runtimeAssets=read('config/runtime-assets.js');
const managementUi=read('src/app/management/AuthenticatedManagementUI.tsx');
const managementRuntime=read('src/app/management/authenticated-management-ui-runtime.ts');
const routePolicy=read('assets/js/runtime/services/route-policy.ts');
const m37Inventory=JSON.parse(read('regression-baseline/m37-functional-regression-inventory.json'));
const m37Execution=read('scripts/verify-functional-regression-baseline-execution.mjs');
const m13Verifier=read('verify-stage-c-m13-account-settings-user-management.mjs');
const m13Doc=read('docs/WORK-MANAGEMENT-ACCOUNT-SETTINGS-USER-MANAGEMENT.md');
const m40Verifier=read('verify-stage-g-m40-route-lifecycle-recovery.mjs');
const m40Execution=read('scripts/verify-route-lifecycle-recovery-execution.mjs');
const m40Browser=read('tests/modern/e2e/route-lifecycle-recovery.spec.mjs');
const securityVerifier=read('verify-stage-a-m2-security-baseline.mjs');
const reconciliationVerifier=read('verify-implementation-reconciliation.mjs');
const uiTsVerifier=read('verify-v1420-ui-typescript.mjs');
const m43Verifier=read('verify-stage-g-m43-settings-functional-recovery.mjs');
const deterministic=read('scripts/verify-management-authority-consolidation-execution.mjs');
const browser=read('tests/modern/e2e/management-authority-consolidation.spec.mjs');
const browserRunner=read('scripts/run-management-authority-consolidation-browser.mjs');
const releaseVerifier=read('scripts/verify-stage-g-m44-release.sh');
const finalizer=read('scripts/finalize-stage-g-m44.sh');
const artifactVerifier=read('scripts/verify-stage-g-m44-certified-artifact.mjs');
const certificationTree=read('scripts/lib/stage-g-m44-certification-tree.mjs');
const workflow=read('.github/workflows/management-authority-consolidation.yml');
const projectVerifier=read('verify-project.sh');
const release=read('RELEASE-STATUS-v1.43.2-STAGE-G-M44-MANAGEMENT-AUTHORITY-CONSOLIDATION.md');
const readme=read('README.md');
const doc=read('M44-MANAGEMENT-AUTHORITY-CONSOLIDATION.md');
const pkg=JSON.parse(read('package.json'));
const arch=Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1]||0);
const state=target.match(/activationState:\s*'([^']+)'/)?.[1]||'unknown';
const m43State=m43.match(/activationState:\s*'([^']+)'/)?.[1]||'unknown';
const retired=[
  'assets/js/features/account/index.ts',
  'assets/js/features/settings/index.ts',
  'assets/js/features/user-management/index.ts',
];

check(arch>=52,'Architecture 52+ preserves M44 Management authority consolidation');
check(m43State==='active-certified','M43 active-certified prerequisite');
check(target.includes('milestone: 44')&&target.includes("stage: 'G'")&&target.includes('architectureVersion: 52'),'M44 target identity');
check(['implementation-complete-pending-certification','active-certified'].includes(state),'M44 activation state is recognized');
check(target.includes("featureOwner: 'management'")&&target.includes("managementUi: 'src/app/management/AuthenticatedManagementUI.tsx'")&&target.includes("managementRuntime: 'src/app/management/authenticated-management-ui-runtime.ts'"),'M44 target declares one management authority');
check(target.includes('The M41 Account service, M42 protected Users/RBAC backend authority, and M43 Settings evidence helper remain domain/service authorities'),'M44 target distinguishes retained services from presentation ownership');
check(target.includes('M26 same-origin iframe compatibility')&&target.includes('M54 remains responsible for final production-readiness certification'),'M44 target preserves known boundaries');

check(manifest.includes("authenticatedManagementUiOwnership: 'react-management-v1'"),'manifest declares consolidated React management ownership');
check(manifest.includes("managementAuthorityConsolidation: 'single-react-management-runtime-v1'"),'manifest declares M44 authority consolidation');
check(manifest.includes("managementAuthorityFeature: 'management'"),'manifest declares one management feature owner');
check(manifest.includes("managementAuthorityUi: 'src/app/management/AuthenticatedManagementUI.tsx'"),'manifest declares one management UI');
check(manifest.includes("managementAuthorityRuntime: 'src/app/management/authenticated-management-ui-runtime.ts'"),'manifest declares one management runtime');
check(manifest.includes("managementLegacyControllers: 'retired-not-shipped-v1'"),'manifest records retired legacy controllers');
for(const route of ['account','settings','users']) check(new RegExp(`\\{ id: '${route}', pattern: '#/${route}', owner: 'management' \\}`).test(manifest),`route ${route} has management owner`);
check((manifest.match(/\{ id: 'management', state: 'active'/g)||[]).length===1,'manifest declares exactly one active management feature');
for(const legacy of ["{ id: 'account', state: 'active'","{ id: 'settings', state: 'active'","{ id: 'user-management', state: 'active'"]) check(!manifest.includes(legacy),`manifest does not declare legacy feature ${legacy}`);
check(types.includes("| 'management'")&&!types.includes("| 'user-management'"),'FeatureId contract exposes management and retires legacy user-management feature id');
check(types.includes("authenticatedManagementUiOwnership?: 'react-account-settings-user-management-v1' | 'react-management-v1'"),'type contract preserves historical ownership and models M44 ownership');
check(schema.includes("authenticatedManagementUiOwnership: z.enum(['react-account-settings-user-management-v1', 'react-management-v1']).optional()"),'runtime schema models historical and M44 management ownership');
check(schema.includes('manifest.architectureVersion >= 23 && manifest.architectureVersion < 52')&&schema.includes("authenticatedManagementUiOwnership !== 'react-management-v1'"),'runtime schema branches historical and consolidated management ownership by architecture');
check(schema.includes("managementAuthorityConsolidation !== 'single-react-management-runtime-v1'")&&schema.includes("managementLegacyControllers !== 'retired-not-shipped-v1'"),'runtime schema enforces M44 authority contract');

check((app.match(/featureRegistry\.register\('management', authenticatedManagementUiRuntime/g)||[]).length===1,'app registers management runtime exactly once');
for(const id of ['account','settings','user-management']) check(!app.includes(`featureRegistry.register('${id}', authenticatedManagementUiRuntime`),`app has no duplicate ${id} management runtime registration`);
check(app.includes("const managementOwned = owner === 'management';"),'persistent shell uses one management owner');
check(app.includes("management: '[data-wm-authenticated-management-ui-host] #main'")&&!app.includes("'user-management': '[data-wm-authenticated-management-ui-host] #main'"),'route-focus authority is keyed by consolidated management owner');
check(app.includes("views: Object.freeze(['account', 'settings', 'users'])"),'single management registration explicitly records its three views');
check(managementUi.includes("const owner = 'management' as const")&&managementUi.includes('presentationReadinessRuntime.acknowledge(owner, main)'),'React management UI acknowledges one readiness owner');
check(managementUi.includes('data-wm-composition-owner="react-management"'),'React management UI publishes consolidated composition ownership');
for(const view of ['account','settings','users']) check(managementUi.includes(`data-wm-management-view="${view}"`),`React management UI retains ${view} view`);
check(managementRuntime.includes("show(view: Exclude<AuthenticatedManagementUIView, 'hidden'>)")&&managementRuntime.includes("view: 'hidden'"),'single management runtime retains explicit view switching without duplicate route controllers');
check(managementRuntime.includes("createAccountService")&&managementRuntime.includes("assets/js/features/account/account-service.ts"),'Account operations delegate to retained account domain service');
check(managementRuntime.includes('SETTINGS_EVIDENCE_VERSION')&&managementRuntime.includes('settings/settings-recovery.ts'),'Settings evidence delegates to retained M43 helper');
check(managementUi.includes('useQuery({')&&managementUi.includes('queryFn: () => auth.listUsers()'),'Users directory remains TanStack Query backed');
check(managementRuntime.includes('return await auth.updateUserAccess(input);'),'Users role/status mutation delegates to core auth/backend authority');
check(routePolicy.includes("context.route.name==='users'&&!context.canManageUsers")&&routePolicy.includes("kind:'render-forbidden'"),'Users route authorization remains centrally enforced');

for(const file of retired) check(!fs.existsSync(file),`${file} is physically retired from shipped source`);
for(const token of ['createAccountFeature','createSettingsFeature','createUserManagementFeature']) check(!runtimeGateway.includes(token),`runtime gateway does not export ${token}`);
for(const file of retired) check(!runtimeAssets.includes(file),`runtime asset manifest does not cache ${file}`);
for(const file of retired) check(!projectVerifier.includes(file),`aggregate project verifier does not require ${file}`);

const managementDebt=m37Inventory.entries.find((entry)=>entry.id==='M37-TECHDEBT-001');
check(managementDebt?.status==='resolved-m44','M37 duplicate-management technical debt is explicitly resolved by M44');
check(JSON.stringify(managementDebt).includes('M44')&&JSON.stringify(managementDebt).includes('AuthenticatedManagementUI.tsx'),'M37 debt resolution retains M44 evidence');
check(m37Execution.includes("managementDebt?.status === 'resolved-m44'")&&m37Execution.includes("authenticatedManagementUiOwnership: 'react-management-v1'"),'M37 execution verifier recognizes M44 resolution');
check(m13Verifier.includes('architectureVersion >= 52')&&m13Verifier.includes("authenticatedManagementUiOwnership: 'react-management-v1'"),'M13 historical verifier recognizes M44 consolidated ownership');
check(m13Doc.includes('Temporary compatibility boundaries')&&m13Doc.includes('Password')&&m13Doc.includes('no Supabase migration'),'M44 preserves the M13 historical state-security and compatibility documentation contract');
check(m13Verifier.includes("featureRegistry.register('management', authenticatedManagementUiRuntime")&&m13Verifier.includes('must not retain duplicate management registration'),'M13 historical verifier rejects duplicate M44 registrations');
check(m40Verifier.includes("owner === 'management'")||m40Verifier.includes("owner === 'management'"),'M40 static verifier recognizes consolidated management owner');
check(m40Execution.includes("['account','management']")&&m40Execution.includes("['settings','management']")&&m40Execution.includes("['users','management']"),'M40 deterministic lifecycle verifier uses one management owner');
check(m40Browser.includes("route:'account', owner:'management'")&&m40Browser.includes("route:'settings', owner:'management'")&&m40Browser.includes("route:'users', owner:'management'"),'M40 browser characterization recognizes management ownership');
check(securityVerifier.includes('authenticated-management-ui-runtime.ts')&&!securityVerifier.includes("read('assets/js/features/account/index.ts')"),'security verifier points to current management runtime');
check(reconciliationVerifier.includes('AuthenticatedManagementUI.tsx')&&!reconciliationVerifier.includes("read('assets/js/features/account/index.ts')"),'implementation reconciliation points to current React management UI');
check(uiTsVerifier.includes('AuthenticatedManagementUI.tsx')&&uiTsVerifier.includes('authenticated-management-ui-runtime.ts'),'UI TypeScript verifier protects current management authority');
check(m43Verifier.includes("check(arch>=51"),'M43 Settings historical verifier accepts Architecture 52+');

check(deterministic.includes('checks=${checks}')&&deterministic.includes("registry.register('management'")&&deterministic.includes("registry.has('user-management')"),'M44 deterministic verifier covers single registration and legacy absence');
for(const tag of ['@m44-single-authority','@m44-users-authorization']) check(browser.includes(tag),`M44 browser scenario ${tag}`);
check(browser.includes("for (let cycle = 0; cycle < 3; cycle += 1)")&&browser.includes("['settings','users','account']"),'M44 browser suite exercises repeated same-owner route cycles');
check(browser.includes('data.m44HostToken')||browser.includes('m44HostToken'),'M44 browser suite asserts persistent React management host identity');
check(browser.includes("lifecycle?.owner === 'shell'")&&browser.includes('Administrator access required'),'M44 browser suite verifies Users authorization cannot be bypassed');
check(browserRunner.includes('management-authority-consolidation.spec.mjs')&&browserRunner.includes('scenarios=2'),'M44 browser runner is dedicated and reports two scenarios');

for(const script of ['management-authority:check','management-authority:test','management-authority:browser','management-authority:status','management-authority:verify:release','management-authority:certify','management-authority:package']) check(Boolean(pkg.scripts?.[script]),`package script ${script}`);
check(pkg.scripts.check.includes('management-authority:check')&&pkg.scripts.check.includes('management-authority:test'),'aggregate check includes M44 static and deterministic gates');
check(pkg.scripts['release:check'].includes('management-authority:browser'),'aggregate release check includes M44 browser gate');
check(releaseVerifier.includes('management-authority:browser')&&releaseVerifier.includes('route-lifecycle:browser')&&releaseVerifier.includes('account-recovery:browser')&&releaseVerifier.includes('users-rbac-recovery:browser')&&releaseVerifier.includes('settings-recovery:browser'),'M44 release verifier covers M44 and M40-M43 management/browser regressions');
check(releaseVerifier.includes('npm run verify')&&releaseVerifier.includes('npm run build'),'M44 release verifier includes full historical verification and production build');
check(finalizer.includes('M44_SOURCE_COMMIT')&&finalizer.includes('M43 active-certified prerequisite is not satisfied'),'M44 finalizer binds exact source commit and M43 prerequisite');
check(finalizer.includes('npm run management-authority:check')&&finalizer.includes('npm run management-authority:test')&&finalizer.includes('npm run management-authority:browser'),'M44 finalizer owns dedicated static/deterministic/browser gates');
check(finalizer.includes('npm run route-lifecycle:browser')&&finalizer.includes('npm run account-recovery:browser')&&finalizer.includes('npm run users-rbac-recovery:browser')&&finalizer.includes('npm run settings-recovery:browser'),'M44 finalizer retains M40-M43 browser regression gates');
check(finalizer.includes('bash verify-project.sh')&&finalizer.includes('"$ROOT/node_modules/.bin/vite" build'),'M44 finalizer verifies historical suite/build against active-certified staged candidate');
check(finalizer.includes('SOURCE_AFTER_PRE_GATES')&&finalizer.includes('POST_STATE_DIGEST')&&finalizer.includes('SOURCE_AFTER_HISTORY'),'M44 finalizer binds source stability before and after state promotion');
check(finalizer.includes('TARGET_SHA_BEFORE')&&finalizer.includes('STATUS_SHA_BEFORE')&&finalizer.includes('source target record changed during pre-certification gates')&&finalizer.includes('source release-status record changed during active-candidate post-state gates'),'M44 finalizer byte-binds excluded mutable certification-state records across all gates');
check(certificationTree.includes("'config/stage-g-m44-management-authority-consolidation-target.ts'")&&certificationTree.includes("'RELEASE-STATUS-v1.43.2-STAGE-G-M44-MANAGEMENT-AUTHORITY-CONSOLIDATION.md'")&&certificationTree.includes("'CHECKSUMS.sha256'"),'M44 certification tree excludes only mutable certification/checksum records plus generated boundaries');
check(artifactVerifier.includes('computeM44CertificationTreeDigest')&&artifactVerifier.includes('M44_EXPECTED_SOURCE_COMMIT')&&artifactVerifier.includes("sha256sum',['-c','CHECKSUMS.sha256']"),'M44 artifact verifier binds source commit/tree/ZIP/checksum manifest');
check(workflow.includes('npm run management-authority:verify:release')&&workflow.includes("github.event_name == 'pull_request'"),'M44 PR workflow executes non-publishing release verification');
check(workflow.includes('npm run management-authority:certify')&&workflow.includes('M44_SOURCE_COMMIT: ${{ github.sha }}'),'M44 push workflow certifies exact GitHub SHA');
check(workflow.includes('m44-certified-artifacts-upload')&&workflow.includes('if-no-files-found: error'),'M44 hosted artifact publication is repository-local and fail closed');

check(projectVerifier.includes('stage-g-m44-management-authority-consolidation-target.ts')&&projectVerifier.includes('verify-stage-g-m44-management-authority-consolidation.mjs'),'aggregate project verifier protects M44 structural assets');
check(doc.includes('one lifecycle/feature owner: `management`')&&doc.includes('Retired implementations'),'M44 implementation document records consolidated authority and retired implementations');
check(release.includes(`**State:** ${state}`),'M44 release status matches target activation state');
check(release.includes('M26 iframe compatibility')&&release.includes('M54'),'M44 release status records retained boundaries');
check(!/[ \t]+$/m.test(release)&&!/[ \t]+$/m.test(readme),'M44 publication documents contain no trailing whitespace');
check(!projectVerifier.endsWith('\n\n'),'aggregate project verifier has canonical single-newline EOF');
check(!fs.existsSync('supabase/migrations/v1.43.2-stage-g-m44-management-authority-consolidation.sql'),'M44 introduces no unnecessary database migration');

console.log(`Stage G M44 Management Authority Consolidation static verification: PASS (state=${state}; architecture=${arch}; checks=${checks}; browserScenarios=2)`);
