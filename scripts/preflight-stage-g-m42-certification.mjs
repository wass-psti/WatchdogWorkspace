import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { findBrowserBinary } from './lib/browser-cdp-smoke.mjs';
import { verifyInstalledLockfileTree } from './lib/lockfile-install-verifier.mjs';
import { probeOfflineM42CertificationInstall } from './lib/npm-offline-m42-certification-probe.mjs';

const root = path.resolve(import.meta.dirname, '..');
const EXPECTED_NODE = 'v22.16.0';
const EXPECTED_SUPABASE = '2.117.0';
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = (file) => JSON.parse(read(file));
const failures = [];
const notes = [];
const pass = (label, detail = '') => console.log(`PASS: ${label}${detail ? ` — ${detail}` : ''}`);
const fail = (label, detail) => { failures.push(`${label}: ${detail}`); console.error(`FAIL: ${label} — ${detail}`); };
const note = (label, detail) => { notes.push(`${label}: ${detail}`); console.log(`NOTE: ${label} — ${detail}`); };
const run = (command, args, options = {}) => spawnSync(command, args, { cwd: root, encoding: 'utf8', shell: false, ...options });
const output = (result) => `${result.stdout || ''}${result.stderr || ''}`.trim();

console.log('Stage G M42 certification environment preflight');
console.log('================================================');

if (process.version === EXPECTED_NODE) pass('Node runtime', process.version);
else fail('Node runtime', `expected ${EXPECTED_NODE}, received ${process.version}`);

let pkg;
try {
  pkg = readJson('package.json');
  pass('package.json', 'readable');
} catch (error) {
  fail('package.json', error instanceof Error ? error.message : String(error));
  pkg = { dependencies: {}, devDependencies: {}, packageManager: '' };
}

if (fs.existsSync(path.join(root, 'package-lock.json'))) pass('package-lock.json', 'present');
else fail('package-lock.json', 'missing; exact dependency restoration cannot be certified');

const expectedNpm = String(pkg.packageManager || '').replace(/^npm@/, '');
const npmVersion = run('npm', ['--version']);
if (!npmVersion.error && npmVersion.status === 0) {
  const actual = npmVersion.stdout.trim();
  if (!expectedNpm || actual === expectedNpm) pass('npm runtime', actual);
  else fail('npm runtime', `expected ${expectedNpm}, received ${actual}`);
} else {
  fail('npm runtime', npmVersion.error?.message || output(npmVersion) || 'npm is unavailable');
}

for (const file of [
  'config/stage-g-m41-account-functional-recovery-target.ts',
  'config/stage-g-m42-users-rbac-functional-recovery-target.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md',
  'scripts/run-database-rls-tests.mjs',
  'tests/modern/e2e/users-rbac-functional-recovery.spec.mjs',
]) {
  if (fs.existsSync(path.join(root, file))) pass('Required certification artifact', file);
  else fail('Required certification artifact', `${file} is missing`);
}

try {
  const m41 = read('config/stage-g-m41-account-functional-recovery-target.ts');
  const state = m41.match(/activationState:\s*'([^']+)'/)?.[1] || 'unknown';
  if (state === 'active-certified') pass('M41 prerequisite', state);
  else fail('M41 prerequisite', `expected active-certified, received ${state}`);
} catch (error) {
  fail('M41 prerequisite', error instanceof Error ? error.message : String(error));
}

try {
  const m42 = read('config/stage-g-m42-users-rbac-functional-recovery-target.ts');
  const state = m42.match(/activationState:\s*'([^']+)'/)?.[1] || 'unknown';
  const allowed = new Set(['implementation-complete-pending-certification', 'active-pending-browser-certification', 'active-certified']);
  if (allowed.has(state)) pass('M42 activation state', state);
  else fail('M42 activation state', `unexpected state ${state}`);
} catch (error) {
  fail('M42 activation state', error instanceof Error ? error.message : String(error));
}

try {
  const m42 = read('config/stage-g-m42-users-rbac-functional-recovery-target.ts');
  const targetState = m42.match(/activationState:\s*'([^']+)'/)?.[1] || 'unknown';
  const releaseStatus = read('RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md');
  const releaseState = releaseStatus.match(/^- \*\*State:\*\*\s*([^\n]+)$/m)?.[1]?.trim() || 'unknown';
  if (releaseState === targetState) pass('M42 state authority agreement', targetState);
  else fail('M42 state authority agreement', `target=${targetState}, release-status=${releaseState}`);
} catch (error) {
  fail('M42 state authority agreement', error instanceof Error ? error.message : String(error));
}

const dependencyTree = verifyInstalledLockfileTree(root);
const dependencyTreeNeedsRestore = !dependencyTree.ok;
if (!dependencyTreeNeedsRestore) {
  pass('Exact lockfile dependency tree', `${dependencyTree.checked} packages verified${dependencyTree.optionalSkipped ? `; ${dependencyTree.optionalSkipped} optional package(s) legitimately absent` : ''}`);
} else {
  note('Exact lockfile dependency tree', `${dependencyTree.issues.length} issue(s) require npm ci`);
}

let registryReachable = null;
const probeRegistry = () => {
  if (registryReachable !== null) return registryReachable;
  const probe = run('npm', [
    'view', 'supabase@2.117.0', 'version',
    '--registry=https://registry.npmjs.org/',
    '--fetch-retries=0', '--fetch-timeout=5000',
  ], { timeout: 7000 });
  registryReachable = !probe.error && probe.status === 0 && output(probe).includes(EXPECTED_SUPABASE);
  if (registryReachable) pass('npm registry', 'registry.npmjs.org reachable for pinned certification tooling');
  else fail('npm registry', output(probe) || probe.error?.message || 'registry.npmjs.org is unreachable');
  return registryReachable;
};

const offlineProbe = probeOfflineM42CertificationInstall(root, { timeout: 180000 });
const offlineDependencyRestoreAvailable = offlineProbe.ok;
if (offlineDependencyRestoreAvailable) {
  pass('Clean certification dependency materialization', 'disposable offline install materialized the package-lock graph plus the exact governed modern test toolchain');
} else {
  note('Clean certification dependency materialization', `${offlineProbe.stage}: ${offlineProbe.output.split('\n').slice(-3).join(' ') || offlineProbe.error?.message || 'offline cache cannot materialize the complete certification dependency graph'}`);
  // Release certification always performs clean npm ci followed by the governed
  // modern test-toolchain bootstrap before dependency evidence is captured.
  // If either layer cannot materialize offline, registry access is a hard prerequisite.
  probeRegistry();
}

try {
  const browser = await findBrowserBinary();
  pass('Chromium-based browser', browser);
} catch (error) {
  fail('Chromium-based browser', error instanceof Error ? error.message.split('\n')[0] : String(error));
}

const docker = run('docker', ['version', '--format', '{{.Server.Version}}'], { timeout: 5000 });
if (!docker.error && docker.status === 0 && docker.stdout.trim()) pass('Docker-compatible runtime', `server ${docker.stdout.trim()}`);
else fail('Docker-compatible runtime', docker.error?.code === 'ENOENT' ? 'docker command not found' : output(docker) || docker.error?.message || 'Docker daemon is not running');

const globalSupabase = run('supabase', ['--version'], { timeout: 5000 });
const globalSupabaseVersion = globalSupabase.error || globalSupabase.status !== 0 ? '' : output(globalSupabase).replace(/^v/, '');
if (globalSupabaseVersion === EXPECTED_SUPABASE) {
  pass('Supabase CLI', `global ${EXPECTED_SUPABASE}`);
} else {
  note('Supabase CLI', globalSupabaseVersion ? `global version ${globalSupabaseVersion} differs; pinned npx ${EXPECTED_SUPABASE} will be used` : `global CLI absent; pinned npx ${EXPECTED_SUPABASE} will be used`);
  probeRegistry();
}

for (const command of ['shasum', 'tar', 'zip', 'unzip']) {
  const result = run(command, ['--help'], { timeout: 3000 });
  if (!result.error && (result.status === 0 || result.status === 1 || result.status === 2)) pass('Packaging tool', command);
  else fail('Packaging tool', `${command} is unavailable`);
}

console.log('================================================');
if (failures.length) {
  console.error(`M42 certification environment preflight: FAIL (${failures.length} blocker${failures.length === 1 ? '' : 's'})`);
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}
console.log(`M42 certification environment preflight: PASS (${notes.length} informational note${notes.length === 1 ? '' : 's'})`);
