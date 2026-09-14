import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const requireFile = (file) => assert(fs.existsSync(path.join(root, file)), `Missing M6 file: ${file}`);

const required = [
  'config/stage-b-m6-runtime-schema-target.ts',
  'src/runtime-schemas/primitives.ts',
  'src/runtime-schemas/modules.ts',
  'src/runtime-schemas/auth.ts',
  'src/runtime-schemas/persistence.ts',
  'src/runtime-schemas/module-messages.ts',
  'src/runtime-schemas/manifest.ts',
  'src/runtime-schemas/runtime.ts',
  'src/runtime-schemas/index.ts',
  'scripts/report-stage-b-m6.mjs',
  'scripts/activate-stage-b-m6.mjs',
  'scripts/verify-runtime-schema-execution.mjs',
  'scripts/verify-browser-harness-bundle.mjs',
  'tests/browser/build-runtime-bundle.mjs',
  'tests/browser/runtime-globals-entry.ts',
  'docs/WORK-MANAGEMENT-RUNTIME-SCHEMAS.md',
  'RELEASE-STATUS-v1.43.2-STAGE-B-M6-RUNTIME-SCHEMAS.md',
  'M6-ACTIVATION-RUNBOOK.md',
];
required.forEach(requireFile);

const target = read('config/stage-b-m6-runtime-schema-target.ts');
const m5Target = read('config/stage-b-m5-interaction-target.ts');
const pkg = json('package.json');
const lock = json('package-lock.json');
const manifest = read('config/application-manifest.ts');
const manifestTypes = read('src/types/manifest.ts');
const moduleConfig = read('config/modules.ts');
const cloudModuleData = read('assets/js/core/cloud-module-data.ts');
const identityBridge = read('assets/js/core/module-identity-bridge.ts');
const moduleHost = read('assets/js/runtime/module-host.ts');
const moduleLifecycle = read('assets/js/runtime/module-lifecycle.ts');
const routeController = read('assets/js/runtime/route-controller.ts');
const runtimeClient = read('assets/js/runtime/work-management-client.ts');
const moduleCloudStore = read('assets/js/core/module-cloud-store.ts');
const permissions = read('assets/js/platform/auth/permissions.ts');
const schemaIndex = read('src/runtime-schemas/index.ts');
const activation = read('scripts/activate-stage-b-m6.mjs');
const stageBCertify = read('scripts/certify-stage-b-platform.mjs');
const browserRunner = read('tests/browser/run-cdp.mjs');
const browserBundleBuilder = read('tests/browser/build-runtime-bundle.mjs');
const browserRuntimeEntry = read('tests/browser/runtime-globals-entry.ts');
const rootLock = lock.packages?.[''] ?? {};

const state = target.match(/activationState:\s*'([^']+)'/)?.[1];
const m5State = m5Target.match(/activationState:\s*'([^']+)'/)?.[1];
assert(state, 'M6 activation state must be declared.');
assert(m5State === 'active-certified', 'M6 baseline requires the uploaded certified M5 state.');
assert(target.includes("prerequisite: 'stage-b-m5:active-certified'"), 'M6 must explicitly require M5 certification.');
assert(target.includes("zod: '4.5.4'"), 'M6 must exact-pin Zod 4.5.4.');
assert(['dependencies-installed-pending-certification','active-pending-release-certification','active-certified'].includes(state), `Unsupported M6 state: ${state}`);

assert(pkg.dependencies?.zod === '4.5.4', 'package.json must exact-pin zod@4.5.4.');
assert(rootLock.dependencies?.zod === '4.5.4', 'package-lock root must exact-pin zod@4.5.4.');
const zodLock = lock.packages?.['node_modules/zod'];
assert(zodLock?.version === '4.5.4', 'package-lock must resolve zod@4.5.4.');
assert(zodLock?.resolved === 'https://registry.npmjs.org/zod/-/zod-4.5.4.tgz', 'Zod must resolve from the governed npm registry.');
assert(zodLock?.integrity === 'sha512-sC95tT5iHHH9gtpj6A81kh+NEaRAUFN+qlUPDUbRfOMvNf5QCBqsb3WgvnpVtK5Y+4UfA6KqufotuTvMGiTlsA==', 'Zod lock integrity must remain exact.');

for (const file of ['primitives.ts','modules.ts','auth.ts','persistence.ts','module-messages.ts','manifest.ts','runtime.ts']) {
  assert(read(`src/runtime-schemas/${file}`).includes("from 'zod'"), `${file} must use the governed Zod implementation.`);
}
for (const exportName of ['moduleDataRequestSchema','embeddedModuleIdentityContextSchema','applicationManifestSchema','workManagementModulesSchema','moduleStateRowSchema']) {
  assert(schemaIndex.includes(`'./`) || schemaIndex.includes('export *'), 'M6 schema barrel must publish the Work Management schema authority.');
  assert(required.some((file) => file.startsWith('src/runtime-schemas/')), `M6 schema file inventory missing for ${exportName}.`);
}

function walk(directory) {
  const absolute = path.join(root, directory);
  const out = [];
  if (!fs.existsSync(absolute)) return out;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...walk(relative));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) out.push(relative);
  }
  return out;
}
for (const file of [...walk('src'), ...walk('assets/js'), ...walk('config')]) {
  const source = read(file);
  if (source.includes("from 'zod'") || source.includes('from "zod"')) {
    assert(file.startsWith(`src${path.sep}runtime-schemas${path.sep}`), `Zod leaked outside the Work Management runtime-schema authority: ${file}`);
  }
}

const architectureMatch = manifest.match(/architectureVersion:\s*(\d+)/);
assert(Number(architectureMatch?.[1] ?? 0) >= 16, 'M6 requires application architecture version 16 or later.');
assert(manifest.includes("runtimeSchemas: 'zod-4-work-management-authority'"), 'Application manifest must identify the M6 schema authority.');
assert(manifestTypes.includes("runtimeSchemas?: 'zod-4-work-management-authority'"), 'Manifest types must expose the M6 architecture contract.');
assert(manifest.includes('applicationManifestSchema.safeParse'), 'Application manifest runtime validation must pass through the M6 schema authority.');
assert(moduleConfig.includes('workManagementModulesSchema.parse'), 'Module definitions must be runtime-validated at configuration load.');
assert(cloudModuleData.includes('moduleDataEnvelopeSchema.safeParse'), 'Module data envelope must use the M6 runtime schema before boundary authorization.');
assert(cloudModuleData.includes('moduleDataRequestSchema.safeParse'), 'Module data protocol must use the M6 runtime schema.');
assert(!/\brecordOf\s*\(/.test(cloudModuleData), 'Retired recordOf helper must not remain in cloud-module-data.ts after M6 migration.');
assert(!/\bnonEmptyString\s*\(/.test(cloudModuleData), 'Retired nonEmptyString helper must not remain in cloud-module-data.ts after M6 migration.');
assert(cloudModuleData.includes('moduleIdentityRequestSchema.safeParse'), 'Module identity requests must use the M6 runtime schema.');
assert(identityBridge.includes('embeddedModuleIdentityContextSchema.safeParse'), 'Embedded identity context must use the M6 runtime schema.');
assert(moduleHost.includes('embeddedReadyMessageSchema.safeParse') && moduleHost.includes('embeddedErrorMessageSchema.safeParse'), 'Module host messages must use M6 runtime schemas.');
assert(moduleLifecycle.includes('embeddedLifecycleStateSchema.safeParse') && moduleLifecycle.includes('embeddedLifecycleEventSchema.safeParse'), 'Embedded lifecycle state/events must use M6 runtime schemas.');
assert(routeController.includes('applicationRouteSchema.safeParse'), 'Navigation route input must pass through the M6 runtime schema.');
assert(runtimeClient.includes('runtimeContextSchema.safeParse'), 'Runtime client context updates must pass through the M6 runtime schema.');
for (const token of ['moduleDataResponseSchema.safeParse','embeddedHostInvalidateMessageSchema.safeParse','moduleStateRowSchema.safeParse','moduleDirectoryEntrySchema.safeParse','moduleActivityItemSchema.safeParse','moduleActivityEventSchema.safeParse']) {
  assert(moduleCloudStore.includes(token), `Embedded cloud store must validate runtime boundary with ${token}.`);
}
assert(permissions.includes('platformRoleSchema.safeParse') && permissions.includes('boardRoleSchema.safeParse'), 'Authorization role inputs must consume M6 schemas.');

for (const scriptName of ['check','release:check']) {
  const script = pkg.scripts?.[scriptName] ?? '';
  const m5 = script.indexOf('npm run interactions:check');
  const m6 = script.indexOf('npm run runtime-schemas:check');
  const type = script.indexOf('npm run typecheck');
  assert(m5 >= 0 && m6 > m5 && type > m6, `${scriptName} must preserve M5 -> M6 -> typecheck ordering.`);
}
assert(pkg.scripts?.['runtime-schemas:check'] === 'bash scripts/run-governed-toolchain.sh npm run runtime-schemas:check:governed', 'M6 check command must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['runtime-schemas:check:governed']?.includes('verify-stage-b-m6-runtime-schemas.mjs'), 'M6 governed check implementation must execute the M6 verifier.');
assert(pkg.scripts?.['runtime-schemas:check:governed']?.includes('verify-browser-harness-bundle.mjs'), 'M6 governed check must verify the browser runtime bundle before certification.');
assert(pkg.scripts?.['browser-harness:check'] === 'bash scripts/run-governed-toolchain.sh npm run browser-harness:check:governed', 'M6 browser harness check must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['browser-harness:check:governed']?.includes('verify-browser-harness-bundle.mjs'), 'M6 governed browser harness check must execute the browser bundle verifier.');
assert(browserRunner.includes("buildBrowserRuntimeBundle"), 'Browser CDP runner must execute the Vite-bundled runtime graph.');
assert(!browserRunner.includes('stripTypeScriptTypes') && !browserRunner.includes('transformModule('), 'Browser CDP runner must not emulate ES modules by stripping imports.');
assert(browserBundleBuilder.includes("formats: ['iife']"), 'Browser runtime builder must emit a self-contained IIFE.');
assert(browserBundleBuilder.includes("configFile: false"), 'Browser runtime builder must use an isolated test build configuration.');
assert(browserRuntimeEntry.includes("__wmBrowserRuntimeBundleReady"), 'Browser runtime entry must publish its readiness sentinel.');
assert(browserRuntimeEntry.includes("cloud-module-data.ts"), 'Browser runtime entry must include the M6 cloud-module boundary in the real module graph.');
assert(pkg.scripts?.['runtime-schemas:status'] === 'bash scripts/run-governed-toolchain.sh npm run runtime-schemas:status:governed', 'M6 status command must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['runtime-schemas:status:governed'] === 'node scripts/report-stage-b-m6.mjs', 'M6 governed status implementation must remain stable.');
assert(pkg.scripts?.['runtime-schemas:activate'] === 'bash scripts/run-governed-toolchain.sh npm run runtime-schemas:activate:governed', 'M6 activation command must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['runtime-schemas:activate:governed'] === 'node scripts/activate-stage-b-m6.mjs', 'M6 governed activation implementation must remain stable.');
assert(pkg.scripts?.['runtime-schemas:activate:release'] === 'bash scripts/run-governed-toolchain.sh npm run runtime-schemas:activate:release:governed', 'M6 release activation command must enter through the governed toolchain dispatcher.');
assert(pkg.scripts?.['runtime-schemas:activate:release:governed'] === 'node scripts/activate-stage-b-m6.mjs --release', 'M6 governed release activation implementation must remain stable.');
for (const gate of ['governance:check','security:check','react:check','design-system:check','interactions:check','runtime-schemas:check','lint:eslint','typecheck']) {
  assert(activation.includes(`'${gate}'`), `M6 activation must execute ${gate}.`);
}
assert(stageBCertify.includes('runtime-schemas:activate:release'), 'Stage B certification must promote M6 after M5.');
assert(stageBCertify.includes('M6 Runtime Schemas: active-certified'), 'Stage B certification summary must include M6.');

for (const workflow of ['.github/workflows/ci.yml','.github/workflows/deploy-pages.yml']) {
  const source = read(workflow);
  assert(source.includes('npm run runtime-schemas:check'), `${workflow} must execute the M6 runtime schema gate.`);
}
const projectVerifier = read('verify-project.sh');
for (const file of ['config/stage-b-m6-runtime-schema-target.ts','src/runtime-schemas/index.ts','verify-stage-b-m6-runtime-schemas.mjs','scripts/run-governed-toolchain.sh','verify-stage-b-governed-toolchain-dispatch.mjs']) {
  assert(projectVerifier.includes(file), `Aggregate verifier must require ${file}.`);
}

if (fs.existsSync(path.join(root, 'node_modules/zod/package.json'))) {
  const execution = spawnSync(process.execPath, ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', 'scripts/verify-runtime-schema-execution.mjs'], { cwd: root, encoding: 'utf8' });
  if (execution.stdout) process.stdout.write(execution.stdout);
  if (execution.stderr) process.stderr.write(execution.stderr);
  assert(execution.status === 0, 'M6 runtime schema execution vectors failed.');
}

console.log(`Stage B Milestone 6 Runtime Schemas verification: PASS (state=${state}; zod=4.5.4)`);
