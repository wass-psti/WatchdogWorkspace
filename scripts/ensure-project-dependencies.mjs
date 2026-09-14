import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { verifyInstalledLockfileTree } from './lib/lockfile-install-verifier.mjs';
import { probeOfflineLockfileInstall } from './lib/npm-offline-lockfile-probe.mjs';
import { verifyModernTestToolchain } from './lib/modern-test-toolchain.mjs';
import { computeM42DependencyTreeDigest } from './lib/stage-g-m42-dependency-tree.mjs';

const root = path.resolve(import.meta.dirname, '..');
const forceClean = process.argv.includes('--force-clean');
const preserveGovernedToolchain = !forceClean && process.env.WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN === '1';
const pkg = JSON.parse(await (await import('node:fs/promises')).readFile(path.join(root, 'package.json'), 'utf8'));
const expectedNpm = String(pkg.packageManager ?? '').replace(/^npm@/, '');

const npmVersionResult = spawnSync('npm', ['--version'], { cwd: root, encoding: 'utf8', shell: false });
if (npmVersionResult.error) throw npmVersionResult.error;
if (npmVersionResult.status !== 0) throw new Error('Unable to determine npm version.');
const actualNpm = npmVersionResult.stdout.trim();
if (expectedNpm && actualNpm !== expectedNpm) {
  throw new Error(`Governed npm version mismatch: expected ${expectedNpm}, received ${actualNpm}. Run \`nvm use\` before certification.`);
}

const before = verifyInstalledLockfileTree(root, { allowExtraneous: preserveGovernedToolchain });
const governedToolchain = preserveGovernedToolchain ? verifyModernTestToolchain(root) : null;
if (before.ok && (!preserveGovernedToolchain || governedToolchain.ok) && !forceClean) {
  if (preserveGovernedToolchain) {
    const expectedDigest = process.env.WM_M42_CERTIFICATION_DEPENDENCY_DIGEST || '';
    if (!/^[a-f0-9]{64}$/.test(expectedDigest)) {
      throw new Error('Governed M42 dependency preservation requires WM_M42_CERTIFICATION_DEPENDENCY_DIGEST from the owning certification transaction.');
    }
    const currentDigest = computeM42DependencyTreeDigest(root).digest;
    if (currentDigest !== expectedDigest) {
      throw new Error(`Governed M42 certification dependency digest changed: expected ${expectedDigest}, received ${currentDigest}.`);
    }
  }
  const extension = preserveGovernedToolchain ? `; governed modern test toolchain=${governedToolchain.checked}/${governedToolchain.expected}` : '';
  console.log(`Project dependency preflight: PASS (${before.checked} lockfile packages verified${before.optionalSkipped ? `; ${before.optionalSkipped} optional package(s) legitimately absent` : ''}${extension})`);
  process.exit(0);
}
if (preserveGovernedToolchain && !forceClean) {
  const issues = [...before.issues, ...(governedToolchain?.issues ?? [])];
  throw new Error(`Governed M42 certification dependency tree drifted; refusing to mutate the captured dependency baseline:\n- ${issues.join('\n- ')}`);
}

if (forceClean) console.log('Project dependency certification: clean npm ci materialization required even when installed versions already match the lockfile');
else console.log('Project dependency preflight: exact lockfile restoration required');
for (const reason of before.issues.slice(0, 25)) console.log(`- ${reason}`);
if (before.issues.length > 25) console.log(`- ... ${before.issues.length - 25} additional lockfile issue(s)`);

const offlineProbe = probeOfflineLockfileInstall(root, { timeout: 120000 });
const canRestoreOffline = offlineProbe.ok;
if (!canRestoreOffline) {
  const detail = offlineProbe.output.split('\n').slice(-3).join(' ');
  console.log(`Offline npm cache is incomplete${detail ? `: ${detail}` : ''}`);
}
const installArgs = canRestoreOffline
  ? ['ci', '--ignore-scripts', '--offline', '--no-audit', '--fund=false']
  : ['ci', '--ignore-scripts', '--fetch-retries=0'];
console.log(`\nInstalling the exact package-lock dependency graph with npm ci${canRestoreOffline ? ' from verified local cache' : ' using registry resolution'}...`);
const install = spawnSync('npm', installArgs, { cwd: root, stdio: 'inherit', shell: false });
if (install.error) throw install.error;
if (install.status !== 0) throw new Error(`npm ci failed with exit code ${install.status ?? 'unknown'}.`);

const after = verifyInstalledLockfileTree(root);
if (!after.ok) throw new Error(`Lockfile-wide dependency verification failed after npm ci:\n- ${after.issues.join('\n- ')}`);
console.log(`Project dependency preflight: PASS after npm ci (${after.checked} lockfile packages verified${after.optionalSkipped ? `; ${after.optionalSkipped} optional package(s) legitimately absent` : ''})`);
