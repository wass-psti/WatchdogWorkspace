import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const pkg = JSON.parse(read('package.json'));
const target = read('config/stage-c-m12-authentication-ui-target.ts');
const m11Target = read('config/stage-c-m11-global-overlays-target.ts');
const manifest = read('config/application-manifest.ts');
const manifestTypes = read('src/types/manifest.ts');
const manifestSchema = read('src/runtime-schemas/manifest.ts');
const authUi = read('src/app/auth/AuthenticationUI.tsx');
const authRuntime = read('src/app/auth/authentication-ui-runtime.ts');
const authHook = read('src/app/auth/useAuthenticationUiRuntime.ts');
const authCore = read('assets/js/core/auth.ts');
const authFacade = read('assets/js/features/auth/index.ts');
const shell = read('src/app/shell/WorkManagementShell.tsx');
const legacyBoundary = read('src/app/composition/RuntimeApplicationBoundary.tsx');
const app = read('assets/js/app.ts');
const runtimeGateway = read('assets/js/runtime/index.ts');
const css = read('assets/css/app.css');
const viteSmoke = read('scripts/verify-vite-server.mjs');
const viteBrowserDriver = read('scripts/lib/browser-cdp-smoke.mjs');
const viteBrowserDriverExecution = read('scripts/verify-vite-browser-cdp-execution.mjs');
const browserGlobals = read('tests/browser/runtime-globals-entry.ts');
const browserHarness = read('tests/browser/run-cdp.mjs');
const projectVerifier = read('verify-project.sh');
const activation = read('scripts/activate-stage-c-m12.mjs');
const stageCCertify = read('scripts/certify-stage-c-platform.mjs');
const certificationEntry = read('scripts/certify-stage-c-m12.sh');
const architectureDoc = read('docs/architecture/ARCHITECTURE.md');
const milestoneDoc = read('docs/WORK-MANAGEMENT-AUTHENTICATION-UI.md');
const releaseStatus = read('RELEASE-STATUS-v1.43.2-STAGE-C-M12-AUTHENTICATION-UI.md');
const runbook = read('M12-ACTIVATION-RUNBOOK.md');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const m11State = m11Target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const targetArchitecture = Number(target.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);

assert(['blocked-pending-m11-certification','implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Unsupported M12 state: ${state}`);
assert(m11State === 'active-certified', `M12 package must inherit active-certified M11; found ${m11State}`);
assert(targetArchitecture === 22, `M12 target must declare Architecture Version 22; found ${targetArchitecture}.`);
assert(architectureVersion >= 22, `M12 package must preserve Architecture Version 22 or later; found ${architectureVersion}.`);

for (const marker of [
  "authenticationUi: 'src/app/auth/AuthenticationUI.tsx'",
  "authenticationUiRuntime: 'src/app/auth/authentication-ui-runtime.ts'",
  "authenticationUiOwnership: 'react-authentication-ui-v1'",
]) assert(manifest.includes(marker), `Application manifest missing M12 authority: ${marker}`);
assert(manifest.includes("{ id: 'auth', state: 'active', boundary: 'src/app/auth/AuthenticationUI.tsx'"), 'Auth feature manifest boundary must point to the React Authentication UI.');
for (const marker of ['authenticationUi?: string','authenticationUiRuntime?: string',"authenticationUiOwnership?: 'react-authentication-ui-v1'"]) assert(manifestTypes.includes(marker), `Manifest type contract missing ${marker}`);
assert(manifestSchema.includes("authenticationUiOwnership: z.literal('react-authentication-ui-v1').optional()"), 'Manifest runtime schema must model M12 authentication ownership.');
assert(manifestSchema.includes('manifest.architectureVersion >= 22') && manifestSchema.includes('React ownership of the Work Management authentication UI'), 'Manifest runtime schema must enforce Architecture v22 authentication ownership.');

for (const marker of [
  'data-wm-authentication-ui-host',
  'data-wm-composition-owner="react-authentication-ui"',
  'data-wm-authentication-ui-view',
  'data-wm-authentication-ui-form="login"',
  'data-wm-authentication-ui-form="register"',
  'data-wm-authentication-ui-form="verify-resend"',
  'data-confirm-verification',
  'data-resend-confirmation',
  "auth.signIn(email, password)",
  "auth.signUp({ email, password, displayName })",
  'auth.resendSignupConfirmation',
  'auth.confirmPendingCallback()',
  "auth.signOut({ scope: 'local' })",
]) assert(authUi.includes(marker), `React Authentication UI missing ${marker}`);
assert(authUi.includes('new FormData(event.currentTarget)'), 'Authentication credentials must be read from the submitting form boundary.');
assert(!authUi.includes('localStorage.setItem') && !authUi.includes('sessionStorage.setItem'), 'React Authentication UI must not persist credentials or form state directly.');

for (const marker of ['registrationDraft','pendingConfirmationEmail','needsConfirmation','callbackProcessing','authRevision','consumeReturnRoute','AUTH_EVENT','deactivate()']) assert(authRuntime.includes(marker), `Authentication UI runtime missing ${marker}`);
assert(!/readonly\s+password\b|readonly\s+confirmPassword\b|password:\s*string|confirmPassword:\s*string/.test(authRuntime), 'Authentication UI runtime must not model password values.');
assert(authRuntime.includes("RETURN_ROUTE_KEY = 'wm.platform.auth.return-to.v1'"), 'Authentication return-route compatibility key must remain stable.');
assert(authHook.includes('useSyncExternalStore') && authHook.includes('authenticationUiRuntime.subscribe'), 'React authentication UI must subscribe through the external-store bridge.');

assert(shell.includes("import { AuthenticationUI }"), 'React shell must import the M12 Authentication UI.');
assert(shell.includes("const authenticationActive = authenticationView !== 'hidden'"), 'React shell must derive authentication route ownership.');
assert(shell.includes('{authenticationActive ? <AuthenticationUI /> : null}'), 'React shell must render the Authentication UI when active.');
assert(shell.includes('inert={mobileOpen || authenticationActive') && shell.includes('hidden={authenticationActive') && shell.includes('managementActive'), 'React shell must keep the legacy host inert/hidden on authentication routes while allowing later React route owners to share the exclusion boundary.');
assert(legacyBoundary.includes('readonly hidden?: boolean') && legacyBoundary.includes('hidden={hidden}'), 'Runtime route-content boundary must support M12 hidden ownership mode.');
assert(css.includes('[data-wm-runtime-host][hidden]{display:none!important}'), 'M12 must explicitly prevent the hidden runtime route-content host from painting.');

assert(authFacade.includes("presentation: 'react-authentication-ui-v1'"), 'Legacy auth facade must advertise M12 React presentation ownership.');
assert(authFacade.includes("authority: 'assets/js/core/auth.ts'"), 'Legacy auth facade must preserve the core auth authority.');
for (const forbidden of ['createAuthenticationFeature','renderLogin','renderRegister','renderVerify','handleSubmit','handleInput','innerHTML','<form']) assert(!authFacade.includes(forbidden), `Legacy auth facade must not retain imperative UI authority: ${forbidden}`);
assert(runtimeGateway.includes('AUTH_FEATURE') && !runtimeGateway.includes('createAuthenticationFeature'), 'Runtime gateway must expose the non-rendering auth facade instead of the retired controller factory.');

assert(app.includes("import { authenticationUiRuntime"), 'Application runtime must import the M12 auth UI bridge.');
assert(app.includes("featureRegistry.register('auth', authenticationUiRuntime"), 'Application runtime must register the M12 authentication UI authority.');
assert(app.includes('function showStandaloneAuthentication('), 'Application runtime must expose one standalone authentication-route bridge.');
for (const view of ['login','register','verify','disabled']) assert(app.includes(`showStandaloneAuthentication('${view}')`), `Application route table must delegate ${view} to the React Authentication UI.`);
assert(app.includes("authenticationUiRuntime.showCallbackProgress()") && app.includes('authenticationUiRuntime.completeCallbackProgress()'), 'Bootstrap callback progress must be bridged into the React verification UI.');
assert(app.includes('authenticationUiRuntime.hide();') && app.indexOf('authenticationUiRuntime.hide();') < app.indexOf('reactShellRuntime.showShell({'), 'Authenticated shell publication must release standalone authentication UI ownership first.');
for (const forbidden of ['createAuthenticationFeature','authFeature.renderLogin','authFeature.renderRegister','authFeature.renderVerify','authFeature.handleAction','authFeature.handleSubmit','authFeature.handleInput']) assert(!app.includes(forbidden), `Application runtime still contains retired imperative auth wiring: ${forbidden}`);

for (const preserved of [
  '/auth/v1/token?grant_type=password',
  '/auth/v1/signup',
  '/auth/v1/resend?redirect_to=',
  '/auth/v1/verify',
  "query.get('token_hash')",
  "hash.get('access_token')",
  'REGISTRATION_GUARD_KEY',
  'SIGNUP_COOLDOWN_MS = 60_000',
  'RESEND_COOLDOWN_MS = 60_000',
  'loadCurrentUserWithRetry',
]) assert(authCore.includes(preserved), `M12 must preserve core Supabase Auth behavior: ${preserved}`);

assert(viteSmoke.includes('Stage C M12 browser ownership contract'), 'Vite dev/preview smoke must execute the M12 authentication ownership contract.');
for (const expression of [
  "countElementsWithAttribute(dom, 'data-wm-authentication-ui-host')",
  "countElementsWithAttribute(dom, 'data-wm-composition-owner', 'react-authentication-ui')",
  "countElementsWithAttribute(dom, 'data-wm-authentication-ui-view', 'login')",
  "countElementsWithAttribute(dom, 'data-wm-authentication-ui-form', 'login')",
  "attributePattern('data-wm-runtime-host').test(tag) && attributePattern('hidden').test(tag)",
]) assert(viteSmoke.includes(expression), `M12 browser smoke missing element-aware ownership assertion: ${expression}`);
for (const rawPattern of [
  "/data-wm-authentication-ui-host/.test(dom)",
  "/data-wm-authentication-ui-view=\"login\"/.test(dom)",
]) assert(!viteSmoke.includes(rawPattern), `M12 browser smoke must not regress to raw serialized-DOM marker scans: ${rawPattern}`);

assert(viteSmoke.includes("captureBrowserDom(browserBinary, `${base}/#/login`") && viteSmoke.includes("timeoutMs: 20_000"), 'M12 browser smoke must use the bounded CDP DOM driver for login ownership.');
assert(viteSmoke.includes("VITE_SUPABASE_URL: ''") && viteSmoke.includes("VITE_SUPABASE_PUBLISHABLE_KEY: ''"), 'M12 dev browser smoke must force deterministic anonymous public-client configuration.');
assert(!viteSmoke.includes("--dump-dom") && !viteSmoke.includes("--virtual-time-budget"), 'M12 browser smoke must not depend on unbounded Chromium dump-dom/virtual-time execution.');
for (const marker of [
  '--remote-debugging-port=',
  'Page.navigate',
  'Runtime.evaluate',
  "browser.kill('SIGTERM')",
  "browser.kill('SIGKILL')",
  "mkdtemp(join(tmpdir(), 'wm-vite-browser-'))",
  'Browser DOM smoke timed out after',
]) assert(viteBrowserDriver.includes(marker), `M12 bounded CDP browser driver missing ${marker}`);
for (const marker of ['data-ready=\"yes\"','timeoutMs: 1_200','bounded wall-clock timeout','Vite browser CDP execution vectors: PASS']) assert(viteBrowserDriverExecution.includes(marker), `M12 CDP execution vector missing ${marker}`);

assert(browserGlobals.includes("authenticationUiRuntime") && browserGlobals.includes("src/app/auth/authentication-ui-runtime.ts"), 'Browser runtime bundle must expose the M12 authentication UI runtime.');
for (const marker of [
  'Stage C M12 authentication UI runtime authority',
  'M12 authentication UI runtime publishes React route ownership',
  'M12 authentication UI runtime retains only safe registration draft fields',
  'M12 verification callback progress remains explicit in the React route runtime',
  'M12 disabled-account presentation is routed through the React authentication authority',
  'M12 authentication UI runtime releases ownership when auth route deactivates',
]) assert(browserHarness.includes(marker), `Chromium integration suite missing M12 assertion: ${marker}`);

assert(architectureDoc.includes('Architecture Version 22') && architectureDoc.includes('AuthenticationUI.tsx') && architectureDoc.includes('assets/js/core/auth.ts'), 'Architecture documentation must describe M12 and preserve the auth authority boundary.');
assert(architectureDoc.includes('Architecture Version 21') && architectureDoc.includes('GlobalOverlayHost.tsx'), 'M12 architecture documentation must preserve the M11 historical ownership statement.');
assert(milestoneDoc.includes('Temporary compatibility boundaries') && milestoneDoc.includes('Password') && milestoneDoc.includes('no Supabase migration'), 'M12 documentation must disclose state security and compatibility boundaries.');
assert(releaseStatus.includes('implementation-complete-pending-certification') && releaseStatus.includes('Architecture Version:** 22'), 'M12 release status must ship pending certification at Architecture Version 22.');
assert(runbook.includes('bash scripts/certify-stage-c-m12.sh') && runbook.includes('Do **not** begin M12 certification with a raw ambient `npm ci`'), 'M12 activation runbook must use the governed shell-level entrypoint.');

assert(fs.statSync(path.join(root, 'scripts/certify-stage-c-m12.sh')).mode & 0o100, 'M12 governed certification entrypoint must be executable.');
assert(certificationEntry.includes('scripts/run-governed-toolchain.sh'), 'M12 certification must enter the governed toolchain before npm execution.');
assert(certificationEntry.indexOf('scripts/run-governed-toolchain.sh') < certificationEntry.indexOf('npm ci'), 'M12 certification must dispatch the governed toolchain before dependency installation.');
for (const gate of ['npm ci','npm run react-shell:check','npm run global-overlays:check','npm run authentication-ui:check','node verify-auth-backend.mjs','node verify-auth-signin.mjs','node verify-v1174-auth-verification.mjs','node verify-rbac-user-management.mjs','npm run typecheck','npm run verify:ui','npm run verify:dev','npm run build','npm run verify:dist','npm run verify:preview','npm run stage-c:certify','npm run authentication-ui:status']) assert(certificationEntry.includes(gate), `M12 governed certification entrypoint missing ${gate}.`);

const governedBootstrap = spawnSync('bash', ['scripts/certify-stage-c-m12.sh', '--toolchain-check'], { cwd: root, encoding: 'utf8' });
if (governedBootstrap.stdout) process.stdout.write(governedBootstrap.stdout);
if (governedBootstrap.stderr) process.stderr.write(governedBootstrap.stderr);
assert(governedBootstrap.status === 0, 'M12 governed certification toolchain check failed.');
assert(governedBootstrap.stdout.includes('M12 governed certification toolchain: v22.16.0 / npm 10.9.2'), 'M12 certification entrypoint must execute under Node v22.16.0/npm 10.9.2.');

for (const scriptName of ['check','release:check']) {
  const script = pkg.scripts?.[scriptName] ?? '';
  const m10 = script.indexOf('npm run react-shell:check');
  const m11 = script.indexOf('npm run global-overlays:check');
  const m12 = script.indexOf('npm run authentication-ui:check');
  const type = script.indexOf('npm run typecheck');
  assert(m10 >= 0 && m11 > m10 && m12 > m11 && type > m12, `${scriptName} must preserve M10 -> M11 -> M12 -> typecheck ordering.`);
}
assert(pkg.scripts?.['authentication-ui:check'] === 'bash scripts/run-governed-toolchain.sh npm run authentication-ui:check:governed', 'M12 check must use governed toolchain dispatch.');
assert(pkg.scripts?.['authentication-ui:check:governed'] === 'npm run dependencies:ensure:governed && node verify-stage-c-m12-authentication-ui.mjs', 'M12 governed check must execute the milestone verifier.');
for (const gate of ['governance:restore','dependencies:ensure','governance:check','security:check','react:check','design-system:check','interactions:check','runtime-schemas:check','supabase-client:check','tanstack-query:check','client-state:check','react-shell:check','global-overlays:check','authentication-ui:check','lint:eslint','typecheck']) assert(activation.includes(`'${gate}'`), `M12 activation must execute ${gate}.`);
assert(stageCCertify.includes('authentication-ui:activate:release'), 'Stage C certification must promote M12.');
assert(stageCCertify.includes('M12 Authentication UI: active-certified'), 'Stage C certification summary must include M12.');
for (const workflow of ['.github/workflows/ci.yml','.github/workflows/deploy-pages.yml','governance-artifacts/github/workflows/ci.yml','governance-artifacts/github/workflows/deploy-pages.yml']) assert(read(workflow).includes('npm run authentication-ui:check'), `${workflow} must execute the M12 Authentication UI gate.`);
for (const file of ['src/app/auth/AuthenticationUI.tsx','src/app/auth/authentication-ui-runtime.ts','src/app/auth/useAuthenticationUiRuntime.ts','config/stage-c-m12-authentication-ui-target.ts','verify-stage-c-m12-authentication-ui.mjs','scripts/certify-stage-c-m12.sh','docs/WORK-MANAGEMENT-AUTHENTICATION-UI.md','M12-ACTIVATION-RUNBOOK.md','RELEASE-STATUS-v1.43.2-STAGE-C-M12-AUTHENTICATION-UI.md']) assert(projectVerifier.includes(file), `Aggregate verifier must require ${file}.`);
assert(!fs.readdirSync(path.join(root, 'supabase/migrations')).some((name) => /m12|authentication-ui/i.test(name)), 'M12 architecture-only work must not introduce a Supabase migration.');

const execution = spawnSync(process.execPath, ['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-authentication-ui-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M12 authentication UI execution vectors failed.');
console.log(`Stage C Milestone 12 Authentication UI verification: PASS (state=${state}; architecture=${architectureVersion})`);
