import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const m102Manifest = path.join(root, 'M102-M101-BASELINE-SOURCE-MANIFEST.json');
const m102Guard = path.join(root, 'scripts/verify-stage-i-m102-m101-source-guard.mjs');
if (fs.existsSync(m102Manifest) || fs.existsSync(m102Guard)) {
  if (!fs.existsSync(m102Manifest) || !fs.existsSync(m102Guard)) { console.error('M101 M100-certified source guard: FAIL (incomplete M102 successor authority)'); process.exit(1); }
  const { spawnSync } = await import('node:child_process');
  const delegated = spawnSync(process.execPath, [m102Guard], { cwd: root, stdio: 'inherit' });
  if (delegated.status !== 0) process.exit(delegated.status ?? 1);
  console.log('M101 M100-certified source guard: PASS (M102 successor authority delegated to M102→M101 source guard)');
  process.exit(0);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'M101-M100-BASELINE-SOURCE-MANIFEST.json'), 'utf8'));
const baseline = new Map(manifest.entries.map((entry) => [entry.path, entry]));
const allowedMutations = new Set([
  'package.json',
  'supabase/schema.sql',
  'src/features/boards/contracts/index.ts',
  'src/features/boards/contracts/repository.ts',
  'src/features/boards/import/index.ts',
  'assets/js/features/boards/data/board-repository.ts',
  'assets/js/features/boards/services/board-domain-service.ts',
  'assets/js/features/boards/index.ts',
  'assets/js/features/boards/views/board-workspace-view.ts',
  'assets/js/boards-ui.ts',
  'config/backend-capability-manifest.ts',
  'verify-stage-g-m38-runtime-configuration-backend-preflight.mjs',
  'verify-stage-g-m46-boards-backend-data-contract-recovery.mjs',
  'verify-stage-g-m51-boards-realtime-concurrency-stabilization.mjs',
  'scripts/verify-stage-i-m100-m99-source-guard.mjs',
  'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs',
]);
const allowedAdditions = new Set([
  'M101-M100-BASELINE-SOURCE-MANIFEST.json',
  'assets/js/features/boards/controllers/board-import-workflow.ts',
  'M101-BOARDS-IMPORT-PREVIEW-ATOMIC-COMMIT.md',
  'M101-CONTINUATION-STATE.md',
  'M101-IMPLEMENTATION-REPORT.md',
  'scripts/certify-stage-i-m101-local.sh',
  'scripts/verify-stage-i-m101-m100-source-guard.mjs',
  'scripts/run-stage-i-m101-database-tests.mjs',
  'src/features/boards/contracts/import-preview.ts',
  'src/features/boards/import/board-import-preview.ts',
  'supabase/migrations/v1.43.2-stage-i-m101-boards-import-preview-atomic-commit.sql',
  'supabase/tests/m101/boards_import_preview_atomic_commit.test.sql',
  'verify-v1432-m101-board-import-preview-atomic-commit.mjs',
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
  console.error('M101 M100-certified source guard: FAIL'); unauthorized.slice(0,100).forEach((line)=>console.error(`- ${line}`)); process.exit(1);
}
console.log(`M101 M100-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMutations.size}; allowed new files=${allowedAdditions.size})`);
