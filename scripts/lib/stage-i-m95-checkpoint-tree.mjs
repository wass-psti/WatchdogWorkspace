import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || path.resolve(import.meta.dirname, '../..'));
const excluded = new Set([
  '.git','node_modules','dist','coverage','test-results','playwright-report','CHECKSUMS.sha256','.wm-modern-test-toolchain',
  ...Array.from({ length: 41 }, (_, i) => `m${55 + i}-certified-artifacts-upload`),
  'm95-continuation-artifacts-upload'
]);
const normalized = new Set([
  'config/stage-i-m95-cross-module-responsive-harmonization-target.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-I-M95-CROSS-MODULE-RESPONSIVE-HARMONIZATION.md',
  'M95-CONTINUATION-STATE.md'
]);
const files = [];
const walk = d => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (excluded.has(e.name)) continue;
    const a = path.join(d, e.name);
    if (e.isDirectory()) walk(a);
    else if (e.isFile()) files.push(a);
  }
};
walk(root);
files.sort((a,b) => path.relative(root,a).localeCompare(path.relative(root,b)));
const mode = s => ((s.mode & 0o111) ? '100755' : '100644');
const hash = crypto.createHash('sha256');
for (const f of files) {
  const r = path.relative(root,f).replaceAll(path.sep,'/');
  const st = fs.lstatSync(f);
  hash.update(`${r}\0${mode(st)}\0file\0`);
  let b = fs.readFileSync(f);
  if (normalized.has(r)) {
    let s = b.toString('utf8')
      .replace("activationState: 'active-certified'", "activationState: 'implementation-complete-local-certification-pending'")
      .replace("activationState: 'certification-gates-passed-pending-regression'", "activationState: 'implementation-complete-local-certification-pending'")
      .replace('**State:** active-certified', '**State:** implementation-complete-local-certification-pending')
      .replace('**State:** certification-gates-passed-pending-regression', '**State:** implementation-complete-local-certification-pending')
      .replace('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE', '**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS');
    b = Buffer.from(s);
  }
  hash.update(b);
  hash.update('\0');
}
console.log(hash.digest('hex'));
