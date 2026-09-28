import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const base = 'Work-Management-App-v1.43.2-Stage-H-M55-Certified-Baseline';
const fixtureFiles = [
  'scripts/finalize-stage-h-m55.sh',
  'scripts/verify-stage-h-m55-release.sh',
  'scripts/verify-stage-h-m55-certified-state.mjs',
  'scripts/verify-stage-h-m55-certified-artifact.mjs',
  'scripts/verify-stage-h-m55-certified-package-hygiene.mjs',
  'scripts/verify-stage-h-m55-final-checkpoint.mjs',
  'scripts/lib/stage-h-m55-certification-tree.mjs',
  'config/stage-h-m55-full-stack-folder-structure-target.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-H-M55-FULL-STACK-FOLDER-STRUCTURE.md',
  'M55-CONTINUATION-STATE.md',
];

function prepare() {
  const sandbox = mkdtempSync(join(tmpdir(), 'wm-m55-finalizer-'));
  const project = join(sandbox, 'project');
  const bin = join(sandbox, 'bin');
  mkdirSync(project, { recursive: true });
  mkdirSync(bin, { recursive: true });
  for (const relative of fixtureFiles) {
    const target = join(project, relative);
    mkdirSync(resolve(target, '..'), { recursive: true });
    cpSync(join(root, relative), target);
  }

  // The repository authority is active-certified after M55 completion. The
  // finalizer itself is intentionally defined for the pre-certification state,
  // so every regression scenario must exercise an isolated pending-state
  // fixture instead of depending on or mutating the live certified authority.
  const fixtureStateFiles = [
    'config/stage-h-m55-full-stack-folder-structure-target.ts',
    'RELEASE-STATUS-v1.43.2-STAGE-H-M55-FULL-STACK-FOLDER-STRUCTURE.md',
    'M55-CONTINUATION-STATE.md',
  ];
  for (const relative of fixtureStateFiles) {
    const file = join(project, relative);
    let source = readFileSync(file, 'utf8');
    source = source
      .replace("activationState: 'active-certified'", "activationState: 'implementation-complete-pending-certification'")
      .replace('**State:** active-certified', '**State:** implementation-complete-pending-certification')
      .replace(
        '**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE',
        '**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS',
      );
    writeFileSync(file, source);
  }

  chmodSync(join(project, 'scripts/finalize-stage-h-m55.sh'), 0o755);
  chmodSync(join(project, 'scripts/verify-stage-h-m55-release.sh'), 0o755);
  mkdirSync(join(project, 'src'), { recursive: true });
  writeFileSync(join(project, 'src/fixture.txt'), 'stable\n');
  writeFileSync(join(project, 'scripts/scan-secrets.mjs'), "console.log('fixture secret scan: PASS');\n");
  writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'm55-fixture', version: '1.0.0', private: true }, null, 2));
  return { sandbox, project, bin };
}

function installNpm(ctx, body) {
  const npm = join(ctx.bin, 'npm');
  writeFileSync(npm, `#!/bin/bash\nset -e\n${body}\n`);
  chmodSync(npm, 0o755);
}

function run(ctx) {
  return spawnSync('bash', ['scripts/finalize-stage-h-m55.sh'], {
    cwd: ctx.project,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${ctx.bin}:${process.env.PATH || ''}` },
  });
}

function seedPrior(ctx) {
  const out = join(ctx.project, 'm55-certified-artifacts-upload');
  mkdirSync(out, { recursive: true });
  const prior = join(out, 'prior-certified-sentinel.txt');
  writeFileSync(prior, 'prior\n');
  return prior;
}

function assertNoNewCertification(ctx) {
  const out = join(ctx.project, 'm55-certified-artifacts-upload');
  assert.equal(existsSync(join(out, `${base}.zip`)), false, 'failed M55 finalizer must not publish certified ZIP');
  assert.equal(existsSync(join(out, `${base}-PASS.txt`)), false, 'failed M55 finalizer must not publish PASS record');
}

// Dependency certification failure must preserve prior certified artifacts.
{
  const ctx = prepare();
  try {
    const prior = seedPrior(ctx);
    installNpm(ctx, 'echo simulated-dependency-certification-failure >&2; exit 41');
    const result = run(ctx);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /simulated-dependency-certification-failure/);
    assert.equal(readFileSync(prior, 'utf8'), 'prior\n');
    assertNoNewCertification(ctx);
  } finally { rmSync(ctx.sandbox, { recursive: true, force: true }); }
}

// Browser/release gate failure must preserve prior certified artifacts.
{
  const ctx = prepare();
  try {
    const prior = seedPrior(ctx);
    installNpm(ctx, 'if [[ "$*" == *"full-stack-structure:browser"* ]]; then echo simulated-browser-failure >&2; exit 42; fi; exit 0');
    const result = run(ctx);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /simulated-browser-failure/);
    assert.equal(readFileSync(prior, 'utf8'), 'prior\n');
    assertNoNewCertification(ctx);
  } finally { rmSync(ctx.sandbox, { recursive: true, force: true }); }
}

// A successful-looking gate that mutates source must fail before staging/publication.
{
  const ctx = prepare();
  try {
    installNpm(ctx, 'if [[ "$*" == *"full-stack-structure:test"* ]] && [ ! -f .mutated ]; then echo mutation >> src/fixture.txt; touch .mutated; fi; exit 0');
    const result = run(ctx);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /source tree changed during pre-certification gates/i);
    assertNoNewCertification(ctx);
  } finally { rmSync(ctx.sandbox, { recursive: true, force: true }); }
}

// Stable gates must produce a self-verifying active-certified artifact and replace prior output only at the end.
{
  const ctx = prepare();
  try {
    const prior = seedPrior(ctx);
    installNpm(ctx, 'exit 0');
    const result = run(ctx);
    assert.equal(result.status, 0, `successful fixture finalization failed:\n${result.stdout}\n${result.stderr}`);
    const out = join(ctx.project, 'm55-certified-artifacts-upload');
    assert.equal(existsSync(join(out, `${base}.zip`)), true);
    assert.equal(existsSync(join(out, `${base}-PASS.txt`)), true);
    assert.equal(existsSync(prior), false, 'successful atomic publication must replace prior output only after validation');
    assert.match(result.stdout, /STAGE H M55 FULL-STACK FOLDER STRUCTURE CERTIFICATION: PASS/);
  } finally { rmSync(ctx.sandbox, { recursive: true, force: true }); }
}

console.log('Stage H M55 finalizer fail-closed verification: PASS (dependency failure, browser failure, source-drift rejection, prior-artifact preservation, staged active-certified parity, artifact hygiene, and atomic publication)');
