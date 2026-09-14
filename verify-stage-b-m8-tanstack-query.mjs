import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const required = [
  'config/stage-b-m8-tanstack-query-target.ts',
  'assets/js/platform/data/tanstack-query-client.ts',
  'assets/js/platform/data/query-client.ts',
  'src/app/composition/WorkManagementQueryProvider.tsx',
  'scripts/report-stage-b-m8.mjs',
  'scripts/activate-stage-b-m8.mjs',
  'scripts/verify-tanstack-query-execution.mjs',
  'docs/WORK-MANAGEMENT-TANSTACK-QUERY.md',
  'M8-ACTIVATION-RUNBOOK.md',
  'RELEASE-STATUS-v1.43.2-STAGE-B-M8-TANSTACK-QUERY.md',
];
for (const file of required) assert(fs.existsSync(path.join(root, file)) && fs.statSync(path.join(root, file)).size > 0, `Missing M8 artifact: ${file}`);

const pkg = json('package.json');
const lock = json('package-lock.json');
const target = read('config/stage-b-m8-tanstack-query-target.ts');
const m7Target = read('config/stage-b-m7-supabase-client-target.ts');
const manifest = read('config/application-manifest.ts');
const manifestSchema = read('src/runtime-schemas/manifest.ts');
const manifestTypes = read('src/types/manifest.ts');
const queryContract = read('src/platform/contracts/query.ts');
const queryFacade = read('assets/js/platform/data/query-client.ts');
const nativeClient = read('assets/js/platform/data/tanstack-query-client.ts');
const provider = read('src/app/composition/WorkManagementQueryProvider.tsx');
const rootComponent = read('src/app/composition/ApplicationCompositionRoot.tsx');
const platformServices = read('assets/js/runtime/platform-services.ts');
const boardRepo = read('assets/js/features/boards/data/board-repository.ts');
const authorization = read('assets/js/runtime/authorization-context.ts');
const runtimeIndex = read('assets/js/runtime/index.ts');
const runtimeAssets = read('config/runtime-assets.js');
const architectureDoc = read('docs/architecture/ARCHITECTURE.md');
const thirdParty = read('THIRD_PARTY_NOTICES.md');
const stageBCertify = read('scripts/certify-stage-b-platform.mjs');
const activation = read('scripts/activate-stage-b-m8.mjs');
const projectVerifier = read('verify-project.sh');
const m4Verifier = read('verify-stage-b-m4-react-design-system.mjs');
const historicalViteVerifier = read('verify-v1360-vite-migration.mjs');
const historicalPlatformVerifier = read('verify-v1350-platform-architecture.mjs');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const m7State = m7Target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';

assert(['blocked-pending-m7-certification','implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Unsupported M8 state: ${state}`);
assert(m7State === 'active-certified', `M8 package must inherit an active-certified M7 prerequisite; found ${m7State}`);
assert(pkg.dependencies?.['@tanstack/react-query'] === '5.102.8', 'M8 must exact-pin @tanstack/react-query@5.102.8.');
assert(lock.packages?.['']?.dependencies?.['@tanstack/react-query'] === '5.102.8', 'package-lock root must exact-pin @tanstack/react-query@5.102.8.');
assert(lock.packages?.['node_modules/@tanstack/react-query']?.version === '5.102.8', 'package-lock must resolve @tanstack/react-query@5.102.8.');
assert(lock.packages?.['node_modules/@tanstack/react-query']?.dependencies?.['@tanstack/query-core'] === '5.102.8', 'React Query lock entry must resolve exact @tanstack/query-core@5.102.8.');
assert(lock.packages?.['node_modules/@tanstack/query-core']?.version === '5.102.8', 'package-lock must resolve @tanstack/query-core@5.102.8.');

assert(Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0) >= 24, 'Current Stage C package must retain the M8 TanStack Query authority at Architecture Version 24 or later.');
assert(manifest.includes("serverStateLibrary: 'tanstack-query-v5'"), 'Manifest must declare TanStack Query v5 server-state authority.');
assert(manifestSchema.includes("serverStateLibrary: z.literal('tanstack-query-v5')"), 'Runtime manifest schema must validate the M8 server-state authority.');
assert(manifestSchema.includes('Architecture v18+ requires TanStack Query v5 as the server-state authority.'), 'Runtime manifest schema must continue enforcing M8 at Architecture Version 18+.');
assert(manifestTypes.includes("serverStateLibrary?: 'tanstack-query-v5'"), 'Manifest types must expose the M8 architecture contract.');
assert(architectureDoc.includes('Architecture Version 23') && architectureDoc.includes('TanStack Query'), 'Architecture documentation must describe the M8 server-state boundary.');

for (const token of ['QueryClient as TanStackQueryClient','MutationObserver','hashKey','nativeClient.fetchQuery','nativeClient.invalidateQueries','nativeClient.removeQueries','nativeClient.getQueryCache','observer.mutate']) {
  assert(queryFacade.includes(token), `M8 compatibility facade is missing TanStack Query ownership marker: ${token}`);
}
assert(!queryFacade.includes('new Map<string, QueryCacheEntry>()'), 'M8 must remove the project-owned Map cache engine.');
assert(!queryFacade.includes('interface QueryCacheEntry'), 'M8 must remove the legacy cache-entry authority.');
assert(!queryFacade.includes('createTanStackQueryClient({ defaultStaleTime: options.defaultStaleTime })'), 'M8 compatibility facade must not pass an explicitly undefined optional stale-time property under exactOptionalPropertyTypes.');
assert(queryFacade.includes('options.defaultStaleTime === undefined') && queryFacade.includes('? {}') && queryFacade.includes(': { defaultStaleTime: options.defaultStaleTime }'), 'M8 compatibility facade must omit defaultStaleTime when the option is undefined.');
assert(queryContract.includes('signal: AbortSignal'), 'M8 query contract must surface TanStack cancellation signals to repository query functions.');
for (const marker of [
  'matchesWorkManagementPrefix',
  "Promise.resolve().then(() => {",
  "mutationFn: async (input) => mutation.mutationFn(input)",
  "predicate, refetchType: 'none'",
  "if (isFresh) return currentData",
]) {
  assert(queryFacade.includes(marker), `M8 compatibility facade is missing preserved pre-M8 behavior: ${marker}`);
}
const executionVerifier = read('scripts/verify-tanstack-query-execution.mjs');
for (const marker of [
  'pre-M8 query-function microtask boundary',
  'deduplicated followers must not emit duplicate compatibility success events',
  'fresh cache reads must preserve pre-M8 no-event behavior',
  'M8 prefix invalidation must not widen object-key scope',
  'mutationFn: (input) => input.toUpperCase()',
]) {
  assert(executionVerifier.includes(marker), `M8 execution verifier is missing compatibility regression coverage: ${marker}`);
}

assert(nativeClient.includes("TANSTACK_QUERY_VERSION = '5.102.8'"), 'Native query authority must pin the governed TanStack Query version marker.');
assert(nativeClient.includes('new TanStackQueryClient'), 'Native query authority must construct TanStack QueryClient.');
for (const policy of ['retry: false','refetchOnMount: false','refetchOnReconnect: false','refetchOnWindowFocus: false']) {
  assert(nativeClient.includes(policy), `Native query client must preserve compatibility policy: ${policy}`);
}
assert(provider.includes("from '@tanstack/react-query'"), 'React provider must use @tanstack/react-query.');
assert(provider.includes('QueryClientProvider') && provider.includes('workManagementTanStackQueryClient'), 'React provider must mount the page-lifetime Work Management query client.');
assert(rootComponent.includes('<WorkManagementQueryProvider>') && rootComponent.indexOf('<WorkManagementQueryProvider>') < rootComponent.indexOf('<WorkManagementDesignSystemProvider>'), 'TanStack Query provider must wrap the current React composition boundary.');
assert(platformServices.includes('workManagementTanStackQueryClient'), 'Platform services must consume the same page-lifetime native QueryClient as React.');
assert(platformServices.includes('createQueryClient({diagnostics,defaultStaleTime:options.queryStaleTime??10_000},workManagementTanStackQueryClient)'), 'Platform services must inject the shared native QueryClient into the legacy compatibility facade.');
assert(boardRepo.includes('queries.fetchQuery') && boardRepo.includes('queries.mutate'), 'Board repository must retain server-state access through the Work Management facade during M8.');
assert(authorization.includes('serverState.clear()'), 'Authorization reconciliation must continue clearing shared server state across session/role changes.');
assert(runtimeIndex.includes('createTanStackQueryClient') && runtimeIndex.includes('workManagementTanStackQueryClient'), 'Runtime gateway must expose M8 query authority.');
assert(runtimeAssets.includes('assets/js/platform/data/tanstack-query-client.ts'), 'M8 native query authority must participate in the runtime asset manifest.');
assert(thirdParty.includes('@tanstack/react-query 5.102.8') && thirdParty.includes('@tanstack/query-core 5.102.8'), 'Third-party notices must record M8 runtime dependencies.');

assert(m4Verifier.includes("config/stage-b-m8-tanstack-query-target.ts"), 'M4 verifier must recognize legitimate M8 TanStack Query ownership.');
assert(m4Verifier.includes("Direct @tanstack/react-query ownership must match the exact governed M8 target."), 'M4 verifier must exact-govern the M8 TanStack Query dependency rather than unconditionally forbid it.');
const m4ForbiddenBlock = m4Verifier.match(/const forbiddenDirectDependencies = \[([\s\S]*?)\];/)?.[1] ?? '';
assert(!m4ForbiddenBlock.includes("'@tanstack/react-query'"), 'M4 later-milestone denylist must not reject the M8-governed TanStack Query dependency.');

assert(historicalViteVerifier.includes('applicationManifest.architectureVersion >= 24'), 'Historical Vite verifier must accept Architecture Version 24+ while preserving the Vite migration floor.');
assert(historicalPlatformVerifier.includes('applicationManifest.architectureVersion>=24'), 'Historical platform verifier must accept Architecture Version 24+ while preserving the platform boundary.');
for (const verifier of fs.readdirSync(root).filter((name) => /^verify.*\.mjs$/.test(name))) {
  if (verifier === 'verify-stage-b-m8-tanstack-query.mjs' || verifier === 'verify-stage-b-m7-supabase-client-adapter.mjs') continue;
  const source = read(verifier);
  assert(!source.includes('architectureVersion: 17'), `${verifier} still pins pre-M8 Architecture Version 17.`);
  assert(!source.includes('architectureVersion,17'), `${verifier} still pins pre-M8 Architecture Version 17.`);
  assert(!source.includes('architectureVersion, 17'), `${verifier} still pins pre-M8 Architecture Version 17.`);
}

for (const scriptName of ['check','release:check']) {
  const script = pkg.scripts?.[scriptName] ?? '';
  const m7 = script.indexOf('npm run supabase-client:check');
  const m8 = script.indexOf('npm run tanstack-query:check');
  const type = script.indexOf('npm run typecheck');
  assert(m7 >= 0 && m8 > m7 && type > m8, `${scriptName} must preserve M7 -> M8 -> typecheck ordering.`);
}
assert(pkg.scripts?.['tanstack-query:check'] === 'bash scripts/run-governed-toolchain.sh npm run tanstack-query:check:governed', 'M8 check must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['tanstack-query:check:governed'] === 'npm run dependencies:ensure:governed && node verify-stage-b-m8-tanstack-query.mjs', 'M8 governed check must execute the M8 verifier after dependency preflight; the verifier owns executable vectors.');
assert(pkg.scripts?.['tanstack-query:status'] === 'bash scripts/run-governed-toolchain.sh npm run tanstack-query:status:governed', 'M8 status must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['tanstack-query:activate'] === 'bash scripts/run-governed-toolchain.sh npm run tanstack-query:activate:governed', 'M8 activation must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['tanstack-query:activate:release'] === 'bash scripts/run-governed-toolchain.sh npm run tanstack-query:activate:release:governed', 'M8 release activation must enter through the governed toolchain dispatcher.');
for (const gate of ['governance:check','security:check','react:check','design-system:check','interactions:check','runtime-schemas:check','supabase-client:check','tanstack-query:check','lint:eslint','typecheck']) {
  assert(activation.includes(`'${gate}'`), `M8 activation must execute ${gate}.`);
}
assert(stageBCertify.includes('tanstack-query:activate:release'), 'Stage B certification must promote M8 after M7.');
assert(stageBCertify.includes('M8 TanStack Query Migration: active-certified'), 'Stage B certification summary must include M8.');

for (const workflow of ['.github/workflows/ci.yml','.github/workflows/deploy-pages.yml','governance-artifacts/github/workflows/ci.yml','governance-artifacts/github/workflows/deploy-pages.yml']) {
  assert(read(workflow).includes('npm run tanstack-query:check'), `${workflow} must execute the M8 TanStack Query gate.`);
}
for (const file of required.slice(0, 6)) assert(projectVerifier.includes(file), `Aggregate verifier must require ${file}.`);

const execution = spawnSync(process.execPath, ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', 'scripts/verify-tanstack-query-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M8 TanStack Query execution vectors failed.');

console.log(`Stage B Milestone 8 TanStack Query Migration verification: PASS (state=${state}; architecture=19; tanstack=5.102.8)`);
