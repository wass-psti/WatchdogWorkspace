import assert from 'node:assert/strict';
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const sourceCertifier = join(root, 'scripts/certify-stage-g-m42.sh');
const sourceTarget = join(root, 'config/stage-g-m42-users-rbac-functional-recovery-target.ts');
const sourceReleaseStatus = join(root, 'RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md');

const prepare = () => {
  const sandbox = mkdtempSync(join(tmpdir(), 'wm-m42-certifier-rollback-'));
  const project = join(sandbox, 'project');
  const scriptsDir = join(project, 'scripts');
  const configDir = join(project, 'config');
  const binDir = join(sandbox, 'bin');
  mkdirSync(scriptsDir, { recursive: true });
  mkdirSync(configDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });
  cpSync(sourceCertifier, join(scriptsDir, 'certify-stage-g-m42.sh'));
  const target = join(configDir, 'stage-g-m42-users-rbac-functional-recovery-target.ts');
  cpSync(sourceTarget, target);
  const releaseStatus = join(project, 'RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md');
  cpSync(sourceReleaseStatus, releaseStatus);
  const log = join(sandbox, 'npm.log');
  const npmStub = join(binDir, 'npm');
  writeFileSync(npmStub, `#!/bin/sh\nprintf '%s\\n' "${'$'}*" >> "${log}"\ncase "${'$'}*" in\n  *users-rbac-recovery:activate:release*)\n    if [ "${'$'}{M42_TEST_FAIL_ON:-}" = "run users-rbac-recovery:activate:release" ]; then exit 42; fi\n    sed "s/activationState:'implementation-complete-pending-certification'/activationState:'active-certified'/" config/stage-g-m42-users-rbac-functional-recovery-target.ts > config/.m42-target.tmp\n    /bin/mv config/.m42-target.tmp config/stage-g-m42-users-rbac-functional-recovery-target.ts\n    awk 'index($0, "- **State:**") == 1 { $0 = "- **State:** active-certified" } { print }' RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md > .m42-status.tmp\n    /bin/mv .m42-status.tmp RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md\n    exit 0\n    ;;\n  *users-rbac-recovery:status*)\n    if [ "${'$'}{M42_TEST_FAIL_ON:-}" = "run users-rbac-recovery:status" ]; then exit 42; fi\n    echo 'Stage G M42 state: active-certified'\n    exit 0\n    ;;\nesac\nexit 0\n`);
  chmodSync(npmStub, 0o755);
  return { sandbox, project, binDir, target, releaseStatus, original: readFileSync(target, 'utf8'), originalReleaseStatus: readFileSync(releaseStatus, 'utf8'), log };
};

const run = (ctx, env = {}) => spawnSync('bash', ['scripts/certify-stage-g-m42.sh'], {
  cwd: ctx.project,
  encoding: 'utf8',
  env: { ...process.env, PATH: `${ctx.binDir}:${process.env.PATH || ''}`, ...env },
});
const calls = (ctx) => readFileSync(ctx.log, 'utf8').trim().split(/\n+/).filter(Boolean);

const activationFailure = prepare();
try {
  const result = run(activationFailure, { M42_TEST_FAIL_ON: 'run users-rbac-recovery:activate:release' });
  assert.notEqual(result.status, 0, 'release-activation transaction failure must fail dedicated certification');
  assert.equal(readFileSync(activationFailure.target, 'utf8'), activationFailure.original, 'activation failure must preserve the exact pre-certification target');
  assert.equal(readFileSync(activationFailure.releaseStatus, 'utf8'), activationFailure.originalReleaseStatus, 'activation failure must preserve the exact pre-certification release-status record');
  assert.deepEqual(calls(activationFailure), ['run users-rbac-recovery:activate:release'], 'certifier must stop at failed release activation transaction');
} finally {
  rmSync(activationFailure.sandbox, { recursive: true, force: true });
}

const statusFailure = prepare();
try {
  const result = run(statusFailure, { M42_TEST_FAIL_ON: 'run users-rbac-recovery:status' });
  assert.notEqual(result.status, 0, 'post-transaction status failure must fail dedicated certification');
  assert.equal(readFileSync(statusFailure.target, 'utf8'), statusFailure.original, 'status failure must restore the exact pre-certification target');
  assert.equal(readFileSync(statusFailure.releaseStatus, 'utf8'), statusFailure.originalReleaseStatus, 'status failure must restore the exact pre-certification release-status record');
  assert.deepEqual(calls(statusFailure), ['run users-rbac-recovery:activate:release', 'run users-rbac-recovery:status'], 'certifier must verify state after the source-certification transaction');
  assert.match(`${result.stdout}${result.stderr}`, /restored the pre-certification activation target and release-status record/i, 'certifier rollback must report restoration of both authoritative records');
} finally {
  rmSync(statusFailure.sandbox, { recursive: true, force: true });
}

const success = prepare();
try {
  const result = run(success);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(readFileSync(success.target, 'utf8'), /activationState:'active-certified'/, 'successful dedicated certification must retain active-certified');
  assert.match(readFileSync(success.releaseStatus, 'utf8'), /- \*\*State:\*\* active-certified/, 'successful dedicated certification must retain synchronized active-certified release-status state');
  assert.deepEqual(calls(success), ['run users-rbac-recovery:activate:release', 'run users-rbac-recovery:status'], 'dedicated certifier must delegate the complete source-certification transaction to release activation and verify final state');
} finally {
  rmSync(success.sandbox, { recursive: true, force: true });
}

console.log('Stage G M42 dedicated certifier rollback verification: PASS (release activation is the complete source-certification transaction; target and release-status state stay synchronized and are restored together on wrapper failure)');
