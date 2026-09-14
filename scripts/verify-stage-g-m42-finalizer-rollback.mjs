import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const sourceFinalizer = join(root, 'scripts/finalize-stage-g-m42.sh');
const sourceTarget = join(root, 'config/stage-g-m42-users-rbac-functional-recovery-target.ts');
const sourceReleaseStatus = join(root, 'RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md');
const sourceSecretScanner = join(root, 'scripts/scan-secrets.mjs');
const sourceCertificationTree = join(root, 'scripts/lib/stage-g-m42-certification-tree.mjs');
const finalName = 'Work-Management-App-v1.43.2-Stage-G-M42-Certified-Baseline';

const prepare = () => {
  const sandbox = mkdtempSync(join(tmpdir(), 'wm-m42-finalizer-rollback-'));
  const project = join(sandbox, 'project');
  const scriptsDir = join(project, 'scripts');
  const configDir = join(project, 'config');
  const binDir = join(sandbox, 'bin');
  mkdirSync(scriptsDir, { recursive: true });
  mkdirSync(join(scriptsDir, 'lib'), { recursive: true });
  mkdirSync(configDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });
  cpSync(sourceFinalizer, join(scriptsDir, 'finalize-stage-g-m42.sh'));
  cpSync(sourceSecretScanner, join(scriptsDir, 'scan-secrets.mjs'));
  cpSync(sourceCertificationTree, join(scriptsDir, 'lib', 'stage-g-m42-certification-tree.mjs'));
  const target = join(configDir, 'stage-g-m42-users-rbac-functional-recovery-target.ts');
  const releaseStatus = join(project, 'RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md');
  cpSync(sourceTarget, target);
  cpSync(sourceReleaseStatus, releaseStatus);
  mkdirSync(join(project, 'src'), { recursive: true });
  const sourceSentinel = join(project, 'src', 'm42-certification-source.txt');
  writeFileSync(sourceSentinel, 'certified-source-v1\n');
  return {
    sandbox,
    project,
    binDir,
    target,
    releaseStatus,
    sourceSentinel,
    original: readFileSync(target, 'utf8'),
    originalReleaseStatus: readFileSync(releaseStatus, 'utf8'),
  };
};

const installNpmStub = (ctx) => {
  const npmStub = join(ctx.binDir, 'npm');
  writeFileSync(npmStub, `#!/bin/sh\ncase "${'$'}*" in\n  *users-rbac-recovery:certify*)\n    sed "s/activationState:'implementation-complete-pending-certification'/activationState:'active-certified'/" config/stage-g-m42-users-rbac-functional-recovery-target.ts > config/.m42-target.tmp\n    /bin/mv config/.m42-target.tmp config/stage-g-m42-users-rbac-functional-recovery-target.ts\n    awk 'index($0, "- **State:**") == 1 { $0 = "- **State:** active-certified" } { print }' RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md > .m42-release-status.tmp\n    /bin/mv .m42-release-status.tmp RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md\n    if [ "${'$'}{M42_TEST_MUTATE_SOURCE:-0}" = "1" ]; then printf '%s\\n' 'tampered-during-dedicated-certification' >> src/m42-certification-source.txt; fi\n    exit 0\n    ;;\n  *users-rbac-recovery:status*)\n    echo 'Stage G M42 state: active-certified'\n    exit 0\n    ;;\n  *) exit 0 ;;\nesac\n`);
  chmodSync(npmStub, 0o755);
};

const runFinalizer = (ctx, env = {}) => spawnSync('bash', ['scripts/finalize-stage-g-m42.sh'], {
  cwd: ctx.project,
  encoding: 'utf8',
  env: { ...process.env, PATH: `${ctx.binDir}:${process.env.PATH || ''}`, ...env },
});

const assertNoStagingLeftovers = (sandbox) => {
  assert.equal(readdirSync(sandbox).some((name) => name.startsWith('.m42-finalize.')), false, 'failed finalization must remove staging directories');
};

// Case 1: artifact construction fails after dedicated certification.
const downstream = prepare();
try {
  installNpmStub(downstream);
  const nodeStub = join(downstream.binDir, 'node');
  writeFileSync(nodeStub, `#!/bin/sh\nif [ "${'$'}1" = "--version" ]; then echo v22.16.0; exit 0; fi\nexit 0\n`);
  chmodSync(nodeStub, 0o755);
  const tarStub = join(downstream.binDir, 'tar');
  writeFileSync(tarStub, '#!/bin/sh\necho simulated certified baseline construction failure >&2\nexit 42\n');
  chmodSync(tarStub, 0o755);

  const result = runFinalizer(downstream);
  assert.notEqual(result.status, 0, 'simulated artifact construction failure must fail M42 finalization');
  assert.equal(readFileSync(downstream.target, 'utf8'), downstream.original, 'failed finalization must restore the exact pre-certification target');
  assert.equal(readFileSync(downstream.releaseStatus, 'utf8'), downstream.originalReleaseStatus, 'failed finalization must restore the exact pre-certification release-status record');
  assert.equal(existsSync(join(downstream.sandbox, finalName)), false, 'failed finalization must not create a certified baseline directory');
  assert.equal(existsSync(join(downstream.sandbox, `${finalName}.zip`)), false, 'failed finalization must not create a certified ZIP');
  assert.equal(existsSync(join(downstream.sandbox, `${finalName}-PASS.txt`)), false, 'failed finalization must not create a PASS record');
  assert.match(`${result.stdout}${result.stderr}`, /restored the pre-certification activation target/i, 'rollback must report target restoration');
  assertNoStagingLeftovers(downstream.sandbox);
} finally {
  rmSync(downstream.sandbox, { recursive: true, force: true });
}

// Case 2: packaging/integrity fails while a previous certified baseline exists.
// The prior known-good artifacts must survive byte-for-byte.
const packaging = prepare();
try {
  installNpmStub(packaging);
  const nodeStub = join(packaging.binDir, 'node');
  writeFileSync(nodeStub, `#!/bin/sh\nif [ "${'$'}1" = "--version" ]; then echo v22.16.0; exit 0; fi\nexit 0\n`);
  chmodSync(nodeStub, 0o755);
  const unzipStub = join(packaging.binDir, 'unzip');
  writeFileSync(unzipStub, '#!/bin/sh\necho simulated staged ZIP integrity failure >&2\nexit 73\n');
  chmodSync(unzipStub, 0o755);

  const priorDir = join(packaging.sandbox, finalName);
  const priorZip = join(packaging.sandbox, `${finalName}.zip`);
  const priorPass = join(packaging.sandbox, `${finalName}-PASS.txt`);
  mkdirSync(priorDir, { recursive: true });
  writeFileSync(join(priorDir, 'sentinel.txt'), 'previous-certified-directory\n');
  writeFileSync(priorZip, 'previous-certified-zip\n');
  writeFileSync(priorPass, 'previous-certified-pass\n');

  const result = runFinalizer(packaging);
  assert.notEqual(result.status, 0, 'simulated staged ZIP failure must fail M42 finalization');
  assert.equal(readFileSync(packaging.target, 'utf8'), packaging.original, 'packaging failure must restore the exact pre-certification target');
  assert.equal(readFileSync(packaging.releaseStatus, 'utf8'), packaging.originalReleaseStatus, 'packaging failure must restore the exact pre-certification release-status record');
  assert.equal(readFileSync(join(priorDir, 'sentinel.txt'), 'utf8'), 'previous-certified-directory\n', 'prior certified directory must be preserved');
  assert.equal(readFileSync(priorZip, 'utf8'), 'previous-certified-zip\n', 'prior certified ZIP must be preserved byte-for-byte');
  assert.equal(readFileSync(priorPass, 'utf8'), 'previous-certified-pass\n', 'prior PASS record must be preserved byte-for-byte');
  assert.match(`${result.stdout}${result.stderr}`, /preserved prior certified artifacts/i, 'rollback must report preservation of prior artifacts');
  assertNoStagingLeftovers(packaging.sandbox);
} finally {
  rmSync(packaging.sandbox, { recursive: true, force: true });
}


// Case 3: dedicated certification mutates source bytes after evidence was captured.
// The finalizer must detect source/evidence drift before staging any certified artifact.
const sourceDrift = prepare();
try {
  installNpmStub(sourceDrift);
  const nodeStub = join(sourceDrift.binDir, 'node');
  writeFileSync(nodeStub, `#!/bin/sh
if [ "${'$'}1" = "--version" ]; then echo v22.16.0; exit 0; fi
exec "${process.execPath}" "${'$'}@"
`);
  chmodSync(nodeStub, 0o755);
  const result = runFinalizer(sourceDrift, { M42_TEST_MUTATE_SOURCE: '1' });
  assert.notEqual(result.status, 0, 'source mutation during dedicated certification must fail finalization');
  assert.equal(readFileSync(sourceDrift.target, 'utf8'), sourceDrift.original, 'source-drift failure must restore the exact pre-certification target');
  assert.equal(readFileSync(sourceDrift.releaseStatus, 'utf8'), sourceDrift.originalReleaseStatus, 'source-drift failure must restore the exact release-status record');
  assert.equal(existsSync(join(sourceDrift.sandbox, finalName)), false, 'source-drift failure must not publish a certified directory');
  assert.equal(existsSync(join(sourceDrift.sandbox, `${finalName}.zip`)), false, 'source-drift failure must not publish a certified ZIP');
  assert.equal(existsSync(join(sourceDrift.sandbox, `${finalName}-PASS.txt`)), false, 'source-drift failure must not publish a PASS record');
  assert.match(`${result.stdout}${result.stderr}`, /source tree changed during dedicated certification/i, 'source-drift failure must identify stale-evidence rejection');
  assertNoStagingLeftovers(sourceDrift.sandbox);
} finally {
  rmSync(sourceDrift.sandbox, { recursive: true, force: true });
}

// Case 4: staged payload secret scanning fails closed before publication.
const payloadSecret = prepare();
try {
  installNpmStub(payloadSecret);
  const nodeStub = join(payloadSecret.binDir, 'node');
  writeFileSync(nodeStub, `#!/bin/sh
if [ "${'$'}1" = "--version" ]; then echo v22.16.0; exit 0; fi
exec "${process.execPath}" "${'$'}@"
`);
  chmodSync(nodeStub, 0o755);
  const token = 'github_' + 'pat_' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  writeFileSync(join(payloadSecret.project, 'shipping-notes.txt'), `temporary_token=${token}\n`);
  const result = runFinalizer(payloadSecret);
  assert.notEqual(result.status, 0, 'secret in staged certified payload must fail finalization');
  assert.equal(readFileSync(payloadSecret.target, 'utf8'), payloadSecret.original, 'payload secret failure must restore the exact pre-certification target');
  assert.equal(readFileSync(payloadSecret.releaseStatus, 'utf8'), payloadSecret.originalReleaseStatus, 'payload secret failure must restore the exact release-status record');
  assert.equal(existsSync(join(payloadSecret.sandbox, finalName)), false, 'payload secret failure must not publish a certified directory');
  assert.equal(existsSync(join(payloadSecret.sandbox, `${finalName}.zip`)), false, 'payload secret failure must not publish a certified ZIP');
  assert.equal(existsSync(join(payloadSecret.sandbox, `${finalName}-PASS.txt`)), false, 'payload secret failure must not publish a PASS record');
  assert.match(`${result.stdout}${result.stderr}`, /High-confidence secret scan: FAIL|GitHub token/i, 'payload secret failure must be identified by the staged secret scan');
  assertNoStagingLeftovers(payloadSecret.sandbox);
} finally {
  rmSync(payloadSecret.sandbox, { recursive: true, force: true });
}

// Case 5: symbolic links are forbidden in the certified payload.
const symlinkPayload = prepare();
try {
  installNpmStub(symlinkPayload);
  const nodeStub = join(symlinkPayload.binDir, 'node');
  writeFileSync(nodeStub, `#!/bin/sh
if [ "${'$'}1" = "--version" ]; then echo v22.16.0; exit 0; fi
exec "${process.execPath}" "${'$'}@"
`);
  chmodSync(nodeStub, 0o755);
  symlinkSync('RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md', join(symlinkPayload.project, 'm42-status-link.md'));
  const result = runFinalizer(symlinkPayload);
  assert.notEqual(result.status, 0, 'symbolic link in staged certified payload must fail finalization');
  assert.equal(readFileSync(symlinkPayload.target, 'utf8'), symlinkPayload.original, 'symlink rejection must restore the exact pre-certification target');
  assert.equal(readFileSync(symlinkPayload.releaseStatus, 'utf8'), symlinkPayload.originalReleaseStatus, 'symlink rejection must restore the exact release-status record');
  assert.equal(existsSync(join(symlinkPayload.sandbox, finalName)), false, 'symlink rejection must not publish a certified directory');
  assert.equal(existsSync(join(symlinkPayload.sandbox, `${finalName}.zip`)), false, 'symlink rejection must not publish a certified ZIP');
  assert.equal(existsSync(join(symlinkPayload.sandbox, `${finalName}-PASS.txt`)), false, 'symlink rejection must not publish a PASS record');
  assert.match(`${result.stdout}${result.stderr}`, /symbolic link detected in staged M42 certified baseline/i, 'symlink rejection must identify the staged payload boundary');
  assertNoStagingLeftovers(symlinkPayload.sandbox);
} finally {
  rmSync(symlinkPayload.sandbox, { recursive: true, force: true });
}

// Case 6: a complete stubbed certification succeeds and leaves published
// artifacts internally consistent. This exercises the post-swap verification
// and committed-cleanup path with the real tar/zip/unzip/shasum tools.
const success = prepare();
try {
  installNpmStub(success);
  const nodeStub = join(success.binDir, 'node');
  writeFileSync(nodeStub, `#!/bin/sh
if [ "${'$'}1" = "--version" ]; then echo v22.16.0; exit 0; fi
exec "${process.execPath}" "${'$'}@"
`);
  chmodSync(nodeStub, 0o755);

  // Seed private/generated artifacts that must never appear in a certified package.
  mkdirSync(join(success.project, '.git'), { recursive: true });
  writeFileSync(join(success.project, '.git', 'config'), 'repository-internal\n');
  writeFileSync(join(success.project, '.env'), 'LOCAL_SECRET=do-not-package\n');
  writeFileSync(join(success.project, '.env.local'), 'LOCAL_OVERRIDE=do-not-package\n');
  writeFileSync(join(success.project, '.env.ci.local'), 'CI_OVERRIDE=do-not-package\n');
  writeFileSync(join(success.project, '.env.production'), 'PRODUCTION_OVERRIDE=do-not-package\n');
  mkdirSync(join(success.project, 'apps', 'nested'), { recursive: true });
  writeFileSync(join(success.project, 'apps', 'nested', '.env.staging'), 'NESTED_OVERRIDE=do-not-package\n');
  writeFileSync(join(success.project, '.env.example'), 'PUBLIC_TEMPLATE=placeholder\n');
  writeFileSync(join(success.project, 'npm-debug.log'), 'debug log\n');
  for (const generated of ['node_modules', '.vitest', 'm37-evidence', 'dist', 'coverage', 'test-results', 'playwright-report', '.vite']) {
    mkdirSync(join(success.project, generated), { recursive: true });
    writeFileSync(join(success.project, generated, 'sentinel.txt'), 'generated/private\n');
  }

  const result = runFinalizer(success);
  assert.equal(result.status, 0, `${result.stdout}
${result.stderr}`);
  assert.match(readFileSync(success.target, 'utf8'), /activationState:'active-certified'/, 'successful finalization must preserve the certified activation state');
  assert.match(readFileSync(success.releaseStatus, 'utf8'), /- \*\*State:\*\* active-certified/, 'successful finalization must synchronize the working-tree release status');
  const publishedDir = join(success.sandbox, finalName);
  const publishedZip = join(success.sandbox, `${finalName}.zip`);
  const publishedPass = join(success.sandbox, `${finalName}-PASS.txt`);
  assert.equal(existsSync(publishedDir), true, 'successful finalization must publish the certified baseline directory');
  assert.equal(existsSync(publishedZip), true, 'successful finalization must publish the certified ZIP');
  assert.equal(existsSync(publishedPass), true, 'successful finalization must publish the PASS record');
  assert.match(readFileSync(publishedPass, 'utf8'), /Milestone 42 certification: PASS/, 'published PASS record must declare M42 PASS');
  const publishedStatus = readFileSync(join(publishedDir, 'RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md'), 'utf8');
  assert.match(publishedStatus, /- \*\*State:\*\* active-certified/, 'published baseline release status must agree with the certified target');
  assert.match(publishedStatus, /Final certified baseline/, 'published baseline must record the final certification transaction');
  for (const forbidden of ['.git', '.env', '.env.local', '.env.ci.local', '.env.production', 'npm-debug.log', 'node_modules', '.vitest', 'm37-evidence', 'dist', 'coverage', 'test-results', 'playwright-report', '.vite']) {
    assert.equal(existsSync(join(publishedDir, forbidden)), false, `certified baseline must exclude ${forbidden}`);
  }
  assert.equal(existsSync(join(publishedDir, 'apps', 'nested', '.env.staging')), false, 'certified baseline must exclude nested concrete environment files');
  assert.equal(existsSync(join(publishedDir, '.env.example')), true, 'certified baseline must retain environment templates');
  assertNoStagingLeftovers(success.sandbox);
} finally {
  rmSync(success.sandbox, { recursive: true, force: true });
}

console.log('Stage G M42 finalizer rollback verification: PASS (target + release-status rollback are transactional; prior artifacts survive staged failure; certification source drift fails closed; staged payload secrets fail closed; symlinks are rejected; successful publication excludes private/generated/local-env files and commits synchronized active-certified records)');
