import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const activationSource = join(root, 'scripts/activate-stage-g-m42.mjs');
const m42Source = join(root, 'config/stage-g-m42-users-rbac-functional-recovery-target.ts');
const m41Source = join(root, 'config/stage-g-m41-account-functional-recovery-target.ts');
const releaseStatusSource = join(root, 'RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md');
const certificationTreeSource = join(root, 'scripts/lib/stage-g-m42-certification-tree.mjs');
const dependencyTreeSource = join(root, 'scripts/lib/stage-g-m42-dependency-tree.mjs');
const deterministicFixtureState = 'implementation-complete-pending-certification';

const normalizeTargetState = (file, state) => {
  const current = readFileSync(file, 'utf8');
  assert.match(current, /activationState:\s*'[^']+'/, 'sandbox target fixture must expose an activationState authority');
  const next = current.replace(/activationState:\s*'[^']+'/, `activationState:'${state}'`);
  assert.ok(next.includes(`activationState:'${state}'`), `sandbox target fixture must normalize to ${state}`);
  if (next !== current) writeFileSync(file, next);
};

const normalizeReleaseStatusState = (file, state) => {
  const current = readFileSync(file, 'utf8');
  assert.match(current, /^- \*\*State:\*\*\s*[^\n]+$/m, 'sandbox release-status fixture must expose a state authority');
  const next = current.replace(/^- \*\*State:\*\*\s*[^\n]+$/m, `- **State:** ${state}`);
  assert.ok(next.includes(`- **State:** ${state}`), `sandbox release-status fixture must normalize to ${state}`);
  if (next !== current) writeFileSync(file, next);
};

const prepareSandbox = ({ sourceState = null } = {}) => {
  const sandbox = mkdtempSync(join(tmpdir(), 'wm-m42-activation-'));
  const project = join(sandbox, 'project');
  const scriptsDir = join(project, 'scripts');
  const configDir = join(project, 'config');
  const binDir = join(sandbox, 'bin');
  mkdirSync(scriptsDir, { recursive: true });
  mkdirSync(join(scriptsDir, 'lib'), { recursive: true });
  mkdirSync(configDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });
  cpSync(activationSource, join(scriptsDir, 'activate-stage-g-m42.mjs'));
  cpSync(certificationTreeSource, join(scriptsDir, 'lib', 'stage-g-m42-certification-tree.mjs'));
  cpSync(dependencyTreeSource, join(scriptsDir, 'lib', 'stage-g-m42-dependency-tree.mjs'));
  cpSync(m42Source, join(configDir, 'stage-g-m42-users-rbac-functional-recovery-target.ts'));
  cpSync(m41Source, join(configDir, 'stage-g-m41-account-functional-recovery-target.ts'));
  const releaseStatus = join(project, 'RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md');
  cpSync(releaseStatusSource, releaseStatus);
  const target = join(configDir, 'stage-g-m42-users-rbac-functional-recovery-target.ts');
  if (sourceState) {
    normalizeTargetState(target, sourceState);
    normalizeReleaseStatusState(releaseStatus, sourceState);
  }
  // Regression fixtures must not inherit the live M42 lifecycle state. During
  // real certification release:check runs after activation has already moved
  // the live records to active-certified. Normalize every sandbox to the same
  // pre-certification authority so mismatch/rollback vectors remain deterministic.
  normalizeTargetState(target, deterministicFixtureState);
  normalizeReleaseStatusState(releaseStatus, deterministicFixtureState);
  const sourceDir = join(project, 'src');
  mkdirSync(sourceDir, { recursive: true });
  const sourceSentinel = join(sourceDir, 'm42-certification-source.txt');
  writeFileSync(sourceSentinel, 'certified-source-v1\n');
  const dependencyDir = join(project, 'node_modules', 'm42-test-package');
  const dependencySentinel = join(dependencyDir, 'index.js');
  const log = join(sandbox, 'npm.log');
  const npmStub = join(binDir, 'npm');
  writeFileSync(npmStub, `#!/bin/sh
printf '%s\n' "${'$'}*" >> "${log}"
if [ "${'$'}*" = "run dependencies:certify" ]; then mkdir -p "${dependencyDir}"; printf '%s\n' '{"name":"m42-test-package","version":"1.0.0"}' > "${join(project, 'node_modules', 'm42-test-package', 'package.json')}"; printf '%s\n' 'module.exports = 42;' > "${dependencySentinel}"; fi
if [ -n "${'$'}{M42_TEST_MUTATE_ON:-}" ] && [ "${'$'}*" = "${'$'}M42_TEST_MUTATE_ON" ]; then printf '%s\n' 'tampered-during-certification' >> "${sourceSentinel}"; fi
if [ -n "${'$'}{M42_TEST_DEP_MUTATE_ON:-}" ] && [ "${'$'}*" = "${'$'}M42_TEST_DEP_MUTATE_ON" ]; then printf '%s\n' 'module.exports = 99;' >> "${dependencySentinel}"; fi
if [ -n "${'$'}{M42_TEST_FAIL_ON:-}" ] && [ "${'$'}*" = "${'$'}M42_TEST_FAIL_ON" ]; then exit 42; fi
exit 0
`);
  chmodSync(npmStub, 0o755);
  return { sandbox, project, binDir, log, target, releaseStatus, sourceSentinel, originalTarget: readFileSync(target, 'utf8'), originalReleaseStatus: readFileSync(releaseStatus, 'utf8') };
};

const readCalls = (log) => existsSync(log) ? readFileSync(log, 'utf8').trim().split(/\n+/).filter(Boolean) : [];
const runActivation = (ctx, args = [], env = {}) => spawnSync(process.execPath, ['scripts/activate-stage-g-m42.mjs', ...args], {
  cwd: ctx.project,
  encoding: 'utf8',
  env: { ...process.env, PATH: `${ctx.binDir}:${process.env.PATH || ''}`, ...env },
});
const runRelease = (ctx, env = {}) => runActivation(ctx, ['--release'], env);
const strictReleaseCalls = [
  'run users-rbac-recovery:preflight',
  'run dependencies:certify',
  'run modern-tests:toolchain:ensure',
  'run users-rbac-recovery:dependencies:check',
  'run account-recovery:status',
  'run users-rbac-recovery:check',
  'run users-rbac-recovery:test',
  'run users-rbac-recovery:browser',
  'run database-rls:test:local',
  'run users-rbac-recovery:check',
  'run users-rbac-recovery:status',
  'run verify:historical-all',
  'run release:check',
];

const mismatchedAuthority = prepareSandbox({ sourceState: 'active-certified' });
try {
  assert.match(mismatchedAuthority.originalTarget, /activationState:'implementation-complete-pending-certification'/, 'sandbox target must normalize an active-certified source snapshot to the deterministic pending fixture state');
  assert.match(mismatchedAuthority.originalReleaseStatus, /- \*\*State:\*\* implementation-complete-pending-certification/, 'sandbox release-status must normalize an active-certified source snapshot to the deterministic pending fixture state');
  normalizeReleaseStatusState(mismatchedAuthority.releaseStatus, 'active-pending-browser-certification');
  const result = runActivation(mismatchedAuthority);
  assert.notEqual(result.status, 0, 'activation must fail before gates when target and release-status authority disagree');
  assert.deepEqual(readCalls(mismatchedAuthority.log), [], 'authority mismatch must fail before invoking any npm gate');
  assert.equal(readFileSync(mismatchedAuthority.target, 'utf8'), mismatchedAuthority.originalTarget, 'authority mismatch must not mutate the target');
  assert.match(`${result.stdout}${result.stderr}`, /target\/release-status mismatch before activation/i, 'authority mismatch failure must be explicit');
} finally {
  rmSync(mismatchedAuthority.sandbox, { recursive: true, force: true });
}

const nonRelease = prepareSandbox();
try {
  const result = runActivation(nonRelease);
  assert.equal(result.status, 0, result.stderr || 'non-release activation should establish only the pending state');
  assert.deepEqual(readCalls(nonRelease.log), [
    'run users-rbac-recovery:check',
    'run users-rbac-recovery:test',
    'run users-rbac-recovery:check',
  ], 'non-release activation must execute deterministic gates and a post-state check only');
  assert.match(readFileSync(nonRelease.target, 'utf8'), /activationState:'active-pending-browser-certification'/, 'non-release activation must never mark M42 active-certified');
  assert.match(readFileSync(nonRelease.releaseStatus, 'utf8'), /- \*\*State:\*\* active-pending-browser-certification/, 'non-release activation must synchronize the release-status record to the pending-browser state');
} finally {
  rmSync(nonRelease.sandbox, { recursive: true, force: true });
}

const direct = prepareSandbox();
try {
  const result = runRelease(direct);
  assert.equal(result.status, 0, result.stderr || 'direct release activation should succeed with stubbed npm gates');
  assert.deepEqual(readCalls(direct.log), strictReleaseCalls, 'direct/manual release activation must execute the complete pre/post source-certification sequence');
  assert.match(readFileSync(direct.target, 'utf8'), /activationState:'active-certified'/, 'direct release must reach active-certified only after every source-certification gate passes');
  assert.match(readFileSync(direct.releaseStatus, 'utf8'), /- \*\*State:\*\* active-certified/, 'direct release must synchronize the release-status record when source certification succeeds');
} finally {
  rmSync(direct.sandbox, { recursive: true, force: true });
}

const databaseFailure = prepareSandbox();
try {
  const originalTarget = readFileSync(databaseFailure.target, 'utf8');
  const originalReleaseStatus = readFileSync(databaseFailure.releaseStatus, 'utf8');
  const result = runRelease(databaseFailure, { M42_TEST_FAIL_ON: 'run database-rls:test:local' });
  assert.notEqual(result.status, 0, 'direct release must fail when the disposable Database/RLS gate fails');
  assert.equal(readFileSync(databaseFailure.target, 'utf8'), originalTarget, 'failed pre-activation release must leave the activation target unchanged');
  assert.equal(readFileSync(databaseFailure.releaseStatus, 'utf8'), originalReleaseStatus, 'failed pre-activation release must leave the release-status record unchanged');
  assert.deepEqual(readCalls(databaseFailure.log), strictReleaseCalls.slice(0, 9), 'release must stop at the failing Database/RLS gate before activation');
} finally {
  rmSync(databaseFailure.sandbox, { recursive: true, force: true });
}

const historicalFailure = prepareSandbox();
try {
  const originalTarget = readFileSync(historicalFailure.target, 'utf8');
  const originalReleaseStatus = readFileSync(historicalFailure.releaseStatus, 'utf8');
  const result = runRelease(historicalFailure, { M42_TEST_FAIL_ON: 'run verify:historical-all' });
  assert.notEqual(result.status, 0, 'post-activation historical failure must fail release certification');
  assert.equal(readFileSync(historicalFailure.target, 'utf8'), originalTarget, 'post-activation historical failure must restore the exact original target');
  assert.equal(readFileSync(historicalFailure.releaseStatus, 'utf8'), originalReleaseStatus, 'post-activation historical failure must restore the exact original release-status record');
  assert.deepEqual(readCalls(historicalFailure.log), strictReleaseCalls.slice(0, 12), 'release must stop at the failing post-activation historical gate');
} finally {
  rmSync(historicalFailure.sandbox, { recursive: true, force: true });
}

const releaseFailure = prepareSandbox();
try {
  const originalTarget = readFileSync(releaseFailure.target, 'utf8');
  const originalReleaseStatus = readFileSync(releaseFailure.releaseStatus, 'utf8');
  const result = runRelease(releaseFailure, { M42_TEST_FAIL_ON: 'run release:check' });
  assert.notEqual(result.status, 0, 'post-activation full release failure must fail release certification');
  assert.equal(readFileSync(releaseFailure.target, 'utf8'), originalTarget, 'post-activation release failure must restore the exact original target');
  assert.equal(readFileSync(releaseFailure.releaseStatus, 'utf8'), originalReleaseStatus, 'post-activation release failure must restore the exact original release-status record');
  assert.deepEqual(readCalls(releaseFailure.log), strictReleaseCalls, 'release must execute through the failing full release gate');
} finally {
  rmSync(releaseFailure.sandbox, { recursive: true, force: true });
}

const preActivationTamper = prepareSandbox();
try {
  const result = runRelease(preActivationTamper, { M42_TEST_MUTATE_ON: 'run database-rls:test:local' });
  assert.notEqual(result.status, 0, 'source mutation during pre-activation gates must fail certification');
  assert.equal(readFileSync(preActivationTamper.target, 'utf8'), preActivationTamper.originalTarget, 'pre-activation source mutation must preserve the original target');
  assert.equal(readFileSync(preActivationTamper.releaseStatus, 'utf8'), preActivationTamper.originalReleaseStatus, 'pre-activation source mutation must preserve the original release-status record');
  assert.deepEqual(readCalls(preActivationTamper.log), strictReleaseCalls.slice(0, 9), 'pre-activation source mutation must be detected before activation');
  assert.match(`${result.stdout}${result.stderr}`, /source tree changed during pre-activation Database\/RLS verification/i, 'pre-activation mutation failure must identify the evidence-integrity boundary');
} finally {
  rmSync(preActivationTamper.sandbox, { recursive: true, force: true });
}

const postActivationTamper = prepareSandbox();
try {
  const result = runRelease(postActivationTamper, { M42_TEST_MUTATE_ON: 'run verify:historical-all' });
  assert.notEqual(result.status, 0, 'source mutation during post-activation verification must fail certification');
  assert.equal(readFileSync(postActivationTamper.target, 'utf8'), postActivationTamper.originalTarget, 'post-activation source mutation must roll back the exact original target');
  assert.equal(readFileSync(postActivationTamper.releaseStatus, 'utf8'), postActivationTamper.originalReleaseStatus, 'post-activation source mutation must roll back the exact original release-status record');
  assert.deepEqual(readCalls(postActivationTamper.log), strictReleaseCalls.slice(0, 12), 'post-activation source mutation must be detected immediately after the historical gate and before complete release verification');
  assert.match(`${result.stdout}${result.stderr}`, /source tree changed during post-activation historical verification/i, 'post-activation mutation failure must identify the evidence-integrity boundary');
} finally {
  rmSync(postActivationTamper.sandbox, { recursive: true, force: true });
}


const preActivationDependencyTamper = prepareSandbox();
try {
  const result = runRelease(preActivationDependencyTamper, { M42_TEST_DEP_MUTATE_ON: 'run database-rls:test:local' });
  assert.notEqual(result.status, 0, 'dependency mutation during pre-activation gates must fail certification');
  assert.equal(readFileSync(preActivationDependencyTamper.target, 'utf8'), preActivationDependencyTamper.originalTarget, 'pre-activation dependency mutation must preserve the original target');
  assert.equal(readFileSync(preActivationDependencyTamper.releaseStatus, 'utf8'), preActivationDependencyTamper.originalReleaseStatus, 'pre-activation dependency mutation must preserve the original release-status record');
  assert.deepEqual(readCalls(preActivationDependencyTamper.log), strictReleaseCalls.slice(0, 9), 'pre-activation dependency mutation must be detected before activation');
  assert.match(`${result.stdout}${result.stderr}`, /installed dependency tree changed during pre-activation Database\/RLS verification/i, 'pre-activation dependency mutation failure must identify the dependency evidence boundary');
} finally {
  rmSync(preActivationDependencyTamper.sandbox, { recursive: true, force: true });
}

const postActivationDependencyTamper = prepareSandbox();
try {
  const result = runRelease(postActivationDependencyTamper, { M42_TEST_DEP_MUTATE_ON: 'run verify:historical-all' });
  assert.notEqual(result.status, 0, 'dependency mutation during post-activation verification must fail certification');
  assert.equal(readFileSync(postActivationDependencyTamper.target, 'utf8'), postActivationDependencyTamper.originalTarget, 'post-activation dependency mutation must roll back the exact original target');
  assert.equal(readFileSync(postActivationDependencyTamper.releaseStatus, 'utf8'), postActivationDependencyTamper.originalReleaseStatus, 'post-activation dependency mutation must roll back the exact original release-status record');
  assert.deepEqual(readCalls(postActivationDependencyTamper.log), strictReleaseCalls.slice(0, 12), 'post-activation dependency mutation must be detected immediately after historical verification and before complete release verification');
  assert.match(`${result.stdout}${result.stderr}`, /installed dependency tree changed during post-activation historical verification/i, 'post-activation dependency mutation failure must identify the dependency evidence boundary');
} finally {
  rmSync(postActivationDependencyTamper.sandbox, { recursive: true, force: true });
}

const callerMarkers = prepareSandbox();
try {
  const result = runRelease(callerMarkers, {
    M42_CERTIFICATION_GATES_COMPLETE: '1',
    M42_CERTIFICATION_ATTESTATION: '/tmp/fake-attestation',
    M42_CERTIFICATION_ATTESTATION_NONCE: 'caller-controlled',
  });
  assert.equal(result.status, 0, result.stderr || 'caller-controlled legacy markers must be ignored');
  assert.deepEqual(readCalls(callerMarkers.log), strictReleaseCalls, 'no caller-controlled environment marker may bypass any release gate');
} finally {
  rmSync(callerMarkers.sandbox, { recursive: true, force: true });
}

assert.equal(existsSync(join(root, 'scripts/issue-stage-g-m42-certification-attestation.mjs')), false, 'standalone M42 attestation issuer must be retired');
assert.equal(existsSync(join(root, 'scripts/lib/stage-g-m42-certification-attestation.mjs')), false, 'caller-mintable M42 attestation implementation must be retired');

console.log('Stage G M42 activation gate-ownership verification: PASS (target/release-status authority must agree; non-release cannot certify; direct release owns complete pre/post gates; source-tree and installed-dependency drift fail closed before/after activation; both records transition/rollback together; caller-controlled bypass markers are ignored)');
