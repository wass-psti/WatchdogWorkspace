import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const pkg = JSON.parse(read('package.json'));
const target = read('config/stage-c-m13-account-settings-user-management-target.ts');
const m12Target = read('config/stage-c-m12-authentication-ui-target.ts');
const manifest = read('config/application-manifest.ts');
const manifestTypes = read('src/types/manifest.ts');
const manifestSchema = read('src/runtime-schemas/manifest.ts');
const managementUi = read('src/app/management/AuthenticatedManagementUI.tsx');
const managementRuntime = read('src/app/management/authenticated-management-ui-runtime.ts');
const managementHook = read('src/app/management/useAuthenticatedManagementUiRuntime.ts');
const shell = read('src/app/shell/WorkManagementShell.tsx');
const app = read('assets/js/app.ts');
const authCore = read('assets/js/core/auth.ts');
const settingsCore = read('assets/js/core/platform.ts');
const backupCore = read('assets/js/core/backup.ts');
const runtimeGateway = read('assets/js/runtime/index.ts');
const viteSmoke = read('scripts/verify-vite-server.mjs');
const browserGlobals = read('tests/browser/runtime-globals-entry.ts');
const browserHarness = read('tests/browser/run-cdp.mjs');
const projectVerifier = read('verify-project.sh');
const activation = read('scripts/activate-stage-c-m13.mjs');
const stageCCertify = read('scripts/certify-stage-c-platform.mjs');
const certificationEntry = read('scripts/certify-stage-c-m13.sh');
const architectureDoc = read('docs/architecture/ARCHITECTURE.md');
const milestoneDoc = read('docs/WORK-MANAGEMENT-ACCOUNT-SETTINGS-USER-MANAGEMENT.md');
const releaseStatus = read('RELEASE-STATUS-v1.43.2-STAGE-C-M13-ACCOUNT-SETTINGS-USER-MANAGEMENT.md');
const runbook = read('M13-ACTIVATION-RUNBOOK.md');
const loaderHotfix = read('M13-CERTIFICATION-TYPESCRIPT-LOADER-HOTFIX.md');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const m12State = m12Target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const targetArchitecture = Number(target.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);

assert(['blocked-pending-m12-certification','implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Unsupported M13 state: ${state}`);
assert(m12State === 'active-certified', `M13 package must inherit active-certified M12; found ${m12State}`);
assert(targetArchitecture === 23, `M13 target must declare Architecture Version 23; found ${targetArchitecture}.`);
assert(architectureVersion >= 23, `M13 package must preserve Architecture Version 23 or later; found ${architectureVersion}.`);

for (const marker of [
  "authenticatedManagementUi: 'src/app/management/AuthenticatedManagementUI.tsx'",
  "authenticatedManagementUiRuntime: 'src/app/management/authenticated-management-ui-runtime.ts'",
  architectureVersion >= 52 ? "authenticatedManagementUiOwnership: 'react-management-v1'" : "authenticatedManagementUiOwnership: 'react-account-settings-user-management-v1'",
]) assert(manifest.includes(marker), `Application manifest missing M13/M44 authority: ${marker}`);
if (architectureVersion >= 52) {
  assert(manifest.includes("{ id: 'management', state: 'active', boundary: 'src/app/management/AuthenticatedManagementUI.tsx'"), 'M44 consolidated management manifest boundary missing.');
  for (const route of ['account','settings','users']) assert(manifest.includes(`{ id: '${route}', pattern:`) && manifest.includes(`owner: 'management'`), `M44 consolidated route ownership missing for ${route}.`);
} else {
  for (const feature of ['account','settings','user-management']) assert(manifest.includes(`{ id: '${feature}', state: 'active', boundary: 'src/app/management/AuthenticatedManagementUI.tsx'`), `M13 manifest boundary missing for ${feature}.`);
}
for (const marker of ['authenticatedManagementUi?: string','authenticatedManagementUiRuntime?: string',"authenticatedManagementUiOwnership?: 'react-account-settings-user-management-v1' | 'react-management-v1'"]) assert(manifestTypes.includes(marker), `Manifest type contract missing ${marker}`);
assert(manifestSchema.includes("authenticatedManagementUiOwnership: z.enum(['react-account-settings-user-management-v1', 'react-management-v1']).optional()"), 'Manifest runtime schema must model historical and consolidated management ownership.');
assert(manifestSchema.includes('manifest.architectureVersion >= 23') && manifestSchema.includes('manifest.architectureVersion < 52') && manifestSchema.includes("authenticatedManagementUiOwnership !== 'react-management-v1'"), 'Manifest runtime schema must preserve M13 history while enforcing the M44 consolidated ownership contract.');

for (const marker of [
  'data-wm-authenticated-management-ui-host',
  architectureVersion >= 52 ? 'data-wm-composition-owner="react-management"' : 'data-wm-composition-owner="react-account-settings-user-management"',
  'data-wm-management-view="account"',
  'data-wm-management-view="settings"',
  'data-wm-management-view="users"',
  'data-wm-management-form="profile"',
  'data-wm-management-form="password"',
  'data-wm-management-form="user-access"',
  'useQuery({',
  'USER_DIRECTORY_QUERY_KEY',
  'auth.listUsers()',
  'queryClient.setQueryData',
  'directory.refetch()',
]) assert(managementUi.includes(marker), `React management UI missing ${marker}`);
assert(managementUi.includes('new FormData(event.currentTarget)') || managementUi.includes('new FormData(form)'), 'M13 account/security forms must read values at the form boundary.');
assert(!managementUi.includes('localStorage.setItem') && !managementUi.includes('sessionStorage.setItem'), 'M13 React management UI must not directly persist account/security values.');

for (const marker of [
  'accountBusy','settingsBusy','storageHealth','diagnostics','compatibility','authRevision','preferenceRevision','saveProfile','changePassword','signOut','refreshAccess','setTheme','runSettingAction','restoreBackup','updateUserAccess','AUTH_EVENT',
]) assert(managementRuntime.includes(marker), `M13 management runtime missing ${marker}`);
const managementSnapshotContract = managementRuntime.match(/export interface AuthenticatedManagementUIRuntimeSnapshot \{[\s\S]*?\n\}/)?.[0] || '';
assert(managementSnapshotContract && !/password|confirmPassword/i.test(managementSnapshotContract), 'M13 shared management runtime snapshot must not model password values.');
assert(managementRuntime.includes('changePassword(password: string, confirmPassword: string)'), 'Password values may cross only the explicit action-method boundary and must remain absent from shared snapshots.');
assert(!/readonly\s+directory\b|directory:\s*readonly/.test(managementRuntime), 'M13 management runtime must not become a second user-directory server-state store.');
assert(managementRuntime.includes("from '../../../assets/js/core/platform.ts'") && managementRuntime.includes("from '../../../assets/js/core/backup.ts'"), 'M13 runtime must delegate Settings/backup behavior to existing authorities.');
assert(managementHook.includes('useSyncExternalStore') && managementHook.includes('authenticatedManagementUiRuntime.subscribe'), 'M13 React UI must subscribe through the external-store bridge.');

assert(shell.includes("import { AuthenticatedManagementUI }"), 'React shell must import the M13 management UI.');
assert(shell.includes("const managementActive = managementView !== 'hidden'"), 'React shell must derive M13 route ownership.');
assert(shell.includes('{managementActive ? <AuthenticatedManagementUI /> : null}'), 'React shell must render M13 management UI when active.');
assert(shell.includes('inert={mobileOpen || authenticationActive || managementActive') && shell.includes('hidden={authenticationActive || managementActive') && shell.includes('boardPresentationActive'), 'React shell must keep the legacy host inert/hidden on M13 routes while allowing later React route owners to extend the exclusion boundary.');

assert(app.includes("import { authenticatedManagementUiRuntime"), 'Application runtime must import the M13 route/UI bridge.');
assert(app.includes('function showAuthenticatedManagement('), 'Application runtime must expose one M13 authenticated management-route bridge.');
for (const route of ['account','settings','users']) {
  const directDelegation = `${route}: () => showAuthenticatedManagement('${route}')`;
  const gatedDelegation = `${route}: () => gateBackendCapability('${route}', '${route}', () => showAuthenticatedManagement('${route}'))`;
  if (architectureVersion >= 48) {
    assert(app.includes(directDelegation), `Application route table must delegate ${route} directly after the M40 precommit capability resolver selects M13 ownership.`);
    assert(app.includes('resolveBackendCapabilityPresentation') && app.includes('backendCapabilityRequirement(route)'), `Architecture 48+ must preserve the M38 backend-capability gate through the M40 precommit capability resolver for ${route}.`);
    assert(!app.includes(gatedDelegation), `Architecture 48+ must not re-check backend capability inside the ${route} renderer after lifecycle ownership is chosen.`);
  } else if (architectureVersion >= 46) {
    assert(app.includes(gatedDelegation), `Application route table must preserve M13 React management ownership for ${route} behind the M38 backend-capability gate.`);
    assert(!app.includes(directDelegation), `Architecture 46+ must not bypass the M38 backend-capability gate for ${route}.`);
  } else {
    assert(app.includes(directDelegation), `Application route table must delegate ${route} to M13 React management UI.`);
  }
}
if (architectureVersion >= 52) {
  assert(app.includes("featureRegistry.register('management', authenticatedManagementUiRuntime"), 'Runtime registry must expose exactly one M44 management authority.');
  for (const id of ['account','settings','user-management']) assert(!app.includes(`featureRegistry.register('${id}', authenticatedManagementUiRuntime`), `M44 must not retain duplicate management registration ${id}.`);
} else {
  for (const id of ['account','settings','user-management']) assert(app.includes(`featureRegistry.register('${id}', authenticatedManagementUiRuntime`), `Runtime registry must expose the M13 authority for ${id}.`);
}
for (const forbidden of ['createAccountFeature','createSettingsFeature','createUserManagementFeature','accountFeature.handleAction','settingsFeature.handleAction','userManagementFeature.handleAction','accountFeature.handleSubmit','userManagementFeature.handleSubmit','userManagementFeature.handleInput']) assert(!app.includes(forbidden), `Application runtime still contains retired imperative management wiring: ${forbidden}`);
assert(app.includes('authenticatedManagementUiRuntime.hide();') && app.includes("publishReactShell(view, 'page', true)"), 'M13 route bridge must enforce mutual exclusion with legacy content while preserving React shell ownership.');
assert(app.includes('const ROUTE_FOCUS_SELECTORS') && app.includes('const resolveShellRouteContentTarget = (owner: string | null = null)') && app.includes("[data-wm-authenticated-management-ui-host] #main") && app.includes("[data-wm-runtime-host] #main"), 'Shell focus/motion targeting must resolve both React-owned M13 routes and the M10 runtime route-content island.');
assert(app.includes('const main = resolveShellRouteContentTarget(owner);'), 'Shell skip-link and route-focus restoration must target the active owner-specific React-or-runtime route content rather than the legacy host only.');
assert(app.includes(": resolveShellRouteContentTarget();"), 'Route entrance motion must target the active React-owned M13 content when the legacy workspace is hidden.');
assert(app.includes("if (routeChanged) queueEntranceMotion('page');"), 'M13 route changes must retain route-scoped entrance motion after React ownership transfer.');
assert(runtimeGateway.includes('authenticatedManagementUiRuntime'), 'Runtime gateway must expose the M13 authenticated management authority.');

for (const preserved of ['async updateProfile','async updatePassword','async signOut','async reloadAccessContext','async listUsers()','async updateUserAccess','hasBootstrapRoleMismatch']) assert(authCore.includes(preserved), `M13 must preserve Auth/RPC behavior: ${preserved}`);
for (const preserved of ['getPreferences','savePreferences','getStorageHealth','requestPersistentStorage','runPlatformDiagnostics','verifyModuleCompatibility']) assert(settingsCore.includes(preserved), `M13 must preserve platform Settings behavior: ${preserved}`);
for (const preserved of ['downloadWorkspaceBackup','parseBackupFile','restoreWorkspaceBackup','wm_restore_workspace_backup_v4']) assert(backupCore.includes(preserved), `M13 must preserve backup behavior: ${preserved}`);

assert(viteSmoke.includes('Stage C M13 browser exclusivity contract'), 'Vite dev/preview smoke must execute the M13 ownership exclusivity contract.');
for (const expression of [
  "countElementsWithAttribute(dom, 'data-wm-authenticated-management-ui-host')",
  architectureVersion >= 52 ? "countElementsWithAttribute(dom, 'data-wm-composition-owner', 'react-management')" : "countElementsWithAttribute(dom, 'data-wm-composition-owner', 'react-account-settings-user-management')",
]) assert(viteSmoke.includes(expression), `M13 browser smoke missing ownership assertion: ${expression}`);
assert(browserGlobals.includes('authenticatedManagementUiRuntime') && browserGlobals.includes('src/app/management/authenticated-management-ui-runtime.ts'), 'Browser runtime bundle must expose the M13 management runtime.');
for (const marker of [
  'Stage C M13 authenticated management UI runtime authority',
  'M13 runtime publishes Account route ownership',
  'M13 runtime publishes Settings route ownership',
  'M13 runtime publishes Users route ownership',
  'M13 runtime does not retain password-shaped shared state',
  'M13 runtime releases management ownership when route deactivates',
]) assert(browserHarness.includes(marker), `Chromium integration suite missing M13 assertion: ${marker}`);

assert(architectureDoc.includes('Architecture Version 23') && architectureDoc.includes('AuthenticatedManagementUI.tsx') && architectureDoc.includes('TanStack Query'), 'Architecture documentation must describe M13 and its server-state authority.');
assert(architectureDoc.includes('Architecture Version 22') && architectureDoc.includes('AuthenticationUI.tsx'), 'M13 architecture documentation must preserve the M12 historical ownership statement.');
assert(milestoneDoc.includes('Temporary compatibility boundaries') && milestoneDoc.includes('Password') && milestoneDoc.includes('no Supabase migration'), 'M13 documentation must disclose state security and compatibility boundaries.');
assert(releaseStatus.includes('implementation-complete-pending-certification') && releaseStatus.includes('Architecture Version:** 23'), 'M13 release status must ship pending certification at Architecture Version 23.');
assert(runbook.includes('bash scripts/certify-stage-c-m13.sh') && runbook.includes('Do **not** begin M13 certification with a raw ambient `npm ci`'), 'M13 activation runbook must use the governed shell-level entrypoint.');
assert(runbook.includes('TypeScript loader hotfix') && runbook.includes('--experimental-strip-types'), 'M13 runbook must document the governed TypeScript verifier loader contract.');
assert(loaderHotfix.includes('ERR_UNKNOWN_FILE_EXTENSION') && loaderHotfix.includes('verify-settings.mjs') && loaderHotfix.includes('--experimental-strip-types'), 'M13 certification loader hotfix record must capture the exact failure class and correction.');

assert(fs.statSync(path.join(root, 'scripts/certify-stage-c-m13.sh')).mode & 0o100, 'M13 governed certification entrypoint must be executable.');
assert(certificationEntry.includes('scripts/run-governed-toolchain.sh'), 'M13 certification must enter the governed toolchain before npm execution.');
assert(certificationEntry.indexOf('scripts/run-governed-toolchain.sh') < certificationEntry.indexOf('npm ci'), 'M13 certification must dispatch the governed toolchain before dependency installation.');
for (const gate of ['npm ci','npm run react-shell:check','npm run global-overlays:check','npm run authentication-ui:check','npm run account-settings-users:check','node --experimental-strip-types --disable-warning=ExperimentalWarning verify-account-architecture.mjs','node --experimental-strip-types --disable-warning=ExperimentalWarning verify-settings.mjs','node --experimental-strip-types --disable-warning=ExperimentalWarning verify-rbac-user-management.mjs','npm run typecheck','npm run verify:ui','npm run verify:dev','npm run build','npm run verify:dist','npm run verify:preview','npm run stage-c:certify','npm run account-settings-users:status']) assert(certificationEntry.includes(gate), `M13 governed certification entrypoint missing ${gate}.`);
assert(!/\n\s*node verify-(?:account-architecture|settings|rbac-user-management)\.mjs/.test(certificationEntry), 'M13 certification must not launch TypeScript-dependent regression verifiers with raw Node.');

const governedBootstrap = spawnSync('bash', ['scripts/certify-stage-c-m13.sh', '--toolchain-check'], { cwd: root, encoding: 'utf8' });
if (governedBootstrap.stdout) process.stdout.write(governedBootstrap.stdout);
if (governedBootstrap.stderr) process.stderr.write(governedBootstrap.stderr);
assert(governedBootstrap.status === 0, 'M13 governed certification toolchain check failed.');
assert(governedBootstrap.stdout.includes('M13 governed certification toolchain: v22.16.0 / npm 10.9.2'), 'M13 certification entrypoint must execute under Node v22.16.0/npm 10.9.2.');

for (const scriptName of ['check','release:check']) {
  const script = pkg.scripts?.[scriptName] ?? '';
  const m10 = script.indexOf('npm run react-shell:check');
  const m11 = script.indexOf('npm run global-overlays:check');
  const m12 = script.indexOf('npm run authentication-ui:check');
  const m13 = script.indexOf('npm run account-settings-users:check');
  const type = script.indexOf('npm run typecheck');
  assert(m10 >= 0 && m11 > m10 && m12 > m11 && m13 > m12 && type > m13, `${scriptName} must preserve M10 -> M11 -> M12 -> M13 -> typecheck ordering.`);
}
assert(pkg.scripts?.['account-settings-users:check'] === 'bash scripts/run-governed-toolchain.sh npm run account-settings-users:check:governed', 'M13 check must use governed toolchain dispatch.');
assert(pkg.scripts?.['account-settings-users:check:governed'] === 'npm run dependencies:ensure:governed && node verify-stage-c-m13-account-settings-user-management.mjs', 'M13 governed check must execute the milestone verifier.');
for (const gate of ['governance:restore','dependencies:ensure','governance:check','security:check','react:check','design-system:check','interactions:check','runtime-schemas:check','supabase-client:check','tanstack-query:check','client-state:check','react-shell:check','global-overlays:check','authentication-ui:check','account-settings-users:check','lint:eslint','typecheck']) assert(activation.includes(`'${gate}'`), `M13 activation must execute ${gate}.`);
assert(stageCCertify.includes('account-settings-users:activate:release'), 'Stage C certification must promote M13.');
assert(stageCCertify.includes('M13 Account / Settings / User Management: active-certified'), 'Stage C certification summary must include M13.');
for (const workflow of ['.github/workflows/ci.yml','.github/workflows/deploy-pages.yml','governance-artifacts/github/workflows/ci.yml','governance-artifacts/github/workflows/deploy-pages.yml']) assert(read(workflow).includes('npm run account-settings-users:check'), `${workflow} must execute the M13 management gate.`);
for (const file of ['src/app/management/AuthenticatedManagementUI.tsx','src/app/management/authenticated-management-ui-runtime.ts','src/app/management/useAuthenticatedManagementUiRuntime.ts','config/stage-c-m13-account-settings-user-management-target.ts','verify-stage-c-m13-account-settings-user-management.mjs','scripts/verify-authenticated-management-ui-execution.mjs','scripts/report-stage-c-m13.mjs','scripts/activate-stage-c-m13.mjs','scripts/certify-stage-c-m13.sh','docs/WORK-MANAGEMENT-ACCOUNT-SETTINGS-USER-MANAGEMENT.md','M13-ACTIVATION-RUNBOOK.md','M13-CERTIFICATION-TYPESCRIPT-LOADER-HOTFIX.md','RELEASE-STATUS-v1.43.2-STAGE-C-M13-ACCOUNT-SETTINGS-USER-MANAGEMENT.md']) assert(projectVerifier.includes(file), `Aggregate verifier must require ${file}.`);
assert(!fs.readdirSync(path.join(root, 'supabase/migrations')).some((name) => /m13|account-settings|user-management-ui/i.test(name)), 'M13 architecture-only work must not introduce a Supabase migration.');

const execution = spawnSync(process.execPath, ['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-authenticated-management-ui-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M13 authenticated management UI execution vectors failed.');
console.log(`Stage C Milestone 13 Account / Settings / User Management verification: PASS (state=${state}; architecture=${architectureVersion})`);
