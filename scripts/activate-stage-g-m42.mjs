import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { computeM42CertificationTreeDigest } from './lib/stage-g-m42-certification-tree.mjs';
import { computeM42DependencyTreeDigest } from './lib/stage-g-m42-dependency-tree.mjs';

const release = process.argv.includes('--release');
const file = new URL('../config/stage-g-m42-users-rbac-functional-recovery-target.ts', import.meta.url);
const pre = new URL('../config/stage-g-m41-account-functional-recovery-target.ts', import.meta.url);
const releaseStatusFile = new URL('../RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md', import.meta.url);
const original = await readFile(file, 'utf8');
const originalReleaseStatus = await readFile(releaseStatusFile, 'utf8');
const originalState = original.match(/activationState:\s*'([^']+)'/)?.[1] ?? 'unknown';
const originalReleaseState = originalReleaseStatus.match(/^- \*\*State:\*\*\s*([^\n]+)$/m)?.[1]?.trim() ?? 'unknown';

if (process.version !== 'v22.16.0') throw new Error(`M42 activation requires Node v22.16.0; current ${process.version}.`);
if (!(await readFile(pre, 'utf8')).includes("activationState: 'active-certified'")) throw new Error('M42 requires M41 active-certified.');
if (originalReleaseState !== originalState) throw new Error(`M42 activation target/release-status mismatch before activation: target=${originalState}, release-status=${originalReleaseState}.`);

const run = (script) => {
  const result = spawnSync('npm', ['run', script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} failed with exit code ${result.status ?? 'unknown'}.`);
};

const projectRoot = path.resolve(import.meta.dirname, '..');
const certificationTree = () => computeM42CertificationTreeDigest(projectRoot);
const dependencyTree = () => computeM42DependencyTreeDigest(projectRoot);
const assertCertificationTree = (expected, phase) => {
  const current = certificationTree();
  if (current.digest !== expected.digest) {
    throw new Error(`M42 certification source tree changed during ${phase}: expected ${expected.digest}, received ${current.digest}.`);
  }
};

const assertDependencyTree = (expected, phase) => {
  const current = dependencyTree();
  if (current.digest !== expected.digest) {
    throw new Error(`M42 installed dependency tree changed during ${phase}: expected ${expected.digest}, received ${current.digest}.`);
  }
};

const materializeCertifiedDependencies = () => {
  // Release activation is deliberately self-contained. No environment marker,
  // attestation file, or caller-minted token can skip the clean dependency materialization.
  run('users-rbac-recovery:preflight');
  run('dependencies:certify');
  run('modern-tests:toolchain:ensure');
  run('users-rbac-recovery:dependencies:check');
};

const runReleasePreActivationEvidenceGates = () => {
  run('account-recovery:status');
  run('users-rbac-recovery:check');
  run('users-rbac-recovery:test');
  run('users-rbac-recovery:browser');
  run('database-rls:test:local');
};

const writeState = async (state) => {
  const current = await readFile(file, 'utf8');
  const next = current.replace(/activationState:\s*'[^']+'/, `activationState:'${state}'`);
  if (next === current && !current.includes(`activationState:'${state}'`)) {
    throw new Error(`Unable to update M42 activation state to ${state}.`);
  }
  const currentReleaseStatus = await readFile(releaseStatusFile, 'utf8');
  const nextReleaseStatus = currentReleaseStatus.replace(/^- \*\*State:\*\*\s*[^\n]+$/m, `- **State:** ${state}`);
  if (nextReleaseStatus === currentReleaseStatus && !currentReleaseStatus.includes(`- **State:** ${state}`)) {
    throw new Error(`Unable to update M42 release-status state to ${state}.`);
  }
  await writeFile(file, next);
  try {
    await writeFile(releaseStatusFile, nextReleaseStatus);
  } catch (error) {
    await writeFile(file, current);
    throw error;
  }
};

try {
  if (!release) {
    // Non-release activation is intentionally incapable of certifying M42.
    // It may only establish the active-pending-browser-certification state.
    run('users-rbac-recovery:check');
    run('users-rbac-recovery:test');
    if (originalState === 'active-certified') {
      run('users-rbac-recovery:check');
      console.log('Stage G M42 activation: PASS (already active-certified; state preserved)');
      process.exit(0);
    }
    await writeState('active-pending-browser-certification');
    run('users-rbac-recovery:check');
    console.log('Stage G M42 activation: PASS (active-pending-browser-certification; release certification still required)');
    process.exit(0);
  }

  // A release activation is the authoritative source-certification transaction:
  // pre-activation environment/dependency/browser/database gates, activation,
  // post-state confirmation, then historical and complete release verification.
  // Any failure restores the exact pre-activation target.
  const certifiedSource = certificationTree();
  materializeCertifiedDependencies();
  const certifiedDependencies = dependencyTree();
  process.env.WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN = '1';
  process.env.WM_M42_CERTIFICATION_DEPENDENCY_DIGEST = certifiedDependencies.digest;
  runReleasePreActivationEvidenceGates();
  assertCertificationTree(certifiedSource, 'pre-activation gates');
  assertDependencyTree(certifiedDependencies, 'pre-activation gates');
  if (originalState !== 'active-certified') {
    await writeState('active-pending-browser-certification');
    assertCertificationTree(certifiedSource, 'pending activation transition');
    assertDependencyTree(certifiedDependencies, 'pending activation transition');
    await writeState('active-certified');
    assertCertificationTree(certifiedSource, 'certified activation transition');
    assertDependencyTree(certifiedDependencies, 'certified activation transition');
  }
  run('users-rbac-recovery:check');
  run('users-rbac-recovery:status');
  run('verify:historical-all');
  run('release:check');
  assertCertificationTree(certifiedSource, 'post-activation verification');
  assertDependencyTree(certifiedDependencies, 'post-activation verification');
  console.log('Stage G M42 activation: PASS (active-certified; full source-certification transaction verified)');
} catch (error) {
  await writeFile(file, original);
  await writeFile(releaseStatusFile, originalReleaseStatus);
  throw error;
}
