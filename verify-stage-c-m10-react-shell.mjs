import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const pkg = JSON.parse(read('package.json'));
const target = read('config/stage-c-m10-react-shell-target.ts');
const m9Target = read('config/stage-b-m9-client-state-target.ts');
const manifest = read('config/application-manifest.ts');
const manifestTypes = read('src/types/manifest.ts');
const manifestSchema = read('src/runtime-schemas/manifest.ts');
const composition = read('src/app/composition/ApplicationCompositionRoot.tsx');
const boundary = read('src/app/composition/RuntimeApplicationBoundary.tsx');
const shell = read('src/app/shell/WorkManagementShell.tsx');
const bridge = read('src/app/shell/shell-runtime-bridge.ts');
const bridgeHook = read('src/app/shell/useReactShellRuntime.ts');
const app = read('assets/js/app.ts');
const architecture = read('docs/architecture/ARCHITECTURE.md');
const doc = read('docs/WORK-MANAGEMENT-REACT-SHELL.md');
const projectVerifier = read('verify-project.sh');
const activation = read('scripts/activate-stage-c-m10.mjs');
const stageCCertify = read('scripts/certify-stage-c-platform.mjs');
const viteSmoke = read('scripts/verify-vite-server.mjs');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const m9State = m9Target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';

assert(['blocked-pending-m9-certification','implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Unsupported M10 state: ${state}`);
assert(m9State === 'active-certified', `M10 package must inherit active-certified M9; found ${m9State}`);
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
assert(architectureVersion >= 20, `M10 requires application architecture version 20 or newer; found ${architectureVersion}.`);
assert(manifest.includes("hostShell: 'src/app/shell/WorkManagementShell.tsx'"), 'Manifest must declare the React shell authority.');
assert(manifest.includes("hostShellOwnership: 'react-shell-v1'"), 'Manifest must declare React shell ownership.');
assert(manifest.includes(architectureVersion >= 43 ? "routeContentBoundary: 'runtime-route-content-island-v1'" : "routeContentBoundary: 'legacy-route-content-island-v1'"), 'Manifest must declare the current route-content compatibility island.');
assert(manifest.includes("boundary: 'src/app/shell/WorkManagementShell.tsx'"), 'Shell feature boundary must move to React.');
assert(manifestTypes.includes("hostShellOwnership?: 'react-shell-v1'"), 'Manifest types must expose React shell ownership.');
assert(manifestSchema.includes("hostShellOwnership: z.literal('react-shell-v1')"), 'Manifest schema must validate React shell ownership.');
assert(manifestSchema.includes('Architecture v20+ requires React ownership of the persistent host shell'), 'Runtime schema must enforce M10 at Architecture Version 20+.');
assert(architecture.includes('Architecture Version 21') && architecture.includes('WorkManagementShell.tsx'), 'Current architecture documentation must preserve the M10 React shell authority while Stage C advances.');

assert(composition.includes('<WorkManagementShell />'), 'React composition root must mount the React shell.');
assert(!composition.includes('<RuntimeApplicationBoundary />'), 'Composition root must no longer mount the runtime content as the top-level shell.');
for (const marker of ['data-wm-react-shell-root','data-workspace-shell','id="primarySidebar"','data-shell-nav','data-shell-navigation-mobile-toggle','data-shell-resizer','<RuntimeApplicationBoundary']) {
  assert(shell.includes(marker), `React shell is missing structural marker: ${marker}`);
}
assert(shell.includes('useWorkManagementClientState'), 'React shell must project M9 Zustand client state.');
assert(shell.includes('useReactShellRuntime'), 'React shell must consume the route-content bridge.');
assert(shell.includes('dangerouslySetInnerHTML'), 'M10 must explicitly retain the temporary dynamic resource-navigation compatibility seam.');
assert(shell.includes('inert={mobileOpen || authenticationActive') && shell.includes('managementActive'), 'React shell must preserve mobile workspace inertness while allowing later standalone React route owners to extend it.');
assert(shell.includes("{...(shellActive ? { className:"), 'Runtime route-content className must be omitted, not explicitly undefined, under exactOptionalPropertyTypes.');
assert(!shell.includes("className={shellActive ? `workspace${runtime.workspaceMode === 'module' ? ' module-workspace' : ''}` : undefined}"), 'M10 must not explicitly pass undefined to the optional RuntimeApplicationBoundary className prop.');
assert(boundary.includes('memo(RuntimeApplicationBoundaryComponent)'), 'Runtime route-content island must be memoized and page-lifetime stable.');
assert(boundary.includes('runtime-route-content'), 'Legacy boundary must identify route-content ownership rather than shell ownership.');
assert(boundary.includes('data-workspace-root'), 'Legacy boundary must become the stable React-owned workspace content host.');

for (const marker of ['showStandalone','showShell','subscribe(listener','workspaceMode','resolveReactShellRoot']) assert(bridge.includes(marker), `React shell runtime bridge missing: ${marker}`);
assert(bridgeHook.includes('useSyncExternalStore') && bridgeHook.includes('reactShellRuntime'), 'React shell bridge hook must use the same page-lifetime runtime snapshot.');
assert(app.includes("from '../../src/app/shell/shell-runtime-bridge.ts'"), 'Runtime content host must consume the M10 shell bridge.');
assert(app.includes('publishReactShell('), 'Legacy route runtime must publish shell presentation inputs to React.');
assert(app.includes('reactShellRuntime.showStandalone(view)') && app.includes("showStandaloneAuthentication('login')"), 'Authentication routes must explicitly leave persistent shell mode through the current standalone route bridge.');
assert(app.includes("const workspace = app;"), 'Legacy route rendering must target the stable content island directly.');
assert(!app.includes("app.innerHTML = shell('', active)"), 'Runtime content must not create the persistent shell at runtime.');
assert(architectureVersion >= 43 ? !app.includes('function shell(') : app.includes('function shell('), architectureVersion >= 43 ? 'M35 must delete the inert historical shell serializer.' : 'Historical shell serializer remains inert for compatibility verifier continuity during M10.');
assert(app.includes("reactShellRoot.addEventListener('click'"), 'Existing interaction delegation must be rebound to the React-owned shell root.');
assert(app.includes("reactShellRoot.addEventListener('pointerdown'"), 'React shell root must preserve resize pointer delegation.');
assert(app.includes("reactShellRoot.addEventListener('focusin'"), 'React shell root must preserve sidebar focus/peek delegation.');
const m4Verifier = read('verify-stage-b-m4-react-design-system.mjs');
assert(m4Verifier.includes("composition.includes('<WorkManagementShell />')") && m4Verifier.includes("reactShell.includes('<RuntimeApplicationBoundary')"), 'M4 verifier must recognize the M10 provider -> React shell -> runtime route-content hierarchy.');
const shellM4Verifier = read('verify-v1432-shell-resizing-pinning-sm4.mjs');
for (const event of ['dblclick','pointerover','pointerout','focusin','focusout']) {
  assert(shellM4Verifier.includes(`reactShellRoot.addEventListener('${event}'`), `Shell M4 verifier must follow M10 React shell event ownership for ${event}.`);
}
assert(doc.includes('temporary compatibility') && doc.includes('dynamic resource navigation'), 'M10 documentation must disclose the temporary navigation-markup bridge.');
assert(viteSmoke.includes('Stage C M10 browser ownership contract'), 'Vite dev/preview smoke must execute the M10 browser ownership contract.');
for (const marker of ['data-wm-react-shell-root','data-wm-runtime-host','data-wm-react-shell-layout','data-wm-react-shell-mode','data-wm-composition-owner']) {
  assert(viteSmoke.includes(marker), `M10 browser smoke is missing ownership marker: ${marker}`);
}
assert(viteSmoke.includes('countElementsWithAttribute'), 'M10 browser smoke must count live element attributes instead of raw serialized text occurrences.');
for (const marker of ['data-wm-react-shell-root','data-wm-runtime-host','data-wm-react-shell-layout','data-workspace-shell']) {
  assert(viteSmoke.includes(`countElementsWithAttribute(dom, '${marker}')`), `M10 browser smoke must use element-aware ownership counting for ${marker}.`);
}
for (const [marker, value] of [['data-wm-react-shell-mode','standalone'],['data-wm-composition-owner','runtime-route-content']]) {
  assert(viteSmoke.includes(`countElementsWithAttribute(dom, '${marker}', '${value}')`), `M10 browser smoke must use element-aware attribute/value matching for ${marker}=${value}.`);
}
for (const stalePattern of ['dom.match(/data-wm-runtime-host','/data-workspace-shell(?:=\"\")?/.test(dom)','/data-wm-react-shell-mode=\"standalone\"/.test(dom)','/data-wm-composition-owner=\"runtime-route-content\"/.test(dom)']) {
  assert(!viteSmoke.includes(stalePattern), `M10 browser smoke must not raw-scan serialized DOM ownership text: ${stalePattern}`);
}

for (const scriptName of ['check','release:check']) {
  const script = pkg.scripts?.[scriptName] ?? '';
  const m9 = script.indexOf('npm run client-state:check');
  const m10 = script.indexOf('npm run react-shell:check');
  const type = script.indexOf('npm run typecheck');
  assert(m9 >= 0 && m10 > m9 && type > m10, `${scriptName} must preserve M9 -> M10 -> typecheck ordering.`);
}
assert(pkg.scripts?.['react-shell:check'] === 'bash scripts/run-governed-toolchain.sh npm run react-shell:check:governed', 'M10 check must use governed toolchain dispatch.');
assert(pkg.scripts?.['react-shell:check:governed'] === 'npm run dependencies:ensure:governed && node verify-stage-c-m10-react-shell.mjs', 'M10 governed check must execute the milestone verifier.');
for (const gate of ['governance:restore','dependencies:ensure','governance:check','security:check','react:check','design-system:check','governance:sync-check','interactions:check','runtime-schemas:check','supabase-client:check','tanstack-query:check','client-state:check','react-shell:check','lint:eslint','typecheck']) {
  assert(activation.includes(`'${gate}'`), `M10 activation must execute ${gate}.`);
}
assert(stageCCertify.includes('react-shell:activate:release'), 'Stage C certification must promote M10.');
assert(stageCCertify.includes('M10 React Shell: active-certified'), 'Stage C certification summary must include M10.');
for (const workflow of ['.github/workflows/ci.yml','.github/workflows/deploy-pages.yml','governance-artifacts/github/workflows/ci.yml','governance-artifacts/github/workflows/deploy-pages.yml']) {
  assert(read(workflow).includes('npm run react-shell:check'), `${workflow} must execute the M10 React shell gate.`);
}
for (const file of ['src/app/shell/WorkManagementShell.tsx','src/app/shell/shell-runtime-bridge.ts','config/stage-c-m10-react-shell-target.ts','verify-stage-c-m10-react-shell.mjs']) {
  assert(projectVerifier.includes(file), `Aggregate verifier must require ${file}.`);
}

const execution = spawnSync(process.execPath, ['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-react-shell-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M10 React shell runtime-bridge execution vectors failed.');
console.log(`Stage C Milestone 10 React Shell verification: PASS (state=${state}; architecture=20)`);
