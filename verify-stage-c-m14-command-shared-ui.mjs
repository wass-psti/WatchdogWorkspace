import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const target = read('config/stage-c-m14-command-shared-ui-target.ts');
const m13Target = read('config/stage-c-m13-account-settings-user-management-target.ts');
const manifest = read('config/application-manifest.ts');
const manifestTypes = read('src/types/manifest.ts');
const manifestSchema = read('src/runtime-schemas/manifest.ts');
const sharedUi = read('src/app/shared-ui/SharedApplicationUI.tsx');
const sharedRuntime = read('src/app/shared-ui/shared-application-ui-runtime.ts');
const sharedHook = read('src/app/shared-ui/useSharedApplicationUiRuntime.ts');
const overlayHost = read('src/app/overlays/GlobalOverlayHost.tsx');
const commandFeature = read('assets/js/features/commands/index.ts');
const commandRegistry = read('assets/js/features/commands/command-registry.ts');
const app = read('assets/js/app.ts');
const runtimeGateway = read('assets/js/runtime/index.ts');
const main = read('src/main.ts');
const css = read('assets/css/shared-application-ui.css');
const browserGlobals = read('tests/browser/runtime-globals-entry.ts');
const browserHarness = read('tests/browser/run-cdp.mjs');
const stageCCertify = read('scripts/certify-stage-c-platform.mjs');
const activation = read('scripts/activate-stage-c-m14.mjs');
const certEntry = read('scripts/certify-stage-c-m14.sh');
const projectVerifier = read('verify-project.sh');
const architectureDoc = read('docs/architecture/ARCHITECTURE.md');
const milestoneDoc = read('docs/WORK-MANAGEMENT-COMMAND-SHARED-UI.md');
const releaseStatus = read('RELEASE-STATUS-v1.43.2-STAGE-C-M14-COMMAND-SHARED-UI.md');
const runbook = read('M14-ACTIVATION-RUNBOOK.md');
const ciWorkflow = read('.github/workflows/ci.yml');
const deployWorkflow = read('.github/workflows/deploy-pages.yml');
const governedCiWorkflow = read('governance-artifacts/github/workflows/ci.yml');
const governedDeployWorkflow = read('governance-artifacts/github/workflows/deploy-pages.yml');
const governanceRestore = read('scripts/restore-required-repository-artifacts.mjs');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const m13State = m13Target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const targetArchitecture = Number(target.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);

assert(['blocked-pending-m13-certification','implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Unsupported M14 state: ${state}`);
assert(m13State === 'active-certified', `M14 package must inherit active-certified M13; found ${m13State}`);
assert(targetArchitecture === 24, `M14 target must declare Architecture Version 24; found ${targetArchitecture}.`);
assert(architectureVersion >= 24, `M14 package must expose Architecture Version 24 or later; found ${architectureVersion}.`);

for (const marker of [
  "sharedApplicationUi: 'src/app/shared-ui/SharedApplicationUI.tsx'",
  "sharedApplicationUiRuntime: 'src/app/shared-ui/shared-application-ui-runtime.ts'",
  "sharedApplicationUiOwnership: 'react-command-palette-shared-ui-v1'",
  "commandRegistry: 'assets/js/features/commands/command-registry.ts'",
]) assert(manifest.includes(marker), `Application manifest missing M14 authority: ${marker}`);
assert(manifest.includes("{ id: 'commands', state: 'active', boundary: 'src/app/shared-ui/SharedApplicationUI.tsx'"), 'Commands feature must advertise the React shared application UI boundary.');
for (const marker of ['sharedApplicationUi?: string','sharedApplicationUiRuntime?: string',"sharedApplicationUiOwnership?: 'react-command-palette-shared-ui-v1'",'commandRegistry?: string']) assert(manifestTypes.includes(marker), `Manifest type contract missing ${marker}`);
assert(manifestSchema.includes("sharedApplicationUiOwnership: z.literal('react-command-palette-shared-ui-v1').optional()"), 'Manifest runtime schema must model M14 shared application UI ownership.');
assert(manifestSchema.includes('manifest.architectureVersion >= 24') && manifestSchema.includes('React ownership of the command palette and shared application UI'), 'Manifest runtime schema must enforce Architecture v24 shared application UI ownership.');

for (const marker of [
  'data-wm-shared-command-palette',
  'id="commandInput"',
  'id="commandResults"',
  'role="listbox"',
  'aria-activedescendant',
  'sharedApplicationUiRuntime.executeCommand',
  'sharedApplicationUiRuntime.moveCommandSelection',
  'data-wm-shared-update-banner',
  'data-wm-shared-toast',
]) assert(sharedUi.includes(marker), `React shared application UI missing ${marker}`);
assert(sharedUi.includes("createOverlayManager({ scope: 'react-shared-command-palette' })"), 'React command palette must participate in the M11 global overlay lifecycle through the shared manager adapter.');
assert(sharedUi.includes("event.key === 'Tab'") && sharedUi.includes("event.key === 'ArrowDown'") && sharedUi.includes("event.key === 'Enter'"), 'React command palette must own focus trapping and keyboard navigation.');
assert(sharedHook.includes('useSyncExternalStore') && sharedHook.includes('sharedApplicationUiRuntime.subscribe'), 'M14 React UI must subscribe through an external-store bridge.');

for (const marker of ['configureCommandPalette','openCommandPalette','closeCommandPalette','updateCommandQuery','moveCommandSelection','executeCommand','pushToast','dismissToast','showUpdate','dismissUpdate','applyUpdate','resetForTest']) assert(sharedRuntime.includes(marker), `M14 shared runtime missing ${marker}`);
assert(!/password|confirmPassword/i.test(sharedRuntime.match(/export interface SharedApplicationUiSnapshot[\s\S]*?\n\}/)?.[0] || ''), 'M14 shared UI runtime must not retain credential-shaped state.');

assert(overlayHost.includes('SharedApplicationOverlayLayer') && overlayHost.includes('SharedApplicationToastLayer'), 'M11 React overlay host must render M14 React shared UI layers inside the existing page-lifetime roots.');
assert(overlayHost.includes('data-wm-shared-application-ui-host') && overlayHost.includes('data-wm-shared-application-ui-owner="react-command-palette-shared-ui"'), 'M14 shared application UI must have one page-lifetime React ownership marker.');
assert(overlayHost.includes('id="overlayRoot"') && overlayHost.includes('id="toastRoot"'), 'M14 must preserve the M11 global overlay root contract.');

assert(commandRegistry.includes('createCommandRegistry') && commandRegistry.includes('register') && commandRegistry.includes('execute'), 'Typed command registry authority must remain intact.');
assert(commandFeature.includes('sharedApplicationUiRuntime.configureCommandPalette'), 'Imperative command feature must configure the M14 React shared UI runtime.');
assert(commandFeature.includes('registry.list(context())') && commandFeature.includes('registry.execute(id, context())'), 'M14 adapter must preserve registry visibility and execution semantics.');
for (const forbidden of ['function markup()', 'template.innerHTML', 'resolveGlobalOverlayRoot().appendChild', 'document.querySelector<HTMLElement>(\'#commandResults\')', 'target.innerHTML']) assert(!commandFeature.includes(forbidden), `Command feature still contains retired imperative palette rendering: ${forbidden}`);

assert(app.includes('sharedApplicationUiRuntime.pushToast(message, tone)'), 'Global toast adapter must delegate to M14 React shared UI runtime.');
assert(app.includes('sharedApplicationUiRuntime.configureUpdate') && app.includes('sharedApplicationUiRuntime.showUpdate()'), 'Service-worker update presentation must delegate to the M14 shared UI runtime.');
for (const forbidden of ['function showUpdateBanner()', "document.createElement('div');\n  node.className = `toast", "target.closest('[data-dismiss-update]')", "target.closest('[data-apply-update]')"]) assert(!app.includes(forbidden), `Application runtime still contains retired imperative shared UI rendering: ${forbidden}`);
assert(app.includes("featureRegistry.register('commands', commandFeature, { kind: 'react-feature', boundary: 'src/app/shared-ui/SharedApplicationUI.tsx' })"), 'Runtime feature registry must advertise React ownership for commands.');
assert(runtimeGateway.includes('sharedApplicationUiRuntime'), 'Runtime gateway must expose the M14 shared application UI authority.');
assert(main.includes("import '../assets/css/shared-application-ui.css';"), 'Vite entry must load M14 shared UI presentation rules.');
assert(css.includes('Stage C M14') && css.includes('prefers-reduced-motion'), 'M14 shared UI CSS must include explicit reduced-motion behavior.');

assert(browserGlobals.includes('sharedApplicationUiRuntime'), 'Browser runtime fixture must export the M14 shared UI runtime.');
assert(browserHarness.includes('Stage C M14 shared application UI runtime authority'), 'Browser integration must exercise M14 shared UI ownership.');
const browserHarnessSyntax = spawnSync(process.execPath, ['--check', 'tests/browser/run-cdp.mjs'], { cwd: root, encoding: 'utf8' });
if (browserHarnessSyntax.stdout) process.stdout.write(browserHarnessSyntax.stdout);
if (browserHarnessSyntax.stderr) process.stderr.write(browserHarnessSyntax.stderr);
assert(browserHarnessSyntax.status === 0, 'M14 browser integration harness must remain JavaScript-parser valid before ESLint/browser certification.');
assert(stageCCertify.includes("config/stage-c-m14-command-shared-ui-target.ts") && stageCCertify.includes("shared-app-ui:activate:release") && stageCCertify.includes("shared-app-ui:status"), 'Stage C certification must include M14 promotion and status.');
assert(activation.includes("['shared-app-ui:check','M14 Command Palette / Shared Application UI gate']") && activation.includes("run('release:check', 'Complete production release gate')"), 'M14 activation must run its architecture gate and the full release gate.');
assert(certEntry.includes('M10 / M11 / M12 / M13 / M14 ARCHITECTURE PREFLIGHT') && certEntry.includes('npm run stage-c:certify'), 'M14 governed certification entrypoint must exercise full Stage C certification.');
assert(certEntry.includes('GOVERNED ESLINT FAIL-FAST') && certEntry.indexOf('npm run lint:eslint') < certEntry.indexOf('npm run typecheck'), 'M14 governed certification must run ESLint before expensive type/UI/browser/build certification work.');
assert(projectVerifier.includes('verify-stage-c-m14-command-shared-ui.mjs') && projectVerifier.includes('src/app/shared-ui/SharedApplicationUI.tsx'), 'Aggregate project verification must require M14 artifacts.');
assert(architectureDoc.includes('Architecture Version 24') && architectureDoc.includes('SharedApplicationUI.tsx') && architectureDoc.includes('command-registry.ts'), 'Architecture documentation must describe M14 while preserving the command registry authority.');
assert(milestoneDoc.includes('React-owned command palette') && milestoneDoc.includes('service-worker update banner') && milestoneDoc.includes('No Supabase migration'), 'M14 documentation must record ownership and migration boundaries.');
assert(releaseStatus.includes('implementation-complete-pending-certification') && releaseStatus.includes('Architecture Version:** 24'), 'M14 release status must ship pending certification at Architecture Version 24.');
assert(runbook.includes('scripts/certify-stage-c-m14.sh') && runbook.includes('shared-app-ui:status'), 'M14 activation runbook must use the governed certification entrypoint.');
for (const [label, workflow] of [['CI', ciWorkflow], ['deploy', deployWorkflow], ['governed CI', governedCiWorkflow], ['governed deploy', governedDeployWorkflow]]) assert(workflow.includes('Stage C M14 Command Palette / Shared Application UI') && workflow.includes('npm run shared-app-ui:check'), `${label} workflow must execute the focused M14 shared application UI gate.`);
assert((governanceRestore.match(/'npm run shared-app-ui:check'/g) ?? []).length >= 2 && (governanceRestore.match(/'npm run account-settings-users:check'/g) ?? []).length >= 2, 'Governance restoration must preserve explicit M13 and M14 workflow gates in CI and deployment.');
assert(!fs.readdirSync(path.join(root, 'supabase/migrations')).some((name) => /m14|command.*palette|shared.*ui/i.test(name)), 'M14 architecture-only work must not introduce a Supabase migration.');

const execution = spawnSync(process.execPath, ['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-shared-application-ui-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M14 shared application UI execution vectors failed.');
console.log(`Stage C Milestone 14 Command Palette and Shared Application UI verification: PASS (state=${state}; architecture=${architectureVersion})`);
