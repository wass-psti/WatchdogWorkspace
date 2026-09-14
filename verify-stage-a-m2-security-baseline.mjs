import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const pass = (message) => console.log(`PASS ${message}`);

const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.scripts?.['security:check'], 'node verify-stage-a-m2-security-baseline.mjs');
for (const scriptName of ['check', 'release:check']) {
  const script = pkg.scripts?.[scriptName] || '';
  const governanceIndex = script.indexOf('npm run governance:check');
  const securityIndex = script.indexOf('npm run security:check');
  const typecheckIndex = script.indexOf('npm run typecheck');
  assert.ok(governanceIndex >= 0, `${scriptName} must execute governance:check`);
  assert.ok(securityIndex > governanceIndex, `${scriptName} must execute security:check after governance:check`);
  assert.ok(typecheckIndex > securityIndex, `${scriptName} must execute typecheck after security:check`);
}
pass('security baseline is a mandatory check and release gate');

const moduleTypes = read('src/types/modules.ts');
const moduleConfig = read('config/modules.ts');
const appSource = read('assets/js/app.ts');
assert.match(moduleTypes, /EmbeddedBrowserPermission = 'geolocation' \| 'clipboard-write'/);
assert.match(moduleTypes, /browserPermissions\?: readonly EmbeddedBrowserPermission\[\]/);
assert.match(moduleConfig, /'time-tracker'[\s\S]*browserPermissions: \['geolocation'\]/);
assert.match(moduleConfig, /'fueltrack-plus'[\s\S]*browserPermissions: \['clipboard-write'\]/);
assert.match(moduleConfig, /tradelink:[\s\S]*browserPermissions: \['clipboard-write'\]/);
assert.match(appSource, /function moduleBrowserPermissions\(/);
assert.match(appSource, /moduleBrowserPermissions\(mod\)/);
assert.doesNotMatch(appSource, /clipboard-read/);
assert.doesNotMatch(appSource, /allow="geolocation; clipboard-read; clipboard-write"/);
pass('embedded modules receive only declared browser permissions and clipboard-read is denied');

const moduleBootstrap = read('assets/js/runtime/module-bootstrap.ts');
assert.match(moduleBootstrap, /resolveLocalScriptUrl/);
assert.match(moduleBootstrap, /url\.origin !== location\.origin/);
assert.match(moduleBootstrap, /script\.src = resolveLocalScriptUrl\(path\)/);
pass('embedded runtime bootstrap refuses cross-origin executable entry scripts');

const timeTrackerSource = read('apps/time-tracker/app.js');
assert.match(timeTrackerSource, /https:\/\/unpkg\.com\/leaflet@1\.9\.4\/dist\/leaflet\.js/);
assert.match(timeTrackerSource, /sha256-20nQCchB9co0qIjJZRGuk2\/Z9VM\+kNiyxNV1lvTlZBo=/);
assert.match(timeTrackerSource, /sha256-p4NxAoJBhIIN\+hmNHrzRCf9tD\/miZyoHS5obTRR9BMY=/);
assert.match(timeTrackerSource, /crossOrigin = 'anonymous'/);
pass('TimeTracker pins official Leaflet 1.9.4 CDN resources with Subresource Integrity');

const moduleHost = read('assets/js/runtime/module-host.ts');
assert.match(moduleHost, /event\.origin !== origin/);
assert.match(moduleHost, /event\.source !== frame\.contentWindow/);
pass('host/module messaging authenticates origin and frame source');

const authSource = read('assets/js/core/auth.ts');
const globalRequest = authSource.indexOf("await this.request('/auth/v1/logout?scope=global'");
const guardedClear = authSource.indexOf('    this.clearRuntimeIdentity();', globalRequest);
const revocationError = authSource.indexOf('All sessions could not be revoked. Your current browser remains signed in so you can retry.');
assert.ok(globalRequest >= 0, 'global Supabase logout request missing');
assert.ok(revocationError > globalRequest && revocationError < guardedClear, 'global revocation failure must be raised before local identity is cleared');
assert.ok(guardedClear > globalRequest, 'local identity must only clear after global revocation succeeds');
assert.match(authSource, /\/auth\/v1\/logout\?scope=local/);
assert.match(authSource, /Remote local sign-out failed after local session termination/);
assert.match(authSource, /addEventListener\('focus',[\s\S]*revalidateAccessContext|revalidateAccessContext/);
assert.match(authSource, /BroadcastChannel/);
pass('session lifecycle preserves retry on failed global revocation and retains synchronized auth state');

const accountSource = read('assets/js/features/account/index.ts');
assert.match(accountSource, /Session revocation could not be completed/);
assert.match(accountSource, /setAuthFeedback\(message, 'warning'\)/);
pass('account UI reports unconfirmed global session revocation instead of false success');

const serviceWorker = read('service-worker.js');
assert.match(serviceWorker, /hasSensitiveRequestHeaders/);
assert.match(serviceWorker, /request\.headers\.has\('authorization'\)/);
assert.match(serviceWorker, /request\.headers\.has\('cookie'\)/);
assert.match(serviceWorker, /fetch\(request, \{ cache: 'no-store' \}\)/);
assert.match(serviceWorker, /canCacheNavigation/);
assert.match(serviceWorker, /!url\.search/);
pass('service worker bypasses credential-bearing requests and avoids caching query-bearing navigations');

const viteSource = read('vite.config.js');
assert.match(viteSource, /work-management-security-baseline/);
assert.match(viteSource, /Content-Security-Policy/);
assert.match(viteSource, /"script-src 'self'"/);
const distVerifierSource = read('scripts/verify-dist.mjs');
assert.match(distVerifierSource, /extractContentSecurityPolicy/);
assert.match(distVerifierSource, /validateProductionContentSecurityPolicy/);
const cspPolicySource = read('scripts/security/production-csp-policy.mjs');
assert.match(cspPolicySource, /script-src must contain exactly 'self'/);
pass('production artifact CSP verification decodes HTML serialization and enforces same-origin-only script sources');
assert.doesNotMatch(viteSource, /script-src[^\n]*(?:unsafe-inline|unsafe-eval)/i);
assert.match(viteSource, /"object-src 'none'"/);
assert.match(viteSource, /"base-uri 'self'"/);
assert.match(viteSource, /strict-origin-when-cross-origin/);
assert.match(viteSource, /https:\/\/\*\.supabase\.co/);
pass('production shell build emits restrictive CSP and referrer policy without unsafe script execution');

const diagnostics = read('assets/js/platform/observability/diagnostics.ts');
assert.match(diagnostics, /token\|password\|secret\|authorization\|apikey\|cookie/i);
assert.match(diagnostics, /'\[redacted\]'/);
pass('diagnostics redact credential and authorization-shaped metadata');

const backendConfig = read('config/backend-config.js');
const runtimeConfig = read('config/vite-runtime-config.ts');
assert.match(backendConfig, /publishableKey/);
assert.doesNotMatch(backendConfig, /service[_-]?role/i);
assert.match(runtimeConfig, /VITE_SUPABASE_PUBLISHABLE_KEY/);
assert.doesNotMatch(runtimeConfig, /service[_-]?role/i);
assert.ok(authSource.includes(String.raw`/^https:\/\/.+\.supabase\.co$/i.test(supabaseUrl)`), 'auth runtime must require an HTTPS Supabase project URL');
pass('browser backend configuration remains publishable-key only and HTTPS Supabase constrained');


const hardeningSql = read('supabase/migrations/v1.43.0-production-hardening.sql');
const schemaSql = read('supabase/schema.sql');
for (const [name, sql] of [['hardening migration', hardeningSql], ['consolidated schema', schemaSql]]) {
  assert.match(sql, /join\s+public\.profiles\s+p\s+on\s+p\.id\s*=\s*wm\.user_id/i, `${name} must bind workspace access to profile state`);
  assert.match(sql, /p\.status\s*=\s*'active'/i, `${name} must deny disabled account workspace access`);
  assert.match(sql, /create or replace function public\.work_board_access/i, `${name} must provide authoritative Board access helper`);
  assert.match(sql, /security definer set search_path=public/i, `${name} privileged helpers must pin search_path`);
}
assert.match(schemaSql, /create or replace function public\.has_module_access[\s\S]{0,500}p\.status\s*=\s*'active'/i);
assert.match(schemaSql, /create or replace function public\.is_platform_admin[\s\S]{0,300}status='active'/i);
pass('Supabase authorization denies disabled accounts at workspace, module, admin, and Board boundaries');

const hostSources = [
  ...fs.readdirSync('src', { recursive: true }).filter((entry) => /\.(?:ts|tsx)$/.test(String(entry))).map((entry) => `src/${entry}`),
  ...fs.readdirSync('assets/js', { recursive: true }).filter((entry) => /\.ts$/.test(String(entry))).map((entry) => `assets/js/${entry}`),
  ...fs.readdirSync('config').filter((entry) => /\.ts$/.test(entry)).map((entry) => `config/${entry}`),
];
for (const path of hostSources) {
  const source = read(path);
  assert.doesNotMatch(source, /\beval\s*\(/, `${path} uses eval()`);
  assert.doesNotMatch(source, /new\s+Function\s*\(/, `${path} uses new Function()`);
  assert.doesNotMatch(source, /javascript\s*:/i, `${path} contains a javascript: URL`);
}
pass('authoritative TypeScript host contains no eval/new Function/javascript URL execution primitives');

const repositorySource = read('assets/js/features/boards/data/board-repository.ts');
assert.match(repositorySource, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/);
pass('host-created external windows use opener/referrer isolation');

const ci = read('.github/workflows/ci.yml');
const deploy = read('.github/workflows/deploy-pages.yml');
for (const [name, workflow] of [['CI', ci], ['deployment', deploy]]) {
  assert.match(workflow, /npm run security:check/, `${name} must execute security:check explicitly`);
}
pass('CI and deployment execute the Stage A security baseline before release promotion');

const securityDoc = read('docs/SECURITY-BASELINE.md');
assert.match(securityDoc, /Supabase Auth is authoritative/i);
assert.match(securityDoc, /GitHub Pages/i);
assert.match(securityDoc, /Leaflet/i);
assert.match(securityDoc, /Administrator revocation of another user's Supabase sessions/i);
assert.match(securityDoc, /CAPTCHA/i);
pass('security baseline documentation records trust boundaries and external production controls');

console.log('Stage A Milestone 2 security baseline verification: PASS');
