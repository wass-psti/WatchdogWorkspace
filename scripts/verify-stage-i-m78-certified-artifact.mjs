import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const out = path.join(root, 'm78-certified-artifacts-upload');
const zip = path.resolve(process.argv[2] || path.join(out, 'Work-Management-App-v1.43.2-Stage-I-M78-Certified-Baseline.zip'));
const pass = path.resolve(process.argv[3] || path.join(out, 'Work-Management-App-v1.43.2-Stage-I-M78-Certified-Baseline-PASS.txt'));
const fail = (message) => { console.error(`M78 certified artifact verification FAILED: ${message}`); process.exit(1); };
if (!fs.existsSync(zip)) fail(`certified ZIP missing: ${zip}`);
if (!fs.existsSync(pass)) fail(`PASS record missing: ${pass}`);
const zipSha = crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex');
const passText = fs.readFileSync(pass, 'utf8');
if (!passText.includes('RESULT: PASS')) fail('PASS record does not declare RESULT: PASS');
if (!passText.includes('CERTIFICATION STATE: active-certified')) fail('PASS record does not declare active-certified');
const zipMatch = passText.match(/CERTIFIED ZIP SHA-256:\s*([a-f0-9]{64})/i);
if (!zipMatch || zipMatch[1].toLowerCase() !== zipSha) fail('PASS-record ZIP SHA-256 does not match artifact');
const sourceMatch = passText.match(/CERTIFIED SOURCE TREE SHA-256:\s*([a-f0-9]{64})/i);
if (!sourceMatch) fail('PASS record is missing certified source tree SHA-256');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-m78-artifact-'));
try {
  const unzip = spawnSync('unzip', ['-q', zip, '-d', tmp], { encoding: 'utf8' });
  if (unzip.status !== 0) fail(`ZIP extraction failed: ${unzip.stderr || unzip.stdout}`);
  const dirs = fs.readdirSync(tmp, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  if (dirs.length !== 1) fail('certified ZIP must contain exactly one repository root directory');
  const project = path.join(tmp, dirs[0].name);
  const state = spawnSync(process.execPath, [path.join(project, 'scripts/verify-stage-i-m78-certified-state.mjs'), project], { cwd: project, encoding: 'utf8' });
  if (state.status !== 0) fail(state.stderr || state.stdout || 'certified-state verifier failed');
  const noDrift = spawnSync(process.execPath, [path.join(project, 'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs')], { cwd: project, encoding: 'utf8' });
  if (noDrift.status !== 0) fail(noDrift.stderr || noDrift.stdout || 'M78 no-visual-drift verification failed in certified payload');
  const source = spawnSync(process.execPath, [path.join(project, 'scripts/lib/stage-i-m78-checkpoint-tree.mjs'), project], { cwd: project, encoding: 'utf8' });
  if (source.status !== 0) fail(source.stderr || source.stdout || 'M78 checkpoint source verifier failed');
  if (source.stdout.trim() !== sourceMatch[1].toLowerCase()) fail('certified payload source SHA does not match PASS record');
  if (!fs.existsSync(path.join(project, 'CHECKSUMS.sha256'))) fail('CHECKSUMS.sha256 missing from certified payload');
  const checksums = spawnSync('sha256sum', ['-c', 'CHECKSUMS.sha256'], { cwd: project, encoding: 'utf8' });
  if (checksums.status !== 0) fail('certified payload checksum manifest failed');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`M78 certified artifact verification: PASS (zipSha=${zipSha})`);
