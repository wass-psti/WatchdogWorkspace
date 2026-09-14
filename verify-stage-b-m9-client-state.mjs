import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const target = read('config/stage-b-m9-client-state-target.ts');
const m8Target = read('config/stage-b-m8-tanstack-query-target.ts');
const manifest = read('config/application-manifest.ts');
const manifestSchema = read('src/runtime-schemas/manifest.ts');
const manifestTypes = read('src/types/manifest.ts');
const contract = read('src/platform/contracts/client-state.ts');
const store = read('assets/js/platform/state/client-state-store.ts');
const app = read('assets/js/app.ts');
const platformServices = read('assets/js/runtime/platform-services.ts');
const compositionContract = read('src/platform/contracts/composition.ts');
const runtimeIndex = read('assets/js/runtime/index.ts');
const authorization = read('assets/js/runtime/authorization-context.ts');
const reactBridge = read('src/app/composition/useWorkManagementClientState.ts');
const architectureDoc = read('docs/architecture/ARCHITECTURE.md');
const ownershipDoc = read('docs/WORK-MANAGEMENT-CLIENT-STATE.md');
const runtimeAssets = read('config/runtime-assets.js');
const queryContract = read('src/platform/contracts/query.ts');
const queryClient = read('assets/js/platform/data/query-client.ts');
const projectVerifier = read('verify-project.sh');
const stageBCertify = read('scripts/certify-stage-b-platform.mjs');
const activation = read('scripts/activate-stage-b-m9.mjs');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const m8State = m8Target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';

assert(['blocked-pending-m8-certification','implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Unsupported M9 state: ${state}`);
assert(m8State === 'active-certified', `M9 package must inherit an active-certified M8 prerequisite; found ${m8State}`);
assert(pkg.dependencies?.zustand === '5.0.15', 'M9 must exact-pin zustand@5.0.15 as a runtime dependency.');
assert(pkg.devDependencies?.zustand === undefined, 'Zustand must not be a devDependency.');
assert(lock.packages?.['']?.dependencies?.zustand === '5.0.15', 'package-lock root must exact-pin zustand@5.0.15.');
assert(lock.packages?.['node_modules/zustand']?.version === '5.0.15', 'package-lock must resolve zustand@5.0.15.');

assert(Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0) >= 24, 'Current Stage C package must retain the M9 client-state authority at Architecture Version 24 or later.');
assert(manifest.includes("clientStateLibrary: 'zustand-v5'"), 'Manifest must declare Zustand v5 client-state authority.');
assert(manifest.includes("clientStateOwnership: 'scoped-client-state-v1'"), 'Manifest must declare scoped client-state ownership.');
assert(manifest.includes("clientState: 'assets/js/platform/state/client-state-store.ts'"), 'Manifest must declare the Work Management client-state authority.');
assert(manifestSchema.includes("clientStateLibrary: z.literal('zustand-v5')"), 'Runtime manifest schema must validate Zustand v5.');
assert(manifestSchema.includes('Architecture v19+ requires the scoped Zustand v5 client-state ownership authority.'), 'Runtime manifest schema must continue enforcing M9 at Architecture Version 19+.');
assert(manifestTypes.includes("clientStateLibrary?: 'zustand-v5'"), 'Manifest types must expose the M9 library contract.');
assert(manifestTypes.includes("clientStateOwnership?: 'scoped-client-state-v1'"), 'Manifest types must expose the M9 ownership contract.');
assert(architectureDoc.includes('Architecture Version 23') && architectureDoc.includes('Zustand'), 'Architecture documentation must describe the M9 client-state boundary.');

for (const marker of ['serverState','authenticationSession','persistentDomainState','persistentPreference','sharedClientState','featureLocalUiState','formWorkflowState','derivedState']) {
  assert(contract.includes(`${marker}: Object.freeze`), `Client-state ownership contract is missing ${marker}.`);
}
for (const authority of ['TanStack Query v5 + repositories','Work Management auth runtime + Supabase Auth','Supabase Postgres/RPC/Storage','owning feature/controller','owning form/workflow controller','selectors/computation from authoritative inputs']) {
  assert(contract.includes(authority), `Client-state ownership model is missing authority: ${authority}`);
}
assert(contract.includes("authority: 'Work Management Zustand client-state service'"), 'Shared client state must be owned by the Work Management Zustand service.');
assert(contract.includes("authority: 'explicit preference persistence adapter with client-state hydration'"), 'Persistent shell preferences must remain explicitly persisted and only hydrate the live client store.');
const ownershipDocLower = ownershipDoc.toLowerCase();
assert(ownershipDoc.includes('TanStack Query') && ownershipDoc.includes('Supabase Auth') && ownershipDocLower.includes('feature-local') && ownershipDocLower.includes('form'), 'M9 documentation must explain excluded state classes.');

assert(store.includes("from 'zustand/vanilla'"), 'M9 store authority must use the framework-neutral Zustand vanilla store.');
assert(store.includes("ZUSTAND_VERSION = '5.0.15'"), 'M9 store authority must pin the governed version marker.');
assert(store.includes('createWorkManagementClientStateService'), 'M9 must expose a scoped client-state service factory.');
assert(store.includes('workManagementClientState = createWorkManagementClientStateService()'), 'M9 must expose one page-lifetime shared client-state service.');
assert(store.includes('resetTransientShellState'), 'M9 store must define transient-session reset behavior.');
for (const forbidden of ['@tanstack/react-query','supabase','BoardRecord','board-repository','localStorage','sessionStorage']) {
  assert(!store.includes(forbidden), `Client-state store must not absorb external authority: ${forbidden}`);
}

assert(platformServices.includes('clientState:workManagementClientState'), 'Platform services must expose the page-lifetime client-state service.');
assert(compositionContract.includes('readonly clientState: WorkManagementClientStateService'), 'Platform service contract must expose client-state ownership.');
assert(runtimeIndex.includes('workManagementClientState') && runtimeIndex.includes('ZUSTAND_VERSION'), 'Runtime gateway must expose M9 client-state authority.');
assert(runtimeAssets.includes('assets/js/platform/state/client-state-store.ts'), 'M9 client-state authority must participate in the runtime asset manifest.');
assert(reactBridge.includes('useSyncExternalStore') && reactBridge.includes('workManagementClientState'), 'React bridge must consume the same page-lifetime client-state service.');

assert(app.includes('workManagementClientState.hydratePersistentShell'), 'Shell must hydrate persistent preferences into the client-state service.');
assert(app.includes('workManagementClientState.updateShellNavigation'), 'Shell navigation must mutate through the client-state service.');
assert(app.includes('workManagementClientState.setShellSection'), 'Shell section state must mutate through the client-state service.');
assert(app.includes('workManagementClientState.setShellResourceSearchQuery'), 'Shell resource search must mutate through the client-state service.');
for (const obsolete of ['let shellNavigationState','let shellNavigationWidth','let shellNavigationPinned','let shellNavigationPeek','let shellNavigationResizing','let shellMobileOpen','let shellSectionState','let shellResourceSearchQuery','let shellBoardResources','let shellBoardResourcesStatus','let shellBoardResourcesRequest']) {
  assert(!app.includes(obsolete), `Legacy shell client-state authority remains: ${obsolete}`);
}
assert(queryContract.includes('getQueryState(key: QueryKey): QueryStateSnapshot | undefined'), 'Server-state contract must expose read-only query metadata without mirroring it into client state.');
assert(queryClient.includes('nativeClient.getQueryState(toTanStackKey(key))'), 'TanStack compatibility facade must expose native query metadata for ownership-safe shell rendering.');
assert(app.includes('boardListQueryKey') && app.includes('.queryClient.getQueryData') && app.includes('.queryClient.getQueryState'), 'Shell Board resources must read server rows and query metadata from the TanStack-owned cache.');
assert(read('src/features/boards/contracts/query-keys.ts').includes('boardListQueryKey'), 'Boards must expose a stable feature query-key contract for non-React cache readers.');
assert(read('assets/js/features/boards/data/board-repository.ts').includes('boardListQueryKey(auth.user?.id, status)'), 'Board repository and shell must share the same list query-key authority.');
assert(authorization.includes('clientState?.resetTransientShellState()'), 'Authorization changes must clear transient shared client state while preserving persisted preferences.');

const boardState = read('assets/js/features/boards/board-state.ts');
const home = read('assets/js/features/home/index.ts');
assert(boardState.includes('createBoardViewState') && boardState.includes('selectedItems') && boardState.includes('inlineDraft'), 'Board interaction/editor state must remain feature-owned in M9.');
assert(home.includes("let filter = ''") && home.includes('let favoritesOnly = false'), 'Home search/filter state must remain feature-local in M9.');
assert(!boardState.includes('zustand') && !home.includes('zustand'), 'M9 must not globally migrate feature-local state to Zustand.');

const shellM2Verifier = read('verify-v1432-shell-primary-sidebar-sm2.mjs');
const shellM3Verifier = read('verify-v1432-shell-sections-resources-sm3.mjs');
const shellM4Verifier = read('verify-v1432-shell-resizing-pinning-sm4.mjs');
const shellM7Verifier = read('verify-v1432-shell-responsive-accessibility-sm7.mjs');
const shellCollapseVerifier = read('verify-v1432-shell-collapse-control-hotfix.mjs');
for (const [name, verifier] of [
  ['Shell M2', shellM2Verifier],
  ['Shell M3', shellM3Verifier],
  ['Shell M4', shellM4Verifier],
  ['Shell M7', shellM7Verifier],
  ['Shell collapse hotfix', shellCollapseVerifier],
]) {
  for (const obsolete of ['shellNavigationState}', 'shellMobileOpen', 'shellNavigationPinned}', 'shellNavigationWidth}px']) {
    assert(!verifier.includes(obsolete), `${name} verifier must not require pre-M9 shell module-state authority: ${obsolete}`);
  }
}
assert(shellM2Verifier.includes('shellNavigation().mode') && shellM2Verifier.includes('shellNavigation().mobileOpen'), 'Shell M2 verifier must validate the same navigation behavior through M9 client-state reads.');
assert(shellM3Verifier.includes('ShellSectionId') && shellM3Verifier.includes('platform/contracts/client-state.ts'), 'Shell M3 verifier must validate shared section identifiers through the M9 ownership contract.');
assert(shellM4Verifier.includes('workManagementClientState.hydratePersistentShell') && shellM4Verifier.includes('workManagementClientState.updateShellNavigation'), 'Shell M4 verifier must validate persistence and interaction behavior through M9 client-state ownership.');
assert(shellM7Verifier.includes('shellNavigation().mobileOpen'), 'Shell M7 accessibility verifier must validate modal inertness through M9 client state.');
assert(shellCollapseVerifier.includes('shellNavigation().pinned'), 'Shell collapse verifier must validate pin presentation through M9 client state.');

for (const scriptName of ['check','release:check']) {
  const script = pkg.scripts?.[scriptName] ?? '';
  const m8 = script.indexOf('npm run tanstack-query:check');
  const m9 = script.indexOf('npm run client-state:check');
  const type = script.indexOf('npm run typecheck');
  assert(m8 >= 0 && m9 > m8 && type > m9, `${scriptName} must preserve M8 -> M9 -> typecheck ordering.`);
}
assert(pkg.scripts?.['client-state:check'] === 'bash scripts/run-governed-toolchain.sh npm run client-state:check:governed', 'M9 check must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['client-state:check:governed'] === 'npm run dependencies:ensure:governed && node verify-stage-b-m9-client-state.mjs', 'M9 governed check must execute the M9 verifier after dependency preflight.');
for (const gate of ['governance:restore','dependencies:ensure','governance:check','security:check','react:check','design-system:check','governance:sync-check','corrective:check','vendor-types:check','csp-dist:check','interactions:check','runtime-schemas:check','supabase-client:check','tanstack-query:check','client-state:check','lint:eslint','typecheck']) {
  assert(activation.includes(`'${gate}'`), `M9 activation must execute ${gate}.`);
}
assert(stageBCertify.includes('client-state:activate:release'), 'Stage B certification must promote M9 after M8.');
assert(stageBCertify.includes('M9 Client-state Ownership Model: active-certified'), 'Stage B certification summary must include M9.');
for (const workflow of ['.github/workflows/ci.yml','.github/workflows/deploy-pages.yml','governance-artifacts/github/workflows/ci.yml','governance-artifacts/github/workflows/deploy-pages.yml']) {
  assert(read(workflow).includes('npm run client-state:check'), `${workflow} must execute the M9 client-state gate.`);
}
for (const file of ['src/platform/contracts/client-state.ts','assets/js/platform/state/client-state-store.ts','config/stage-b-m9-client-state-target.ts','verify-stage-b-m9-client-state.mjs']) {
  assert(projectVerifier.includes(file), `Aggregate verifier must require ${file}.`);
}

const execution = spawnSync(process.execPath, ['--experimental-strip-types','--disable-warning=ExperimentalWarning','scripts/verify-client-state-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M9 client-state execution vectors failed.');
console.log(`Stage B Milestone 9 Client-state Ownership Model verification: PASS (state=${state}; architecture=19; zustand=5.0.15)`);
