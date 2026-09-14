import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const required = [
  'config/stage-b-m7-supabase-client-target.ts',
  'src/platform/contracts/supabase-client.ts',
  'assets/js/platform/data/supabase-client-adapter.ts',
  'scripts/report-stage-b-m7.mjs',
  'scripts/activate-stage-b-m7.mjs',
  'scripts/verify-supabase-client-adapter-execution.mjs',
  'docs/WORK-MANAGEMENT-SUPABASE-CLIENT-ADAPTER.md',
  'M7-ACTIVATION-RUNBOOK.md',
  'RELEASE-STATUS-v1.43.2-STAGE-B-M7-SUPABASE-CLIENT-ADAPTER.md',
];
for (const file of required) assert(fs.existsSync(path.join(root, file)) && fs.statSync(path.join(root, file)).size > 0, `Missing M7 artifact: ${file}`);

const pkg = json('package.json');
const target = read('config/stage-b-m7-supabase-client-target.ts');
const manifest = read('config/application-manifest.ts');
const manifestSchema = read('src/runtime-schemas/manifest.ts');
const manifestTypes = read('src/types/manifest.ts');
const platformTypeTests = read('tests/types/platform-contracts.type-test.ts');
const architectureDoc = read('docs/architecture/ARCHITECTURE.md');
const adapter = read('assets/js/platform/data/supabase-client-adapter.ts');
const auth = read('assets/js/core/auth.ts');
const backend = read('assets/js/platform/data/backend-client.ts');
const boardRepo = read('assets/js/features/boards/data/board-repository.ts');
const transport = read('src/platform/contracts/transport.ts');
const composition = read('src/platform/contracts/composition.ts');
const platformServices = read('assets/js/runtime/platform-services.ts');
const stageBCertify = read('scripts/certify-stage-b-platform.mjs');
const activation = read('scripts/activate-stage-b-m7.mjs');
const historicalViteVerifier = read('verify-v1360-vite-migration.mjs');
const historicalPlatformVerifier = read('verify-v1350-platform-architecture.mjs');
const historicalItemWorkspaceVerifier = read('verify-v1216-item-workspace.mjs');
const state = target.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';

assert(['blocked-pending-m6-certification','implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Unsupported M7 state: ${state}`);
assert(Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0) >= 24, 'Current architecture must retain the M7 Supabase adapter while Stage C advances beyond Architecture Version 23.');
assert(manifest.includes("supabaseClientAdapter: 'work-management-supabase-client-adapter-v1'"), 'Manifest must declare the M7 Supabase adapter authority.');
assert(manifestSchema.includes("supabaseClientAdapter: z.literal('work-management-supabase-client-adapter-v1')"), 'Runtime manifest schema must validate the M7 adapter authority.');
assert(manifestTypes.includes("supabaseClientAdapter?: 'work-management-supabase-client-adapter-v1'"), 'Manifest types must expose the M7 architecture contract.');
assert(platformTypeTests.includes('SupabaseClientAdapter') && platformTypeTests.includes('supabase.rpc'), 'Strict platform type tests must cover the M7 adapter contract.');
assert(architectureDoc.includes('supabase-client-adapter.ts'), 'Architecture documentation must retain the M7 adapter boundary.');
assert(historicalViteVerifier.includes('applicationManifest.architectureVersion >= 24'), 'Historical Vite verifier must accept the current Architecture Version 24+ while preserving the Vite migration floor.');
assert(!historicalViteVerifier.includes('architectureVersion, 17'), 'Historical Vite verifier must not remain pinned to the pre-M8 Architecture Version 17.');
assert(historicalPlatformVerifier.includes('applicationManifest.architectureVersion>=24'), 'Historical platform verifier must accept the current Architecture Version 24+ while preserving the platform boundary.');
assert(!historicalPlatformVerifier.includes("architectureVersion,17"), 'Historical platform verifier must not remain pinned to the pre-M8 Architecture Version 17.');
assert(historicalPlatformVerifier.includes("auth.supabase.rpc") && historicalPlatformVerifier.includes("supabase-client-adapter.ts"), 'M7 must synchronize the historical platform verifier with the Supabase adapter transport seam.');
assert(!historicalPlatformVerifier.includes("backend.includes('/rest/v1/rpc/${name}')"), 'M7 must not leave raw provider URL ownership on backend-client.ts.');
assert(historicalItemWorkspaceVerifier.includes("supabase-client-adapter.ts"), 'M7 must keep the historical Item Workspace signed-file verifier aligned with adapter-owned Storage URLs.');

for (const token of ['assertRelativeApiPath','ALLOWED_API_PREFIXES','createRequestSignal','SupabaseClientAdapterError','resolveStorageSignedUrl','storageUpload','storageDelete','storageSign','health']) {
  assert(adapter.includes(token), `Supabase adapter is missing required boundary: ${token}`);
}
assert(adapter.includes("/^https:\\\/\\\\/[A-Za-z0-9.-]+\\\\.supabase\\\\.co$/i") || adapter.includes("/^https:\\/\\/[A-Za-z0-9.-]+\\.supabase\\.co$/i"), 'Supabase adapter must constrain project URLs to HTTPS *.supabase.co.');
assert(auth.includes("createSupabaseClientAdapter"), 'AuthManager must consume the M7 adapter factory.');
assert(auth.includes('get supabase(): SupabaseClientAdapter'), 'AuthManager must expose the authoritative adapter instance.');
assert(auth.includes('return this.supabase.request<T>'), 'AuthManager HTTP requests must delegate to the M7 adapter.');
assert(auth.includes('this.supabase.health()'), 'Auth diagnostics must use the M7 adapter health boundary.');
assert(!auth.includes('fetch(`${supabaseUrl}${path}`'), 'AuthManager must not retain direct Supabase fetch authority.');
assert(backend.includes('auth.supabase.rpc'), 'Backend RPC must delegate to the M7 adapter.');
assert(backend.includes('auth.supabase.storageUpload') && backend.includes('auth.supabase.storageDelete') && backend.includes('auth.supabase.storageSign'), 'Backend private Storage operations must delegate to the M7 adapter.');
assert(!backend.includes('fetch('), 'Backend client must not issue direct Supabase fetch requests after M7.');
assert(boardRepo.includes('auth.supabase.resolveStorageSignedUrl'), 'Board attachment signed URLs must be resolved by the M7 adapter.');
const runtimeAssets = read('config/runtime-assets.js');
assert(runtimeAssets.includes('assets/js/platform/data/supabase-client-adapter.ts'), 'The Supabase adapter must participate in the authoritative runtime asset manifest.');
const restoreGovernance = read('scripts/restore-required-repository-artifacts.mjs');
assert(restoreGovernance.includes("'npm run supabase-client:check'"), 'Governance restoration must detect stale workflows that omit the M7 gate.');
const bootstrapVerifier = read('verify-stage-b-bootstrap-resilience.mjs');
assert(bootstrapVerifier.includes('supabase-client:activate:release') && bootstrapVerifier.includes('npm run supabase-client:check'), 'Bootstrap resilience must protect M7 certification and workflow participation.');
const toolchainVerifier = read('verify-stage-b-governed-toolchain-dispatch.mjs');
assert(toolchainVerifier.includes("'supabase-client:check'") && toolchainVerifier.includes("'supabase-client:activate:release'"), 'Governed toolchain regression must cover M7 public entry points.');
assert(transport.includes('readonly supabase: SupabaseClientAdapter'), 'Auth transport port must expose the adapter authority.');
assert(composition.includes('readonly supabase: SupabaseClientAdapter'), 'Platform service composition must expose the adapter internally.');
assert(platformServices.includes('const supabase=auth.supabase'), 'Platform services must compose the same adapter instance owned by auth.');

const walk = (directory) => {
  const absolute = path.join(root, directory);
  const files = [];
  if (!fs.existsSync(absolute)) return files;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(relative));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(relative);
  }
  return files;
};
for (const file of [...walk('assets/js'), ...walk('src'), ...walk('config')]) {
  if (file === 'assets/js/platform/data/supabase-client-adapter.ts') continue;
  const source = read(file);
  const directSupabaseFetch = /fetch\s*\(\s*`?\$?\{?[^\n]*(?:supabaseUrl|\/auth\/v1|\/rest\/v1|\/storage\/v1)/.test(source);
  assert(!directSupabaseFetch, `Direct Supabase fetch authority leaked outside the M7 adapter: ${file}`);
}

for (const scriptName of ['check','release:check']) {
  const script = pkg.scripts?.[scriptName] ?? '';
  const m6 = script.indexOf('npm run runtime-schemas:check');
  const m7 = script.indexOf('npm run supabase-client:check');
  const type = script.indexOf('npm run typecheck');
  assert(m6 >= 0 && m7 > m6 && type > m7, `${scriptName} must preserve M6 -> M7 -> typecheck ordering.`);
}
assert(pkg.scripts?.['supabase-client:check'] === 'bash scripts/run-governed-toolchain.sh npm run supabase-client:check:governed', 'M7 check must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['supabase-client:check:governed'] === 'node verify-stage-b-m7-supabase-client-adapter.mjs', 'M7 governed check implementation must execute the M7 verifier.');
assert(pkg.scripts?.['supabase-client:status'] === 'bash scripts/run-governed-toolchain.sh npm run supabase-client:status:governed', 'M7 status must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['supabase-client:status:governed'] === 'node scripts/report-stage-b-m7.mjs', 'M7 governed status implementation must remain stable.');
assert(pkg.scripts?.['supabase-client:activate'] === 'bash scripts/run-governed-toolchain.sh npm run supabase-client:activate:governed', 'M7 activation must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['supabase-client:activate:governed'] === 'node scripts/activate-stage-b-m7.mjs', 'M7 governed activation implementation must remain stable.');
assert(pkg.scripts?.['supabase-client:activate:release'] === 'bash scripts/run-governed-toolchain.sh npm run supabase-client:activate:release:governed', 'M7 release activation must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['supabase-client:activate:release:governed'] === 'node scripts/activate-stage-b-m7.mjs --release', 'M7 governed release activation implementation must remain stable.');
for (const gate of ['governance:check','security:check','react:check','design-system:check','interactions:check','runtime-schemas:check','supabase-client:check','lint:eslint','typecheck']) {
  assert(activation.includes(`'${gate}'`), `M7 activation must execute ${gate}.`);
}
assert(stageBCertify.includes('supabase-client:activate:release'), 'Stage B certification must promote M7 after M6.');
assert(stageBCertify.includes('M7 Supabase Client Adapter: active-certified'), 'Stage B certification summary must include M7.');

for (const workflow of ['.github/workflows/ci.yml','.github/workflows/deploy-pages.yml']) {
  assert(read(workflow).includes('npm run supabase-client:check'), `${workflow} must execute the M7 adapter gate.`);
}
const projectVerifier = read('verify-project.sh');
for (const file of ['config/stage-b-m7-supabase-client-target.ts','src/platform/contracts/supabase-client.ts','assets/js/platform/data/supabase-client-adapter.ts','verify-stage-b-m7-supabase-client-adapter.mjs']) {
  assert(projectVerifier.includes(file), `Aggregate verifier must require ${file}.`);
}

const execution = spawnSync(process.execPath, ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', 'scripts/verify-supabase-client-adapter-execution.mjs'], { cwd: root, encoding: 'utf8' });
if (execution.stdout) process.stdout.write(execution.stdout);
if (execution.stderr) process.stderr.write(execution.stderr);
assert(execution.status === 0, 'M7 Supabase adapter execution vectors failed.');

console.log(`Stage B Milestone 7 Supabase Client Adapter verification: PASS (state=${state}; architecture=19)`);
