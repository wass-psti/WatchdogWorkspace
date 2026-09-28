import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const out = path.join(root, 'm56-certified-artifacts-upload');
const zip = path.join(out, 'Work-Management-App-v1.43.2-Stage-H-M56-Certified-Baseline.zip');
const pass = path.join(out, 'Work-Management-App-v1.43.2-Stage-H-M56-Certified-Baseline-PASS.txt');
const fail = (message) => { console.error(`M56 final checkpoint FAILED: ${message}`); process.exit(1); };
if (!fs.existsSync(zip) || !fs.existsSync(pass)) fail('certified ZIP and PASS record must both exist');
for (const [label, script, args] of [
  ['artifact', 'scripts/verify-stage-h-m56-certified-artifact.mjs', [zip, pass]],
  ['package hygiene', 'scripts/verify-stage-h-m56-certified-package-hygiene.mjs', [zip]],
]) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) fail(`${label} verification failed: ${result.stderr || result.stdout}`);
}
const passText = fs.readFileSync(pass, 'utf8');
if (!/CERTIFIED SOURCE TREE SHA-256:\s*[a-f0-9]{64}/i.test(passText)) fail('PASS record lacks certified source-tree SHA-256');
if (!passText.includes('M56 SEMANTICS VERSION: 1.43.2-m56-v1')) fail('PASS record semantics version mismatch');
console.log('M56 final checkpoint validation: PASS');
