import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || path.resolve(import.meta.dirname, '../..'));
const excluded = new Set([
  '.git', 'node_modules', 'dist', 'coverage', 'test-results', 'playwright-report',
  'm55-certified-artifacts-upload', 'm56-certified-artifacts-upload', 'm57-certified-artifacts-upload',
]);
const normalizedStateFiles = new Set([
  'config/stage-h-m57-design-foundations-target.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-H-M57-DESIGN-FOUNDATIONS-SEMANTIC-DESIGN-LANGUAGE.md',
  'M57-CONTINUATION-STATE.md',
]);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) files.push(full);
    else if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) files.push(full);
  }
}
walk(root);
files.sort((a, b) => path.relative(root, a).localeCompare(path.relative(root, b)));
const hash = crypto.createHash('sha256');
for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const stat = fs.lstatSync(file);
  hash.update(`${rel}\0${stat.mode & 0o777}\0${stat.isSymbolicLink() ? 'symlink' : 'file'}\0`);
  if (stat.isSymbolicLink()) { hash.update(`${fs.readlinkSync(file)}\0`); continue; }
  if (normalizedStateFiles.has(rel)) {
    let source = fs.readFileSync(file, 'utf8');
    source = source
      .replace("activationState: 'active-certified'", "activationState: 'implementation-complete-pending-certification'")
      .replace('**State:** active-certified', '**State:** implementation-complete-pending-certification')
      .replace('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE', '**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS');
    hash.update(`${source}\0`);
  } else {
    hash.update(fs.readFileSync(file)); hash.update('\0');
  }
}
console.log(hash.digest('hex'));
