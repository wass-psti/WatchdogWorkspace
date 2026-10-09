import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// This is a successor-only exception for the exact M108 login correction.
// It does not change any historical source guard, or exempt another source.
const baselineArchiveSha = '7be24ace31dccca32cdcd806d9e1c6f276b266a34b5d12aad0b4de6deefa5735';
const baselineAuthSha = 'a41afa9f83804918b5a4147f6de15f5cf29fb54f2cbb47f918624c2abbd28730';
const correctiveAuthSha = 'b93073bd4b5a37359e5c8d499deb7f63a5e8edf448170ec4bb57aba30c76c511';
const rootName = 'Work-Management-App-v1.43.2-Stage-I-M108-Material-Tracker-Security-Corrective-Certified';
const sha = data => crypto.createHash('sha256').update(data).digest('hex');

export function approvedSuccessorAuth(root) {
  const archive = process.env.M108_BASELINE_ARCHIVE;
  if (!archive || !path.isAbsolute(archive)) return false;
  try {
    if (sha(fs.readFileSync(archive)) !== baselineArchiveSha) return false;
    const predecessor = execFileSync('unzip', [
      '-p', archive, `${rootName}/assets/js/core/auth.ts`,
    ], { maxBuffer: 10 * 1024 * 1024 });
    if (sha(predecessor) !== baselineAuthSha) return false;
    const current = fs.readFileSync(path.join(root, 'assets/js/core/auth.ts'));
    if (sha(current) !== correctiveAuthSha) return false;
    return true;
  } catch {
    return false;
  }
}

// These four paths are inherited M108 changes since their earlier M88/M89
// snapshot manifests. Their exact bytes must match the certified M108 ZIP.
// No arbitrary historical drift can satisfy this check.
const inheritedM108ProtectedPaths = new Set([
  'supabase/schema.sql',
  'apps/tradelink/app.v1.42.0-wm1.js',
  'assets/js/core/platform.ts',
  'tests/modern/e2e/settings-functional-recovery.spec.mjs',
]);
export function approvedM108InheritedAuthority(root, relative) {
  if (relative === 'assets/js/core/auth.ts') return approvedSuccessorAuth(root);
  if (!inheritedM108ProtectedPaths.has(relative)) return false;
  const archive = process.env.M108_BASELINE_ARCHIVE;
  if (!archive || !path.isAbsolute(archive)) return false;
  try {
    if (sha(fs.readFileSync(archive)) !== baselineArchiveSha) return false;
    const original = execFileSync('unzip', ['-p', archive, `${rootName}/${relative}`], {maxBuffer: 20 * 1024 * 1024});
    const current = fs.readFileSync(path.join(root, relative));
    return original.equals(current);
  } catch { return false; }
}
