import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const zip = path.resolve(process.argv[2] || path.join(root, 'm56-certified-artifacts-upload', 'Work-Management-App-v1.43.2-Stage-H-M56-Certified-Baseline.zip'));
const fail = (message) => { console.error(`M56 certified package hygiene FAILED: ${message}`); process.exit(1); };
if (!fs.existsSync(zip)) fail(`missing certified ZIP: ${zip}`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-m56-hygiene-'));
try {
  const unzip = spawnSync('unzip', ['-q', zip, '-d', tmp], { encoding: 'utf8' });
  if (unzip.status !== 0) fail(unzip.stderr || 'unable to extract certified ZIP');
  const dirs = fs.readdirSync(tmp, { withFileTypes: true }).filter((e) => e.isDirectory());
  if (dirs.length !== 1) fail('certified ZIP must contain one root directory');
  const project = path.join(tmp, dirs[0].name);
  const symlink = spawnSync('find', [project, '-type', 'l', '-print', '-quit'], { encoding: 'utf8' });
  if (symlink.stdout.trim()) fail('symbolic link found in payload');
  const envFile = spawnSync('find', [project, '-type', 'f', '-name', '.env*', '!', '-name', '*.example', '-print', '-quit'], { encoding: 'utf8' });
  if (envFile.stdout.trim()) fail('concrete .env file found in payload');
  const secret = spawnSync(process.execPath, [path.join(project, 'scripts/scan-secrets.mjs')], { cwd: project, encoding: 'utf8' });
  if (secret.status !== 0) fail(secret.stderr || secret.stdout || 'secret scan failed');
  const checksums = spawnSync('sha256sum', ['-c', 'CHECKSUMS.sha256'], { cwd: project, encoding: 'utf8' });
  if (checksums.status !== 0) fail('checksum manifest validation failed');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log('M56 certified package hygiene verification: PASS');
