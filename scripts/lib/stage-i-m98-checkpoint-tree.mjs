import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || path.resolve(import.meta.dirname, '../..'));
const excluded = new Set([
  '.git','node_modules','dist','coverage','test-results','playwright-report','CHECKSUMS.sha256',
  '.wm-modern-test-toolchain','m97-browser-evidence','m98-browser-evidence',
  ...Array.from({length: 44}, (_, i) => `m${55 + i}-certified-artifacts-upload`),
  'm97-continuation-artifacts-upload','m98-continuation-artifacts-upload',
]);
const normalized = new Set([
  'config/stage-i-m98-futuristic-minimalist-production-readiness-certification-target.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-I-M98-FUTURISTIC-MINIMALIST-PRODUCTION-READINESS-CERTIFICATION.md',
  'M98-CONTINUATION-STATE.md',
]);
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (excluded.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile()) files.push(absolute);
  }
};
walk(root);
files.sort((a,b) => path.relative(root,a).localeCompare(path.relative(root,b)));
const modeFor = (stat) => (stat.mode & 0o111) ? '100755' : '100644';
const hash = crypto.createHash('sha256');
for (const file of files) {
  const relative = path.relative(root,file).replaceAll(path.sep,'/');
  const stat = fs.lstatSync(file);
  hash.update(`${relative}\0${modeFor(stat)}\0file\0`);
  let bytes = fs.readFileSync(file);
  if (normalized.has(relative)) {
    let source = bytes.toString('utf8')
      .replace("activationState: 'active-certified'","activationState: 'implementation-complete-local-certification-pending'")
      .replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'implementation-complete-local-certification-pending'")
      .replace('**State:** active-certified','**State:** implementation-complete-local-certification-pending')
      .replace('**State:** certification-gates-passed-pending-regression','**State:** implementation-complete-local-certification-pending')
      .replace('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE','**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS')
      .replace('**Continuation:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE','**Continuation:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS');
    bytes = Buffer.from(source);
  }
  hash.update(bytes);
  hash.update('\0');
}
console.log(hash.digest('hex'));
