import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const m101Manifest = path.join(root, 'M101-M100-BASELINE-SOURCE-MANIFEST.json');
const m101Guard = path.join(root, 'scripts/verify-stage-i-m101-m100-source-guard.mjs');
if (fs.existsSync(m101Manifest) || fs.existsSync(m101Guard)) {
  if (!fs.existsSync(m101Manifest) || !fs.existsSync(m101Guard)) { console.error('M100 M99-certified source guard: FAIL (incomplete M101 successor authority)'); process.exit(1); }
  const { spawnSync } = await import('node:child_process');
  const delegated = spawnSync(process.execPath, [m101Guard], { cwd: root, stdio: 'inherit' });
  if (delegated.error) throw delegated.error;
  if (delegated.status !== 0) process.exit(delegated.status ?? 1);
  console.log('M100 M99-certified source guard: PASS (M101 successor authority delegated to M101→M100 source guard)');
  process.exit(0);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'M100-M99-BASELINE-SOURCE-MANIFEST.json'), 'utf8'));
const baseline = new Map(manifest.entries.map((entry) => [entry.path, entry]));
const allowedMutations = new Set([
  'package.json',
  'src/features/boards/contracts/index.ts',
  'assets/js/features/boards/index.ts',
  'scripts/verify-stage-i-m98-m97-source-guard.mjs',
  'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs',
]);
const allowedAdditions = new Set([
  'M100-M99-BASELINE-SOURCE-MANIFEST.json',
  'M100-BOARDS-IMPORT-FOUNDATION.md',
  'M100-CONTINUATION-STATE.md',
  'M100-IMPLEMENTATION-REPORT.md',
  'scripts/certify-stage-i-m100-local.sh',
  'src/features/boards/contracts/import.ts',
  'src/features/boards/import/board-import-parser.ts',
  'src/features/boards/import/index.ts',
  'verify-v1432-m100-board-import-foundation.mjs',
  'scripts/verify-stage-i-m100-m99-source-guard.mjs',
  'tests/fixtures/board-import/boards-valid.csv',
  'tests/fixtures/board-import/boards-valid.xls',
  'tests/fixtures/board-import/boards-valid.xlsx',
  'tests/fixtures/board-import/boards-malformed.csv',
  'tests/fixtures/board-import/boards-corrupt.xlsx',
]);
const ignoredRoots = ['.git','node_modules','dist','coverage','test-results','playwright-report'];
const ignoredNames = new Set(['.DS_Store','Thumbs.db']);
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const current = new Map();
const walk = (dir, prefix='') => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredNames.has(entry.name)) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (ignoredRoots.includes(rel.split('/')[0])) continue;
      walk(path.join(dir, entry.name), rel);
    } else current.set(rel, { sha256: sha(path.join(dir, entry.name)), size: fs.statSync(path.join(dir, entry.name)).size });
  }
};
walk(root);
const unauthorized = [];
for (const [file, original] of baseline) {
  const now = current.get(file);
  if (!now) { unauthorized.push(`REMOVED ${file}`); continue; }
  if (now.sha256 !== original.sha256 && !allowedMutations.has(file)) unauthorized.push(`MUTATED ${file}`);
}
for (const file of current.keys()) {
  if (!baseline.has(file) && !allowedAdditions.has(file)) unauthorized.push(`ADDED ${file}`);
}
if (unauthorized.length) {
  console.error('M100 M99-certified source guard: FAIL');
  unauthorized.slice(0, 100).forEach((line) => console.error(`- ${line}`));
  process.exit(1);
}
console.log(`M100 M99-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMutations.size}; allowed new files=${allowedAdditions.size})`);
