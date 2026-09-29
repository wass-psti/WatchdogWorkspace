import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = path.resolve(process.argv[2] || process.cwd());
const treeScript = path.join(root, 'scripts/lib/stage-h-m77-certification-tree.mjs');
const excluded = new Set([
  '.git', 'node_modules', 'dist', 'coverage', 'test-results', 'playwright-report',
  'm55-certified-artifacts-upload', 'm56-certified-artifacts-upload',
  'm57-certified-artifacts-upload', 'm58-certified-artifacts-upload',
  'm59-certified-artifacts-upload', 'm60-certified-artifacts-upload',
  'm61-certified-artifacts-upload', 'm62-certified-artifacts-upload',
  'm63-certified-artifacts-upload', 'm64-certified-artifacts-upload',
  'm65-certified-artifacts-upload', 'm66-certified-artifacts-upload',
  'm67-certified-artifacts-upload', 'm68-certified-artifacts-upload',
  'm69-certified-artifacts-upload', 'm70-certified-artifacts-upload',
  'm71-certified-artifacts-upload', 'm72-certified-artifacts-upload',
  'm73-certified-artifacts-upload', 'm74-certified-artifacts-upload',
  'm75-certified-artifacts-upload', 'm76-certified-artifacts-upload',
  'm77-certified-artifacts-upload'
]);

function fail(message) {
  console.error(`M77 Git-restorable source-identity roundtrip FAILED: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    stdio: options.capture === false ? 'inherit' : 'pipe'
  });
  if (result.status !== 0) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join('\n').trim();
    fail(`${command} ${args.join(' ')} exited ${result.status}${detail ? `\n${detail}` : ''}`);
  }
  return (result.stdout || '').trim();
}

function sourceSha(directory) {
  return run(process.execPath, [treeScript, directory]);
}

function copyRepository(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isSymbolicLink()) {
      fs.symlinkSync(fs.readlinkSync(from), to);
    } else if (entry.isDirectory()) {
      copyRepository(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
      fs.chmodSync(to, fs.statSync(from).mode & 0o777);
    }
  }
}

if (!fs.existsSync(treeScript)) fail(`source-identity implementation missing: ${treeScript}`);
run('git', ['--version']);

const expected = sourceSha(root);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-m77-git-roundtrip-'));
try {
  const seed = path.join(temp, 'seed');
  const restored = path.join(temp, 'restored');
  copyRepository(root, seed);

  run('git', ['init', '-q'], { cwd: seed });
  run('git', ['config', 'user.name', 'M77 Certification Harness'], { cwd: seed });
  run('git', ['config', 'user.email', 'm77-certification@invalid.local'], { cwd: seed });
  run('git', ['add', '--all'], { cwd: seed });
  run('git', ['commit', '-q', '-m', 'M77 Git-restorable source identity fixture'], { cwd: seed });

  const commit = run('git', ['rev-parse', 'HEAD'], { cwd: seed });
  run('git', ['cat-file', '-e', `${commit}^{commit}`], { cwd: seed });

  // Clone from the repository that actually owns the commit object. This deliberately
  // avoids synthesizing refs to objects that have not been materialized locally.
  run('git', ['clone', '-q', '--no-hardlinks', seed, restored], { cwd: temp });
  const restoredCommit = run('git', ['rev-parse', 'HEAD'], { cwd: restored });
  if (restoredCommit !== commit) fail(`restored commit mismatch: expected ${commit}, found ${restoredCommit}`);
  run('git', ['cat-file', '-e', `${restoredCommit}^{commit}`], { cwd: restored });

  const actual = sourceSha(restored);
  if (actual !== expected) {
    fail(`source identity mismatch after Git roundtrip: expected ${expected}, found ${actual}`);
  }

  console.log('M77 Git-restorable source-identity roundtrip: PASS');
  console.log(`Source SHA-256: ${expected}`);
  console.log(`Roundtrip commit: ${commit}`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
