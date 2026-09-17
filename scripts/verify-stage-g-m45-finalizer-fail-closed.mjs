import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync as fsSymlink, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const base = 'Work-Management-App-v1.43.2-Stage-G-M45-Certified-Baseline';

function prepare() {
  const sandbox = mkdtempSync(join(tmpdir(), 'wm-m45-finalizer-fail-closed-'));
  const project = join(sandbox, 'project');
  const bin = join(sandbox, 'bin');
  mkdirSync(join(project, 'scripts', 'lib'), { recursive: true });
  mkdirSync(join(project, 'config'), { recursive: true });
  mkdirSync(join(project, 'src'), { recursive: true });
  mkdirSync(bin, { recursive: true });
  for (const [from, to] of [
    ['scripts/finalize-stage-g-m45.sh', 'scripts/finalize-stage-g-m45.sh'],
    ['scripts/lib/stage-g-m45-certification-tree.mjs', 'scripts/lib/stage-g-m45-certification-tree.mjs'],
    ['config/stage-g-m45-boards-collection-route-recovery-target.ts', 'config/stage-g-m45-boards-collection-route-recovery-target.ts'],
    ['config/stage-g-m44-management-authority-consolidation-target.ts', 'config/stage-g-m44-management-authority-consolidation-target.ts'],
    ['RELEASE-STATUS-v1.43.2-STAGE-G-M45-BOARDS-COLLECTION-ROUTE-RECOVERY.md', 'RELEASE-STATUS-v1.43.2-STAGE-G-M45-BOARDS-COLLECTION-ROUTE-RECOVERY.md'],
  ]) cpSync(join(root, from), join(project, to));
  writeFileSync(join(project, 'src', 'm45-certification-source.txt'), 'stable-source\n');
  writeFileSync(join(project, 'src', 'm45-executable-fixture.sh'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(project, 'src', 'm45-executable-fixture.sh'), 0o755);
  try { fsSymlink('m45-certification-source.txt', join(project, 'src', 'm45-source-link')); } catch {}
  return { sandbox, project, bin };
}


function commitFixture(ctx) {
  const git = (...args) => spawnSync('git', args, { cwd: ctx.project, encoding: 'utf8' });
  for (const args of [
    ['init', '-q'],
    ['config', 'user.name', 'M45 Finalizer Fixture'],
    ['config', 'user.email', 'm45-fixture@example.invalid'],
    ['add', '-A'],
    ['commit', '-qm', 'fixture'],
  ]) {
    const result = git(...args);
    assert.equal(result.status, 0, `fixture git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  const rev = git('rev-parse', 'HEAD');
  assert.equal(rev.status, 0, `fixture git rev-parse failed: ${rev.stderr || rev.stdout}`);
  ctx.commit = rev.stdout.trim();
  return ctx.commit;
}

function installNpmStub(ctx, body) {
  const stub = join(ctx.bin, 'npm');
  writeFileSync(stub, `#!/bin/sh\n${body}\n`);
  chmodSync(stub, 0o755);
}

function run(ctx, env = {}) {
  return spawnSync('bash', ['scripts/finalize-stage-g-m45.sh'], {
    cwd: ctx.project,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${ctx.bin}:${process.env.PATH || ''}`, M45_SOURCE_COMMIT: ctx.commit || '0123456789abcdef0123456789abcdef01234567', ...env },
  });
}

function assertNoNewPass(ctx) {
  const out = join(ctx.project, 'm45-certified-artifacts-upload');
  assert.equal(existsSync(join(out, `${base}.zip`)), false, 'failed M45 finalization must not publish a certified ZIP');
  assert.equal(existsSync(join(out, `${base}-PASS.txt`)), false, 'failed M45 finalization must not publish a PASS record');
}

// Case 1: invalid source binding fails before any certification work.
{
  const ctx = prepare();
  try {
    installNpmStub(ctx, 'exit 0');
    commitFixture(ctx);
    const result = run(ctx, { M45_SOURCE_COMMIT: 'not-a-commit' });
    assert.notEqual(result.status, 0, 'invalid commit binding must fail M45 finalization');
    assert.match(`${result.stdout}${result.stderr}`, /invalid M45 source commit binding/i);
    assertNoNewPass(ctx);
  } finally { rmSync(ctx.sandbox, { recursive: true, force: true }); }
}

// Case 2: any required pre-gate failure aborts without replacing prior artifacts.
{
  const ctx = prepare();
  try {
    installNpmStub(ctx, `case "$*" in\n  *boards-collection:browser*) echo simulated-browser-failure >&2; exit 41 ;;\n  *) exit 0 ;;\nesac`);
    const out = join(ctx.project, 'm45-certified-artifacts-upload');
    mkdirSync(out, { recursive: true });
    const prior = join(out, 'prior-certified-sentinel.txt');
    writeFileSync(prior, 'prior-certified-artifact\n');
    commitFixture(ctx);
    const result = run(ctx);
    assert.notEqual(result.status, 0, 'required browser gate failure must fail M45 finalization');
    assert.match(`${result.stdout}${result.stderr}`, /simulated-browser-failure/);
    assert.equal(readFileSync(prior, 'utf8'), 'prior-certified-artifact\n', 'pre-gate failure must preserve prior certified artifacts');
    assertNoNewPass(ctx);
  } finally { rmSync(ctx.sandbox, { recursive: true, force: true }); }
}

// Case 3: source mutation by a nominally successful gate is detected before staging.
{
  const ctx = prepare();
  try {
    installNpmStub(ctx, `if [ ! -f .m45-mutated ]; then\n  printf '%s\\n' 'mutated-during-gate' >> src/m45-certification-source.txt\n  : > .m45-mutated\nfi\nexit 0`);
    commitFixture(ctx);
    const result = run(ctx);
    assert.notEqual(result.status, 0, 'source mutation during pre-gates must fail M45 finalization');
    assert.match(`${result.stdout}${result.stderr}`, /source tree changed during pre-certification gates/i);
    assertNoNewPass(ctx);
  } finally { rmSync(ctx.sandbox, { recursive: true, force: true }); }
}

// Case 4: stable source staging preserves bytes, entry type, and executable mode before promotion.
// The run deliberately stops at the later historical gate after both staging parity checks pass.
{
  const ctx = prepare();
  try {
    installNpmStub(ctx, 'exit 0');
    writeFileSync(join(ctx.project, 'verify-stage-g-m45-boards-collection-route-recovery.mjs'), 'process.exit(0);\n');
    writeFileSync(join(ctx.project, 'verify-project.sh'), '#!/bin/sh\necho reached-post-state-gate\nexit 73\n');
    chmodSync(join(ctx.project, 'verify-project.sh'), 0o755);
    mkdirSync(join(ctx.project, 'node_modules'), { recursive: true });
    commitFixture(ctx);
    const result = run(ctx);
    const output = `${result.stdout}${result.stderr}`;
    assert.equal(result.status, 73, `staging-parity success case must reach the deliberate post-state sentinel failure\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    assert.match(output, /M45 certification tree parity: PASS/i);
    assert.match(output, /reached-post-state-gate/i);
    assert.doesNotMatch(output, /staged active-certified M45 payload does not match/i);
    assertNoNewPass(ctx);
  } finally { rmSync(ctx.sandbox, { recursive: true, force: true }); }
}


// Case 5: certification-tree CLI detection survives a realpath alias. This reproduces the
// macOS /var/folders -> /private/var/folders canonicalization boundary that previously made
// the staged library emit an empty digest even though source/stage parity itself was valid.
{
  const ctx = prepare();
  try {
    const alias = join(ctx.sandbox, 'project-alias');
    fsSymlink(ctx.project, alias, 'dir');
    const script = join('scripts', 'lib', 'stage-g-m45-certification-tree.mjs');
    const direct = spawnSync(process.execPath, [join(ctx.project, script), ctx.project], { encoding: 'utf8' });
    const aliased = spawnSync(process.execPath, [join(alias, script), alias], { encoding: 'utf8' });
    assert.equal(direct.status, 0, `direct certification-tree CLI failed: ${direct.stderr || direct.stdout}`);
    assert.equal(aliased.status, 0, `aliased certification-tree CLI failed: ${aliased.stderr || aliased.stdout}`);
    assert.match(direct.stdout.trim(), /^[a-f0-9]{64}$/i, 'direct certification-tree CLI must emit a SHA-256 digest');
    assert.equal(aliased.stdout.trim(), direct.stdout.trim(), 'realpath-aliased certification-tree CLI must emit the same digest');
  } finally { rmSync(ctx.sandbox, { recursive: true, force: true }); }
}

console.log('Stage G M45 finalizer fail-closed verification: PASS (invalid commit binding, required-gate failure, prior-artifact preservation, source-drift rejection, deterministic staging parity, and realpath-stable certification-tree CLI execution)');
