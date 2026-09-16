import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (value, message) => { if (!value) throw new Error(message); };
const inventory = JSON.parse(read('regression-baseline/m37-functional-regression-inventory.json'));
const policy = JSON.parse(read('config/functional-regression-baseline-policy.json'));
const tests = read('tests/modern/e2e/functional-regression-baseline.spec.mjs');
const probe = read('tests/modern/e2e/helpers/m37-regression-probe.mjs');
const fixture = read('tests/modern/e2e/helpers/m37-supabase-fixture.mjs');
const app = read('assets/js/app.ts');
const boardHost = read('src/app/boards/board-presentation-host.ts');
const backend = read('config/backend-config.js');
const auth = read('assets/js/core/auth.ts');
const management = read('src/app/management/AuthenticatedManagementUI.tsx');
const managementRuntime = read('src/app/management/authenticated-management-ui-runtime.ts');
const oldSmoke = read('tests/modern/e2e/application-smoke.spec.mjs');
const oldManagementExecution = read('scripts/verify-authenticated-management-ui-execution.mjs');
const runtimeIndex = read('assets/js/runtime/index.ts');
const runtimeAssets = read('config/runtime-assets.js');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const m30BrowserRunner = read('scripts/run-modern-browser-tests.mjs');
const evidenceGenerator = read('scripts/generate-functional-regression-evidence.mjs');
const activator = read('scripts/activate-stage-g-m37.mjs');
const executionCases = Object.freeze([
  'M37-EXEC-BOARD-HOST-HANDOFF',
  'M37-EXEC-USERS-RPC-AUTHORITY',
  'M37-EXEC-CERTIFICATION-GAP',
  'M37-EXEC-DUPLICATE-MANAGEMENT-AUTHORITY',
]);
for (const id of executionCases) assert(id.startsWith('M37-EXEC-'), `Invalid execution case id ${id}.`);

assert(policy.failClosed === true && policy.architectureVersion === 45, 'M37 policy must be Architecture 45 and fail closed.');
assert(Array.isArray(inventory.entries) && inventory.entries.length >= 9, 'M37 inventory must contain the complete characterized regression set.');
for (const moduleId of ['boards', 'users', 'settings', 'account']) {
  assert(inventory.entries.some((entry) => entry.module === moduleId || String(entry.module).includes(moduleId)), `M37 inventory missing ${moduleId}.`);
}
for (const entry of inventory.entries) {
  assert(entry.id && entry.summary && entry.classification && entry.status, `Incomplete inventory entry ${entry.id || 'unknown'}.`);
  assert((Array.isArray(entry.testIds) && entry.testIds.length > 0) || (Array.isArray(entry.failureSignatures) && entry.failureSignatures.length > 0), `${entry.id} has neither a test case nor a documented failure signature.`);
  for (const testId of entry.testIds || []) assert(tests.includes(testId) || testId.startsWith('M37-EXEC-'), `${entry.id} references missing browser test id ${testId}.`);
}

// Deterministic Board handoff characterization: current route ordering publishes
// the React facade and immediately invokes the imperative renderer. The resolver
// fails closed if React has not committed the facade host yet.
assert(app.includes("boardPresentationFacadeRuntime.showBoards(); return boardsFeature.renderBoards();"), 'Board collection route no longer contains the M37 handoff characterization.');
assert(app.includes("boardPresentationFacadeRuntime.showBoard(route.boardId); return boardsFeature.renderBoard(route.boardId);"), 'Board detail route no longer matches M37 handoff characterization.');
assert(boardHost.includes("throw new Error('Work Management React Board presentation facade host is missing.')"), 'Board host missing failure signature changed.');

// Checked-in source baseline intentionally has no public environment-specific
// project values. The runtime must therefore expose setup-required rather than
// silently pretending cloud-backed protected routes work.
assert(/supabaseUrl:\s*''/.test(backend) && /publishableKey:\s*''/.test(backend), 'Checked-in backend config is no longer the expected empty public fallback.');
assert(auth.includes("status: 'setup-required'") && auth.includes('Cloud authentication must be configured before Work Management can be used.'), 'Auth setup-required signature missing.');

// Users remain protected-RPC authoritative at M37.
assert(auth.includes("'/rest/v1/rpc/list_user_directory'") && auth.includes("'/rest/v1/rpc/admin_set_user_access'"), 'Users protected RPC authority changed unexpectedly.');
assert(management.includes('User directory unavailable') && managementRuntime.includes('updateUserAccess'), 'Users UI/runtime characterization authority missing.');

// Certification gap characterization.
assert(oldSmoke.includes("page.goto('/#/login')") && !oldSmoke.includes("/#/account") && !oldSmoke.includes("/#/users") && !oldSmoke.includes("/#/settings") && !oldSmoke.includes("/#/boards"), 'Original Playwright smoke no longer has the M37 login-only coverage gap signature.');
assert(oldManagementExecution.includes("show('account')") && oldManagementExecution.includes("show('settings')") && oldManagementExecution.includes("show('users')"), 'M13 management execution state-machine coverage signature changed.');

// M37 recorded duplicate management authority as technical debt; M44 resolves it.
const managementDebt = inventory.entries.find((entry) => entry.id === 'M37-TECHDEBT-001');
if (architectureVersion >= 52) {
  assert(managementDebt?.status === 'resolved-m44', 'M37 management authority debt must be marked resolved by M44.');
  for (const token of ['createAccountFeature', 'createSettingsFeature', 'createUserManagementFeature']) assert(!runtimeIndex.includes(token) && !runtimeAssets.includes(token), `M44 retired management authority must be absent: ${token}`);
  assert(manifest.includes("managementAuthorityConsolidation: 'single-react-management-runtime-v1'"), 'M44 consolidated management ownership declaration missing.');
  assert(manifest.includes("authenticatedManagementUiOwnership: 'react-management-v1'"), 'M44 consolidated React management ownership declaration missing.');
} else {
  for (const token of ['createAccountFeature', 'createSettingsFeature', 'createUserManagementFeature']) assert(runtimeIndex.includes(token) || runtimeAssets.includes(token), `Legacy management authority signature ${token} is no longer present; update inventory if intentionally retired.`);
  assert(manifest.includes("authenticatedManagementUiOwnership: 'react-account-settings-user-management-v1'"), 'React management ownership declaration missing.');
}

// Evidence harness contract.
for (const token of ["page.on('console'", "page.on('pageerror'", "page.on('requestfailed'", "page.on('response'", 'runtimeContext', 'domOwnership', 'hasSession']) assert(probe.includes(token), `M37 browser probe missing ${token}.`);
for (const token of ['access_token', 'refresh_token', 'authorization', 'apikey', 'password']) assert(probe.toLowerCase().includes(token), `M37 redaction contract missing ${token}.`);
assert(fixture.includes('https://m37-fixture.supabase.co') && fixture.includes('PGRST202') && fixture.includes('wm_list_boards') && fixture.includes('list_user_directory') && fixture.includes('update_own_profile'), 'M37 deterministic backend fixture is incomplete.');
assert(fixture.includes('boardRpcFailure = false') && fixture.includes('userDirectoryFailure = false') && fixture.includes('profileMutationFailure = false') && fixture.includes('healthFailure = false'), 'M37 fixture failures must be opt-in per scenario so unrelated failures cannot contaminate characterization.');
assert(fixture.includes('waitForFixtureAuthentication') && fixture.includes('navigateFixtureRoute'), 'M37 fixture must prove authenticated bootstrap before protected-route characterization.');
for (const testId of ['M37-E2E-UNCONFIGURED-PROTECTED-ROUTES', 'M37-E2E-ACCOUNT-FIXTURE', 'M37-E2E-USERS-FIXTURE', 'M37-E2E-SETTINGS-FIXTURE', 'M37-E2E-BOARDS-FIXTURE']) assert(tests.includes(testId), `M37 browser characterization missing ${testId}.`);
assert(tests.includes('fixture-authenticated-bootstrap') && tests.includes('unexpected-harness-failure') && tests.includes('characterized: true'), 'M37 tests must capture bootstrap state and write evidence on unexpected harness failures.');
assert(m30BrowserRunner.includes("tests/modern/e2e/application-smoke.spec.mjs") && !m30BrowserRunner.includes("functional-regression-baseline.spec.mjs"), 'M30 generic Playwright runner must be isolated from M37 environment-specific characterization tests.');
for (const file of ['unconfigured-account.json','unconfigured-boards.json','unconfigured-settings.json','unconfigured-users.json','fixture-account.json','fixture-boards.json','fixture-settings.json','fixture-users.json']) assert(evidenceGenerator.includes(file), `M37 evidence generator missing exact scenario ${file}.`);
assert(evidenceGenerator.includes('credentialMaterialCaptured') && evidenceGenerator.includes('browserCharacterizationComplete') && evidenceGenerator.includes('process.exitCode = 1'), 'M37 evidence generator must fail closed on scenario completeness and credential capture.');
assert(activator.indexOf("run('functional-regression:browser')") < activator.indexOf("run('verify:historical-all')"), 'M37 release activation must run browser characterization before expensive historical/release gates.');

console.log(`Stage G M37 functional regression baseline execution verification: PASS (inventory=${inventory.entries.length}; modules=4; browserScenarioFiles=8; evidenceChannels=${policy.requiredEvidence.length}; harnessIsolation=verified; remediationApplied=false)`);
