import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const pkg = JSON.parse(read('package.json'));
const target = read('config/stage-c-m11-global-overlays-target.ts');
const m10Target = read('config/stage-c-m10-react-shell-target.ts');
const manifest = read('config/application-manifest.ts');
const manifestTypes = read('src/types/manifest.ts');
const manifestSchema = read('src/runtime-schemas/manifest.ts');
const shell = read('src/app/shell/WorkManagementShell.tsx');
const host = read('src/app/overlays/GlobalOverlayHost.tsx');
const contract = read('src/platform/contracts/overlay.ts');
const runtime = read('assets/js/platform/ui/global-overlay-runtime.ts');
const manager = read('assets/js/platform/ui/overlay-manager.ts');
const commands = read('assets/js/features/commands/index.ts');
const sharedUi = fs.existsSync(path.join(root, 'src/app/shared-ui/SharedApplicationUI.tsx')) ? read('src/app/shared-ui/SharedApplicationUI.tsx') : '';
const sharedRuntime = fs.existsSync(path.join(root, 'src/app/shared-ui/shared-application-ui-runtime.ts')) ? read('src/app/shared-ui/shared-application-ui-runtime.ts') : '';
const auth = read('assets/js/features/auth/index.ts');
const profile = read('assets/js/features/account/profile-menu.ts');
const tooltip = read('assets/js/platform/ui/tooltip-controller.ts');
const inlineEdit = read('assets/js/features/boards/controllers/inline-edit-controller.ts');
const columnWorkflows = read('assets/js/features/boards/controllers/column-workflows.ts');
const dialog = read('assets/js/features/boards/controllers/dialog-controller.ts');
const app = read('assets/js/app.ts');
const runtimeGateway = read('assets/js/runtime/index.ts');
const viteSmoke = read('scripts/verify-vite-server.mjs');
const browserHarness = read('tests/browser/run-cdp.mjs');
const projectVerifier = read('verify-project.sh');
const activation = read('scripts/activate-stage-c-m11.mjs');
const stageCCertify = read('scripts/certify-stage-c-platform.mjs');
const doc = read('docs/WORK-MANAGEMENT-GLOBAL-OVERLAYS.md');
const architectureDoc = read('docs/architecture/ARCHITECTURE.md');
const certificationEntry = read('scripts/certify-stage-c-m11.sh');
const activationRunbook = read('M11-ACTIVATION-RUNBOOK.md');
const bootstrapHotfixDoc = read('M11-GOVERNED-BOOTSTRAP-HOTFIX.md');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const m10State = m10Target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);

assert(['blocked-pending-m10-certification','implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Unsupported M11 state: ${state}`);
assert(m10State === 'active-certified', `M11 package must inherit active-certified M10; found ${m10State}`);
assert(architectureVersion >= 21, `M11 requires application architecture version 21 or newer; found ${architectureVersion}.`);
assert(manifest.includes("globalOverlayHost: 'src/app/overlays/GlobalOverlayHost.tsx'"), 'Manifest must declare the React global overlay host.');
assert(manifest.includes("globalOverlayRuntime: 'assets/js/platform/ui/global-overlay-runtime.ts'"), 'Manifest must declare the global overlay runtime authority.');
assert(manifest.includes("globalOverlayOwnership: 'react-global-overlays-v1'"), 'Manifest must declare M11 global overlay ownership.');
assert(manifest.includes("overlayLifecycle: 'assets/js/platform/ui/global-overlay-runtime.ts'"), 'Overlay lifecycle authority must move to the global runtime.');
assert(manifestTypes.includes("globalOverlayOwnership?: 'react-global-overlays-v1'"), 'Manifest types must expose M11 ownership.');
assert(manifestSchema.includes("globalOverlayOwnership: z.literal('react-global-overlays-v1')"), 'Manifest schema must validate M11 ownership.');
assert(manifestSchema.includes('Architecture v21+ requires React-owned global overlay roots'), 'Runtime schema must enforce the M11 architecture floor.');
assert(architectureDoc.includes('Architecture Version 21') && architectureDoc.includes('GlobalOverlayHost.tsx'), 'Architecture documentation must describe M11.');

for (const marker of ['data-wm-global-overlay-host','react-global-overlays','id="overlayRoot"','id="toastRoot"','data-wm-global-overlay-layer="interactive"','data-wm-global-overlay-layer="toast"']) {
  assert(host.includes(marker), `React global overlay host missing marker: ${marker}`);
}
assert(shell.includes("import { GlobalOverlayHost }"), 'React shell must compose the M11 global overlay host.');
assert(shell.includes('<GlobalOverlayHost />'), 'React shell must render the M11 global overlay host.');
assert(!shell.includes('<div id="overlayRoot"'), 'M10 shell must not independently render the interactive overlay root after M11.');
assert(!shell.includes('<div id="toastRoot"'), 'M10 shell must not independently render the toast root after M11.');
assert(!auth.includes('id="overlayRoot"') && !auth.includes('id="toastRoot"'), 'Authentication route content must not duplicate M11 page-lifetime portal roots.');

for (const marker of ['GlobalOverlayClaim','GlobalOverlayRuntimeSnapshot','GlobalOverlayRuntime']) assert(contract.includes(marker), `Overlay contract missing M11 type: ${marker}`);
for (const marker of ['globalOverlayRuntime','claim(claim','update(instanceId','release(instanceId','reset()','GLOBAL_OVERLAY_OPEN_EVENT','resolveGlobalOverlayRoot','resolveGlobalToastRoot']) {
  assert(runtime.includes(marker), `Global overlay runtime missing: ${marker}`);
}
assert(manager.includes("from './global-overlay-runtime.ts'"), 'Overlay manager must delegate root ownership to the M11 global runtime.');
assert(manager.includes('globalOverlayRuntime.claim({'), 'Overlay manager root openings must claim the global authority.');
assert(manager.includes('globalOverlayRuntime.update(instanceId'), 'Overlay manager child branches must synchronize the global top overlay.');
assert(manager.includes('globalOverlayRuntime.release(instanceId)'), 'Overlay manager must release global ownership.');
assert(!manager.includes("addEventListener(GLOBAL_OVERLAY_OPEN_EVENT"), 'Per-manager document-event coordination must be removed after M11 global authority consolidation.');

if (architectureVersion >= 24) {
  assert(sharedUi.includes("createOverlayManager({ scope: 'react-shared-command-palette' })"), 'M14 React command palette must participate in the M11 global overlay lifecycle.');
  assert(host.includes('<SharedApplicationOverlayLayer />'), 'M14 React command palette must render inside the React-owned global overlay root.');
  assert(sharedRuntime.includes('openCommandPalette') && sharedRuntime.includes('closeCommandPalette'), 'M14 shared UI runtime must expose command-palette lifecycle state behind the M11 overlay boundary.');
} else {
  assert(commands.includes("createOverlayManager({ scope: 'global-command-palette' })"), 'Command palette must participate in global overlay lifecycle.');
  assert(commands.includes('resolveGlobalOverlayRoot().appendChild(backdrop)'), 'Command palette must portal through the React-owned global overlay root.');
}
assert(!commands.includes("document.querySelector('#overlayRoot')?.insertAdjacentHTML"), 'Command palette must not bypass M11 with direct root HTML insertion.');
assert(profile.includes('resolveGlobalOverlayRoot(documentRef).appendChild(root)') && profile.includes('resolveGlobalOverlayRoot(documentRef).appendChild(submenu)'), 'Account root/submenu must use the M11 portal host.');
assert(tooltip.includes('resolveGlobalOverlayRoot(documentRef).appendChild(tooltip)'), 'Shell tooltips must use the M11 portal host.');
assert(inlineEdit.includes('resolveGlobalOverlayRoot().appendChild(popover)'), 'Board inline popovers must use the M11 portal host.');
assert(columnWorkflows.includes('resolveGlobalOverlayRoot().appendChild(pop)') && columnWorkflows.includes('const overlay = resolveGlobalOverlayRoot();'), 'Board column pickers must use the M11 portal host.');
assert(dialog.includes("overlaySelector === '#overlayRoot'") && dialog.includes('resolveGlobalOverlayRoot()'), 'Board dialogs must resolve the M11 portal host through the shared resolver.');
if (architectureVersion >= 24) {
  assert(app.includes('sharedApplicationUiRuntime.pushToast(message, tone)'), 'M14 global toast adapter must delegate to React content mounted in the M11 toast root.');
  assert(host.includes('<SharedApplicationToastLayer />'), 'M14 global toasts must render inside the React-owned M11 toast root.');
  assert(app.includes('sharedApplicationUiRuntime.showUpdate()') && host.includes('<SharedApplicationOverlayLayer />'), 'M14 update banner must render through React inside the M11 interactive overlay root.');
} else {
  assert(app.includes('const root = resolveGlobalToastRoot();'), 'Global toast renderer must use the React-owned toast root.');
  assert(app.includes('resolveGlobalOverlayRoot().appendChild(banner)'), 'Global update banner must use the React-owned interactive overlay layer.');
}
assert(!app.includes('globalToastRoot'), 'Legacy secondary body-level toast root must be removed.');
assert(!app.includes('id="overlayRoot"') && !app.includes('id="toastRoot"'), 'Inert legacy shell serialization must not retain duplicate M11 portal-root markup.');
assert(runtimeGateway.includes('globalOverlayRuntime') && runtimeGateway.includes('resolveGlobalOverlayRoot') && runtimeGateway.includes('resolveGlobalToastRoot'), 'Runtime gateway must expose M11 global overlay authority.');

assert(viteSmoke.includes('Stage C M11 browser ownership contract'), 'Vite dev/preview smoke must execute the M11 ownership contract.');
for (const [marker, value] of [['data-wm-global-overlay-host', undefined],['data-wm-composition-owner','react-global-overlays'],['data-wm-global-overlay-layer','interactive'],['data-wm-global-overlay-layer','toast'],['id','overlayRoot'],['id','toastRoot']]) {
  const expression = value === undefined
    ? `countElementsWithAttribute(dom, '${marker}')`
    : `countElementsWithAttribute(dom, '${marker}', '${value}')`;
  assert(viteSmoke.includes(expression), `M11 browser smoke missing element-aware ownership count: ${expression}`);
}
for (const marker of ['Stage C M11 global overlay ownership authority','M11 runtime publishes the current global owner','M11 replaces the previous root overlay branch','M11 account menu is portaled','M11 shell tooltip is portaled']) {
  assert(browserHarness.includes(marker), `Chromium integration suite missing M11 assertion: ${marker}`);
}
assert(doc.includes('temporary compatibility boundaries') && doc.includes('imperative compatibility content'), 'M11 documentation must disclose retained overlay-content compatibility boundaries.');

assert(fs.statSync(path.join(root, 'scripts/certify-stage-c-m11.sh')).mode & 0o100, 'M11 governed certification entrypoint must be executable.');
assert(certificationEntry.includes('scripts/run-governed-toolchain.sh'), 'M11 certification must enter the governed toolchain before npm execution.');
assert(certificationEntry.indexOf('scripts/run-governed-toolchain.sh') < certificationEntry.indexOf('npm ci'), 'M11 certification must dispatch the governed toolchain before dependency installation.');
for (const gate of ['npm ci','npm run react-shell:check','npm run global-overlays:check','npm run typecheck','npm run verify:ui','npm run verify:dev','npm run build','npm run verify:dist','npm run verify:preview','npm run stage-c:certify','npm run global-overlays:status']) {
  assert(certificationEntry.includes(gate), `M11 governed certification entrypoint missing ${gate}.`);
}
assert(activationRunbook.includes('bash scripts/certify-stage-c-m11.sh'), 'M11 activation runbook must use the shell-level governed certification entrypoint.');
assert(activationRunbook.includes('Do **not** begin M11 certification with a raw ambient `npm ci`'), 'M11 activation runbook must warn against ambient npm bootstrap.');
assert(bootstrapHotfixDoc.includes('Node `v24.20.0`') && bootstrapHotfixDoc.includes('npm `11.19.0`'), 'M11 bootstrap hotfix documentation must record the reproduced ambient-toolchain failure.');

const governedBootstrap = spawnSync('bash', ['scripts/certify-stage-c-m11.sh', '--toolchain-check'], { cwd: root, encoding: 'utf8' });
if (governedBootstrap.stdout) process.stdout.write(governedBootstrap.stdout);
if (governedBootstrap.stderr) process.stderr.write(governedBootstrap.stderr);
assert(governedBootstrap.status === 0, 'M11 governed certification toolchain check failed.');
assert(governedBootstrap.stdout.includes('M11 governed certification toolchain: v22.16.0 / npm 10.9.2'), 'M11 certification entrypoint must execute under Node v22.16.0/npm 10.9.2.');

for (const scriptName of ['check','release:check']) {
  const script = pkg.scripts?.[scriptName] ?? '';
  const m10 = script.indexOf('npm run react-shell:check');
  const m11 = script.indexOf('npm run global-overlays:check');
  const type = script.indexOf('npm run typecheck');
  assert(m10 >= 0 && m11 > m10 && type > m11, `${scriptName} must preserve M10 -> M11 -> typecheck ordering.`);
}
assert(pkg.scripts?.['global-overlays:check'] === 'bash scripts/run-governed-toolchain.sh npm run global-overlays:check:governed', 'M11 check must use governed toolchain dispatch.');
assert(pkg.scripts?.['global-overlays:check:governed'] === 'npm run dependencies:ensure:governed && node verify-stage-c-m11-global-overlays.mjs', 'M11 governed check must execute the milestone verifier.');
for (const gate of ['governance:restore','dependencies:ensure','governance:check','security:check','react:check','design-system:check','interactions:check','runtime-schemas:check','supabase-client:check','tanstack-query:check','client-state:check','react-shell:check','global-overlays:check','lint:eslint','typecheck']) {
  assert(activation.includes(`'${gate}'`), `M11 activation must execute ${gate}.`);
}
assert(stageCCertify.includes('global-overlays:activate:release'), 'Stage C certification must promote M11.');
assert(stageCCertify.includes('M11 Global Overlays: active-certified'), 'Stage C certification summary must include M11.');
for (const workflow of ['.github/workflows/ci.yml','.github/workflows/deploy-pages.yml','governance-artifacts/github/workflows/ci.yml','governance-artifacts/github/workflows/deploy-pages.yml']) {
  assert(read(workflow).includes('npm run global-overlays:check'), `${workflow} must execute the M11 global overlay gate.`);
}
for (const file of ['src/app/overlays/GlobalOverlayHost.tsx','assets/js/platform/ui/global-overlay-runtime.ts','config/stage-c-m11-global-overlays-target.ts','verify-stage-c-m11-global-overlays.mjs','scripts/certify-stage-c-m11.sh','M11-GOVERNED-BOOTSTRAP-HOTFIX.md']) {
  assert(projectVerifier.includes(file), `Aggregate verifier must require ${file}.`);
}

const execution = spawnSync(process.execPath, ['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-global-overlays-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M11 global overlay execution vectors failed.');
console.log(`Stage C Milestone 11 Global Overlays verification: PASS (state=${state}; architecture=${architectureVersion})`);
