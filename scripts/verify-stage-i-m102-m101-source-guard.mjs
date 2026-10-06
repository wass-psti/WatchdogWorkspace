import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const m103Manifest = path.join(root, 'M103-M102-BASELINE-SOURCE-MANIFEST.json');
const m103Guard = path.join(root, 'scripts/verify-stage-i-m103-m102-source-guard.mjs');
if (fs.existsSync(m103Manifest) || fs.existsSync(m103Guard)) {
  if (!fs.existsSync(m103Manifest) || !fs.existsSync(m103Guard)) { console.error('M102 M101-certified source guard: FAIL (incomplete M103 successor authority)'); process.exit(1); }
  const { spawnSync } = await import('node:child_process');
  const delegated = spawnSync(process.execPath, [m103Guard], { cwd: root, stdio: 'inherit' });
  if (delegated.status !== 0) process.exit(delegated.status ?? 1);
  console.log('M102 M101-certified source guard: PASS (M103 successor authority delegated to M103→M102 source guard)');
  process.exit(0);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'M102-M101-BASELINE-SOURCE-MANIFEST.json'), 'utf8'));
const baseline = new Map(manifest.entries.map((entry) => [entry.path, entry]));
const allowedMutations = new Set([
  'package.json',
  'assets/js/boards-ui.ts',
  'assets/js/features/boards/controllers/board-import-workflow.ts',
  'assets/js/features/boards/index.ts',
  'assets/js/features/boards/views/board-workspace-view.ts',
  'src/features/boards/contracts/import-preview.ts',
  'src/features/boards/contracts/import.ts',
  'src/features/boards/contracts/index.ts',
  'src/features/boards/import/board-import-preview.ts',
  'src/features/boards/import/index.ts',
  'scripts/verify-stage-i-m101-m100-source-guard.mjs',
  'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs',
]);
const allowedAdditions = new Set([
  'M102-M101-BASELINE-SOURCE-MANIFEST.json',
  'M102-BOARDS-DATA-PORTABILITY.md',
  'M102-BOARDS-IMPORT-EXPORT-SPECIFICATION.md',
  'M102-CONTINUATION-STATE.md',
  'M102-IMPLEMENTATION-REPORT.md',
  'assets/js/features/boards/controllers/board-export-workflow.ts',
  'scripts/certify-stage-i-m102-local.sh',
  'scripts/verify-stage-i-m102-m101-source-guard.mjs',
  'src/features/boards/contracts/export.ts',
  'src/features/boards/export/board-export.ts',
  'src/features/boards/export/index.ts',
  'templates/boards/work-management-board-import-template.csv',
  'templates/boards/work-management-board-import-template.xlsx',
  'verify-v1432-m102-board-data-portability.mjs',
]);
const ignoredRoots = ['.git','node_modules','dist','coverage','test-results','playwright-report'];
const ignoredNames = new Set(['.DS_Store','Thumbs.db']);
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const current = new Map();
const walk = (dir, prefix='') => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredNames.has(entry.name)) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) { if (ignoredRoots.includes(rel.split('/')[0])) continue; walk(path.join(dir, entry.name), rel); }
    else current.set(rel, { sha256: sha(path.join(dir, entry.name)), size: fs.statSync(path.join(dir, entry.name)).size });
  }
};
walk(root);
const unauthorized = [];
for (const [file, original] of baseline) {
  const now = current.get(file);
  if (!now) { unauthorized.push(`REMOVED ${file}`); continue; }
  if (now.sha256 !== original.sha256 && !allowedMutations.has(file)) unauthorized.push(`MUTATED ${file}`);
}
for (const file of current.keys()) if (!baseline.has(file) && !allowedAdditions.has(file)) unauthorized.push(`ADDED ${file}`);
if (unauthorized.length) {
  console.error('M102 M101-certified source guard: FAIL'); unauthorized.slice(0,100).forEach((line)=>console.error(`- ${line}`)); process.exit(1);
}
console.log(`M102 M101-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMutations.size}; allowed new files=${allowedAdditions.size})`);
