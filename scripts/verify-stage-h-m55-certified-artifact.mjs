import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const out = path.join(root, 'm55-certified-artifacts-upload');
const zip = path.resolve(process.argv[2] || path.join(out, 'Work-Management-App-v1.43.2-Stage-H-M55-Certified-Baseline.zip'));
const pass = path.resolve(process.argv[3] || path.join(out, 'Work-Management-App-v1.43.2-Stage-H-M55-Certified-Baseline-PASS.txt'));
const fail = (message) => { console.error(`M55 certified artifact verification FAILED: ${message}`); process.exit(1); };
if (!fs.existsSync(zip)) fail(`certified ZIP missing: ${zip}`);
if (!fs.existsSync(pass)) fail(`PASS record missing: ${pass}`);
const zipBytes = fs.readFileSync(zip);
const zipSha = crypto.createHash('sha256').update(zipBytes).digest('hex');
const passText = fs.readFileSync(pass, 'utf8');
if (!passText.includes('RESULT: PASS')) fail('PASS record does not declare RESULT: PASS');
if (!passText.includes('CERTIFICATION STATE: active-certified')) fail('PASS record does not declare active-certified');
const match = passText.match(/CERTIFIED ZIP SHA-256:\s*([a-f0-9]{64})/i);
if (!match || match[1].toLowerCase() !== zipSha) fail('PASS-record ZIP SHA-256 does not match artifact');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-m55-artifact-'));
try {
  const unzip = spawnSync('unzip', ['-q', zip, '-d', tmp], { encoding: 'utf8' });
  if (unzip.status !== 0) fail(`ZIP extraction failed: ${unzip.stderr || unzip.stdout}`);
  const entries = fs.readdirSync(tmp, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  if (entries.length !== 1) fail('certified ZIP must contain exactly one repository root directory');
  const project = path.join(tmp, entries[0].name);
  const state = spawnSync(process.execPath, [path.join(project, 'scripts/verify-stage-h-m55-certified-state.mjs'), project], { cwd: project, encoding: 'utf8' });
  if (state.status !== 0) fail(state.stderr || state.stdout || 'staged state verifier failed');
  const checksum = path.join(project, 'CHECKSUMS.sha256');
  if (!fs.existsSync(checksum) || !fs.readFileSync(checksum, 'utf8').trim()) fail('CHECKSUMS.sha256 missing or empty');
  const verifyChecksums = spawnSync('sha256sum', ['-c', 'CHECKSUMS.sha256'], { cwd: project, encoding: 'utf8' });
  if (verifyChecksums.status !== 0) fail('certified payload checksum manifest failed');
  const symlink = spawnSync('find', [project, '-type', 'l', '-print', '-quit'], { encoding: 'utf8' });
  if (symlink.stdout.trim()) fail(`certified payload contains symbolic link: ${symlink.stdout.trim()}`);
  const envFile = spawnSync('find', [project, '-type', 'f', '-name', '.env*', '!', '-name', '*.example', '-print', '-quit'], { encoding: 'utf8' });
  if (envFile.stdout.trim()) fail(`certified payload contains concrete environment file: ${envFile.stdout.trim()}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`M55 certified artifact verification: PASS (zipSha=${zipSha})`);
