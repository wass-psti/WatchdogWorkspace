import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || path.resolve(import.meta.dirname, '../..'));
const excluded = new Set([
  '.git', 'node_modules', 'dist', 'coverage', 'test-results', 'playwright-report', 'CHECKSUMS.sha256',
  '.wm-modern-test-toolchain',
  'm55-certified-artifacts-upload', 'm56-certified-artifacts-upload', 'm57-certified-artifacts-upload',
  'm58-certified-artifacts-upload', 'm59-certified-artifacts-upload', 'm60-certified-artifacts-upload',
  'm61-certified-artifacts-upload', 'm62-certified-artifacts-upload', 'm63-certified-artifacts-upload',
  'm64-certified-artifacts-upload', 'm65-certified-artifacts-upload', 'm66-certified-artifacts-upload',
  'm67-certified-artifacts-upload', 'm68-certified-artifacts-upload', 'm69-certified-artifacts-upload',
  'm70-certified-artifacts-upload', 'm71-certified-artifacts-upload', 'm72-certified-artifacts-upload',
  'm73-certified-artifacts-upload', 'm74-certified-artifacts-upload', 'm75-certified-artifacts-upload',
  'm76-certified-artifacts-upload', 'm77-certified-artifacts-upload', 'm78-certified-artifacts-upload',
]);
const normalizedStateFiles = new Set([
  'config/stage-i-m78-futuristic-minimalist-foundation-target.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-I-M78-VISUAL-SYSTEM-FOUNDATION-BASELINE-GUARD.md',
  'M78-CONTINUATION-STATE.md',
]);
const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) files.push(absolute);
    else if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile()) files.push(absolute);
  }
};
const gitMode = (stat) => stat.isSymbolicLink() ? '120000' : ((stat.mode & 0o111) !== 0 ? '100755' : '100644');
walk(root);
files.sort((a, b) => path.relative(root, a).localeCompare(path.relative(root, b)));
const hash = crypto.createHash('sha256');
for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const stat = fs.lstatSync(file);
  hash.update(`${relative}\0${gitMode(stat)}\0${stat.isSymbolicLink() ? 'symlink' : 'file'}\0`);
  if (stat.isSymbolicLink()) { hash.update(`${fs.readlinkSync(file)}\0`); continue; }
  if (normalizedStateFiles.has(relative)) {
    let source = fs.readFileSync(file, 'utf8');
    source = source
      .replace("activationState: 'active-certified'", "activationState: 'implementation-complete-pending-certification'")
      .replace('**State:** active-certified', '**State:** implementation-complete-pending-certification')
      .replace('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE', '**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS');
    hash.update(`${source}\0`);
  } else { hash.update(fs.readFileSync(file)); hash.update('\0'); }
}
console.log(hash.digest('hex'));
