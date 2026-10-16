import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'M145-REMOVAL-MANIFEST.json'), 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const expectAbsoluteVerified = (envName, digest) => {
  const p = process.env[envName];
  if (!p || !path.isAbsolute(p) || !fs.statSync(p, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`${envName} must point to an absolute, existing original certified ZIP`);
  }
  if (sha(p) !== digest) throw new Error(`${envName} original artifact SHA-256 mismatch`);
  execFileSync('unzip', ['-tqq', p], { stdio: 'pipe' });
  return p;
};
const predecessorDir = process.env.M145_PREDECESSOR_DIR;
const predecessor = predecessorDir ? null : expectAbsoluteVerified('M145_PREDECESSOR_ARCHIVE', 'd3cd0a7b34811fed58a54e8fa82cb1835c877ddc0d6f96ac83735df2df39bf9c');
if (predecessorDir) {
  if (!path.isAbsolute(predecessorDir) || !fs.statSync(predecessorDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error('M145_PREDECESSOR_DIR must be an absolute existing Git checkout');
  }
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: predecessorDir, encoding: 'utf8' }).trim();
  if (head !== '994e925898fa7de596050cd06ec68a5a94a7c92b') throw new Error('Predecessor Git commit mismatch');
  const changed = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: predecessorDir, encoding: 'utf8' }).trim();
  if (changed) throw new Error('Predecessor Git tracked source is modified');
}
const m108 = expectAbsoluteVerified('M108_BASELINE_ARCHIVE', '7be24ace31dccca32cdcd806d9e1c6f276b266a34b5d12aad0b4de6deefa5735');
if (manifest.baseReleaseCommit !== '994e925898fa7de596050cd06ec68a5a94a7c92b' ||
    manifest.sourceArchive !== 'WatchdogWorkspace-ISSUE21-V7-UNMERGED-QA-COMPLETE-SOURCE.zip') {
  throw new Error('M145 original predecessor lineage mismatch');
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'm145-pinned-predecessor-'));
try {
  if (predecessor) execFileSync('unzip', ['-q', predecessor, '-d', tmp], { stdio: 'pipe' });
  const predecessorRoot = predecessorDir || tmp;
  const oldManifest = manifest.baselineSha256;
  const names = Object.keys(oldManifest);
  // M145.2: the source ZIP was authored from the Issue #21 QA candidate,
  // which included exactly two not-release-certified M144.17 HF3 handoff files.
  // Neither was merged to the frozen production commit. This is NOT a general
  // missing-file allowance: both original SHA-256 bytes and absence from the
  // production Git tree are mandatory, and every other tracked file is checked.
  const archiveOnlyQA = new Map([
    ['M14417-HF3-CONTINUATION-NOT-RELEASE-CERTIFIED.md', '0bd2f0f98d46da2e1cf309dd02447de2261c3ead33152b9ba0c2dd2f28633bf3'],
    ['M14417-HF3-SHA256-MANIFEST.json', '2bad1d0a01defa350cdb5fc1c8fd3f319e06911bed38fbb815de9a2bf204b228'],
  ]);
  for (const [rel, digest] of archiveOnlyQA) {
    if (oldManifest[rel] !== digest) throw new Error(`Archive-only QA source digest mismatch: ${rel}`);
  }
  let trackedNames = names;
  if (predecessorDir) {
    const tracked = execFileSync('git', ['ls-files', '--cached', '-z'], {
      cwd: predecessorRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    }).split('\0').filter(Boolean);
    trackedNames = names.filter(rel => !archiveOnlyQA.has(rel));
    const want = [...trackedNames].sort();
    const got = [...tracked].sort();
    if (want.length !== got.length || want.some((rel, i) => rel !== got[i])) {
      throw new Error('Production predecessor tracked-file inventory differs from the 2,840-file approved manifest');
    }
    for (const rel of archiveOnlyQA.keys()) {
      if (fs.existsSync(path.join(predecessorRoot, rel))) {
        throw new Error(`QA-only archive file unexpectedly present in production Git checkout: ${rel}`);
      }
    }
  }
  let verified = 0;
  for (const rel of trackedNames) {
    if (rel.startsWith('/') || rel.split('/').includes('..')) throw new Error('Unsafe old manifest path');
    const file = path.join(predecessorRoot, rel);
    if (!fs.statSync(file, { throwIfNoEntry: false })?.isFile() || sha(file) !== oldManifest[rel]) {
      throw new Error(`Predecessor byte drift: ${rel}`);
    }
    verified++;
  }
  execFileSync(process.execPath, ['scripts/verify-m108-login-successor.mjs'], {
    cwd: predecessorRoot, env: { ...process.env, M108_BASELINE_ARCHIVE: m108 }, stdio: 'inherit',
  });
  console.log(`M145 predecessor and frozen historical M108 successor: PASS (${verified} baseline files)`);
  console.log('The historical M108 guard was executed on the authenticated predecessor, NOT bypassed on decommissioned source.');
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
