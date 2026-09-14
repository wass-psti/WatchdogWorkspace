import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const errors = [];
const pass = (label) => console.log(`PASS: ${label}`);
const fail = (label) => errors.push(label);

const readText = async (path) => readFile(resolve(root, path), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));
const isExactVersion = (value) => /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(String(value));

const pkg = await readJson('package.json');
const lock = await readJson('package-lock.json');
const lockRoot = lock.packages?.[''];

if (pkg.private === true) pass('package is private'); else fail('package.json must set private=true');
if (pkg.packageManager === 'npm@10.9.2') pass('packageManager pins npm@10.9.2'); else fail('packageManager must pin npm@10.9.2');
if (pkg.engines?.node === '>=22.12.0 <23') pass('Node engine matches governed Node 22 baseline'); else fail('Node engine must be >=22.12.0 <23');
if (pkg.engines?.npm === '>=10.9.0 <11') pass('npm engine is governed'); else fail('npm engine must be >=10.9.0 <11');

const nvmrc = (await readText('.nvmrc')).trim();
if (nvmrc === '22.16.0') pass('.nvmrc pins Node 22.16.0'); else fail('.nvmrc must pin Node 22.16.0');

const npmrc = await readText('.npmrc');
for (const required of ['engine-strict=true', 'save-exact=true', 'package-lock=true', 'audit=true']) {
  if (npmrc.includes(required)) pass(`.npmrc ${required}`); else fail(`.npmrc missing ${required}`);
}

if (lock.lockfileVersion === 3) pass('package-lock uses lockfileVersion 3'); else fail('package-lock must use lockfileVersion 3');
if (lockRoot?.name === pkg.name && lockRoot?.version === pkg.version) pass('package-lock root identity matches package.json'); else fail('package-lock root identity mismatch');
if (JSON.stringify(lockRoot?.engines) === JSON.stringify(pkg.engines)) pass('package-lock engine contract matches package.json'); else fail('package-lock engines mismatch');
if (lockRoot?.packageManager == null) pass('package-lock packageManager metadata is optional under npm 10');
else if (lockRoot.packageManager === pkg.packageManager) pass('package-lock packageManager matches package.json');
else fail('package-lock packageManager mismatch');

for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  const declared = pkg[section] ?? {};
  const locked = lockRoot?.[section] ?? {};
  for (const [name, version] of Object.entries(declared)) {
    if (!isExactVersion(version)) fail(`${section}.${name} must use an exact version, found ${version}`);
    if (locked[name] !== version) fail(`package-lock root mismatch for ${section}.${name}`);
  }
  for (const name of Object.keys(locked)) {
    if (!(name in declared)) fail(`package-lock root has undeclared ${section}.${name}`);
  }
}
if (!errors.some((entry) => entry.includes('exact version') || entry.includes('package-lock root mismatch') || entry.includes('undeclared'))) {
  pass('direct dependency versions are exact and lockfile-aligned');
}

for (const [path, entry] of Object.entries(lock.packages ?? {})) {
  if (!path || !entry || typeof entry !== 'object') continue;
  if (typeof entry.resolved === 'string' && !entry.resolved.startsWith('https://registry.npmjs.org/')) {
    fail(`non-registry dependency source in lockfile: ${path} -> ${entry.resolved}`);
  }
}
if (!errors.some((entry) => entry.startsWith('non-registry dependency'))) pass('lockfile dependency sources are npm-registry only');

for (const lifecycle of ['preinstall', 'install', 'postinstall', 'prepare']) {
  if (pkg.scripts?.[lifecycle]) fail(`root lifecycle script ${lifecycle} is not allowed without governance approval`);
}
if (!errors.some((entry) => entry.startsWith('root lifecycle'))) pass('root package has no install-time lifecycle scripts');

const requiredScripts = ['governance:check', 'security:check', 'lint:eslint', 'lint:typescript', 'lint', 'audit:ci', 'ci:check', 'check', 'release:check'];
for (const name of requiredScripts) {
  if (!pkg.scripts?.[name]) fail(`missing governed package script: ${name}`);
}
if (requiredScripts.every((name) => pkg.scripts?.[name])) pass('governed package scripts are present');
if (pkg.scripts?.['lint:eslint']?.includes('eslint@10.9.1')) pass('ESLint CI tool version is explicitly pinned'); else fail('lint:eslint must pin eslint@10.9.1');

const workflowDir = resolve(root, '.github/workflows');
const workflows = (await readdir(workflowDir)).filter((name) => /\.ya?ml$/.test(name));
for (const required of ['ci.yml', 'deploy-pages.yml', 'codeql.yml', 'dependency-review.yml', 'database-tests.yml', 'modern-tests.yml', 'performance.yml', 'observability.yml', 'service-worker-updates.yml', 'backup-disaster-recovery.yml', 'final-legacy-deletion.yml', 'production-cutover.yml', 'functional-regression-baseline.yml', 'backend-capability-preflight.yml']) {
  if (workflows.includes(required)) pass(`workflow present: ${required}`); else fail(`missing workflow: ${required}`);
}
for (const name of workflows) {
  const text = await readFile(resolve(workflowDir, name), 'utf8');
  if (/pull_request_target\s*:/.test(text)) fail(`${name} must not use pull_request_target`);
  for (const match of text.matchAll(/uses:\s*([^\s#]+)/g)) {
    const ref = match[1];
    if (!ref.includes('@')) fail(`${name} has unversioned action: ${ref}`);
    if (/@(?:main|master|HEAD)$/.test(ref)) fail(`${name} uses mutable action ref: ${ref}`);
  }
}
if (!errors.some((entry) => entry.includes('pull_request_target') || entry.includes('unversioned action') || entry.includes('mutable action'))) {
  pass('workflow action references are versioned and no pull_request_target is used');
}

const swWorkflow = await readText('.github/workflows/service-worker-updates.yml');
for (const expected of ['npm ci', 'npm run service-worker-update:check', 'npm run service-worker-update:test', 'npm run service-worker-update:dist', 'npm run verify:preview']) {
  if (!swWorkflow.includes(expected)) fail(`service-worker-updates.yml missing: ${expected}`);
}
if (!errors.some((entry) => entry.startsWith('service-worker-updates.yml missing'))) pass('M33 service-worker update workflow is governed');

const backupDrWorkflow = await readText('.github/workflows/backup-disaster-recovery.yml');
for (const expected of ['npm ci', 'npm run backup-dr:check', 'npm run backup-dr:test', 'npm run database-rls:check', 'npm run observability:check', 'npm run service-worker-update:check', 'npm run lint:eslint', 'npm run typecheck']) {
  if (!backupDrWorkflow.includes(expected)) fail(`backup-disaster-recovery.yml missing: ${expected}`);
}
if (!errors.some((entry) => entry.startsWith('backup-disaster-recovery.yml missing'))) pass('M34 backup/disaster-recovery workflow is governed');


const legacyDeletionWorkflow = await readText('.github/workflows/final-legacy-deletion.yml');
for (const expected of ['npm ci', 'verify-settings.mjs', 'npm run fueltrack-stabilization:check', 'npm run verify:ui', 'npm run legacy-deletion:check', 'npm run legacy-deletion:test', 'npm run backup-dr:check', 'npm run service-worker-update:check', 'npm run observability:check', 'npm run performance:check', 'npm run lint:eslint', 'npm run typecheck']) {
  if (!legacyDeletionWorkflow.includes(expected)) fail(`final-legacy-deletion.yml missing: ${expected}`);
}
if (!errors.some((entry) => entry.startsWith('final-legacy-deletion.yml missing'))) pass('M35 final legacy deletion workflow is governed');

const productionCutoverWorkflow = await readText('.github/workflows/production-cutover.yml');
for (const expected of ['npm ci', 'npm run release:check', 'npm run cutover:check', 'npm run cutover:test', 'npm run cutover:artifact', 'npm run cutover:evidence', 'actions/upload-artifact@v4']) {
  if (!productionCutoverWorkflow.includes(expected)) fail(`production-cutover.yml missing: ${expected}`);
}
if (!errors.some((entry) => entry.startsWith('production-cutover.yml missing'))) pass('M36 production cutover workflow is governed');

const functionalRegressionWorkflow = await readText('.github/workflows/functional-regression-baseline.yml');
for (const expected of ['npm ci', 'npm run functional-regression:check', 'npm run functional-regression:test', 'npm run functional-regression:browser', 'npm run functional-regression:evidence', 'actions/upload-artifact@v4']) {
  if (!functionalRegressionWorkflow.includes(expected)) fail(`functional-regression-baseline.yml missing: ${expected}`);
}
if (!errors.some((entry) => entry.startsWith('functional-regression-baseline.yml missing'))) pass('M37 functional regression baseline workflow is governed');

const backendPreflightWorkflow = await readText('.github/workflows/backend-capability-preflight.yml');
for (const expected of ['npm ci', 'npm run backend-preflight:check', 'npm run backend-preflight:test', 'npm run backend-preflight:browser']) {
  if (!backendPreflightWorkflow.includes(expected)) fail(`backend-capability-preflight.yml missing: ${expected}`);
}
if (!errors.some((entry) => entry.startsWith('backend-capability-preflight.yml missing'))) pass('M38 backend capability preflight workflow is governed');


const ci = await readText('.github/workflows/ci.yml');
for (const expected of ['npm ci', 'npm run governance:check', 'npm run security:check', 'npm run modern-tests:check', 'npm run modern-tests:test', 'npm run performance:check', 'npm run observability:check', 'npm run observability:test', 'npm run service-worker-update:check', 'npm run service-worker-update:test', 'npm run backup-dr:check', 'npm run backup-dr:test', 'npm run legacy-deletion:check', 'npm run legacy-deletion:test', 'npm run cutover:check', 'npm run cutover:test', 'npm run cutover:artifact', 'npm run cutover:evidence', 'npm run functional-regression:check', 'npm run functional-regression:test', 'npm run lint', 'npm run release:check', 'npm run audit:ci']) {
  if (!ci.includes(expected)) fail(`ci.yml missing: ${expected}`);
}
if (!errors.some((entry) => entry.startsWith('ci.yml missing'))) pass('CI enforces install, governance, lint, audit, and release gate');

const deploy = await readText('.github/workflows/deploy-pages.yml');
for (const expected of ['npm ci', 'npm run governance:check', 'npm run security:check', 'npm run modern-tests:check', 'npm run performance:check', 'npm run observability:check', 'npm run observability:test', 'npm run service-worker-update:check', 'npm run service-worker-update:test', 'npm run backup-dr:check', 'npm run backup-dr:test', 'npm run legacy-deletion:check', 'npm run legacy-deletion:test', 'npm run cutover:check', 'npm run cutover:test', 'npm run cutover:artifact', 'npm run cutover:evidence', 'npm run functional-regression:check', 'npm run functional-regression:test', 'npm run lint', 'npm run audit:ci', 'npm run release:check', 'path: ./dist']) {
  if (!deploy.includes(expected)) fail(`deploy-pages.yml missing: ${expected}`);
}
if (!errors.some((entry) => entry.startsWith('deploy-pages.yml missing'))) pass('deployment revalidates governed production dist only');

if (errors.length) {
  console.error('\nPackage governance verification: FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('\nPackage governance verification: PASS');
