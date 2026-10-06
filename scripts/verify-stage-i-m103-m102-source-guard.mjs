import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'M103-M102-BASELINE-SOURCE-MANIFEST.json'), 'utf8'));
const baseline = new Map(manifest.entries.map((entry) => [entry.path, entry]));
const allowedMutations = new Set([
  'package.json',
  'assets/js/features/boards/controllers/board-import-workflow.ts',
  'assets/js/features/boards/data/board-repository.ts',
  'assets/js/features/boards/data/board-contracts.ts',
  'src/features/boards/contracts/domain.ts',
  'src/features/boards/contracts/export.ts',
  'src/features/boards/contracts/import-preview.ts',
  'src/features/boards/contracts/import.ts',
  'src/features/boards/export/board-export.ts',
  'src/features/boards/import/board-import-preview.ts',
  'supabase/schema.sql',
  'templates/boards/work-management-board-import-template.csv',
  'templates/boards/work-management-board-import-template.xlsx',
  'verify-v1432-m101-board-import-preview-atomic-commit.mjs',
  'verify-v1432-m102-board-data-portability.mjs',
  'verify-stage-g-m51-boards-realtime-concurrency-stabilization.mjs',
  'scripts/verify-stage-i-m102-m101-source-guard.mjs',
  'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs',
]);
const allowedAdditions = new Set([
  'M103-M102-BASELINE-SOURCE-MANIFEST.json',
  'M103-PROMPTS-1-4-COMPLETION-AND-CONTRACT-RECONCILIATION.md',
  'M103-BOARDS-IMPORT-EXPORT-SPECIFICATION.md',
  'M103-CONTINUATION-STATE.md',
  'M103-IMPLEMENTATION-REPORT.md',
  'verify-v1432-m103-prompts1-4-completion.mjs',
  'scripts/run-stage-i-m103-database-tests.mjs',
  'scripts/certify-stage-i-m103-local.sh',
  'scripts/verify-stage-i-m103-m102-source-guard.mjs',
  'supabase/migrations/v1.43.2-stage-i-m103-boards-import-export-contract-reconciliation.sql',
  'supabase/tests/m103/boards_import_export_contract_reconciliation.test.sql',
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
  console.error('M103 M102-certified source guard: FAIL'); unauthorized.slice(0,100).forEach((line)=>console.error(`- ${line}`)); process.exit(1);
}
console.log(`M103 M102-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMutations.size}; allowed new files=${allowedAdditions.size})`);
