import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const forbiddenPaths = [
  'server',
  'reference/legacy-local-server',
  'reference/legacy-local-server/server/data/db.json',
  'reference/legacy-local-server/server/data/db.seed.json',
  'reference/legacy-local-server/server/reset-db.js',
];
const forbiddenContent = [
  /DEMO-MTR-/i,
  /RFQ-DEMO-/i,
  /local@example\.test/i,
  /procurement@example\.test/i,
  /Local Test User/i,
  /Procurement Demo/i,
  /Demo Instruments/i,
  /Demo Automation/i,
  /Local Demo Supplier/i,
];
const scanExtensions = new Set(['.js','.jsx','.json','.md','.txt','.sql','.css','.toml','.html','.csv']);
const skipNames = new Set(['CHECKSUMS.sha256','FINAL_CHECKSUMS.sha256','CERTIFICATION_PASS.txt','CHANGELOG_v0.3.1.txt']);
const skipDirs = new Set(['node_modules','dist','.git','.DS_Store']);
const self = path.resolve('scripts/check-data-clean.mjs');
let failed = 0;

for (const rel of forbiddenPaths) {
  if (fs.existsSync(path.join(root, rel))) {
    console.error(`FAIL prohibited demo/test data path present: ${rel}`);
    failed++;
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (skipNames.has(entry.name) || path.resolve(full) === self) continue;
    if (!scanExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const re of forbiddenContent) {
      if (re.test(text)) {
        console.error(`FAIL prohibited demo/test data marker ${re} present in ${path.relative(root, full)}`);
        failed++;
      }
    }
  }
}
walk(root);

console.log(failed ? 'FAIL: persisted dummy/mock/sample/seed/test data detected' : 'PASS: no persisted dummy/mock/sample/seed/test data detected');
if (failed) process.exit(1);
