import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const inventorySource = read('config/ui-architecture-inventory.ts');
const pathMatches = [...inventorySource.matchAll(/canonicalPaths:\s*Object\.freeze\(\[([^\]]+)\]\)/g)];
ok(pathMatches.length === 12, `expected 12 UI ownership domains, found ${pathMatches.length}`);

const canonicalPaths = new Set();
for (const match of pathMatches) {
  for (const item of (match[1] ?? '').matchAll(/'([^']+)'/g)) {
    const relative = item[1];
    if (!relative) continue;
    ok(exists(relative), `inventory canonical path does not exist: ${relative}`);
    canonicalPaths.add(relative);
  }
}
ok(canonicalPaths.size >= 28, `expected broad UI inventory coverage; found only ${canonicalPaths.size} unique canonical paths`);

const chakraImports = [];
const pending = [path.join(root, 'src')];
while (pending.length) {
  const current = pending.pop();
  if (!current) continue;
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) pending.push(absolute);
    else if (/\.(?:ts|tsx)$/.test(entry.name)) {
      const source = fs.readFileSync(absolute, 'utf8');
      if (/from\s+['"]@chakra-ui\/react['"]/.test(source)) chakraImports.push(path.relative(root, absolute));
    }
  }
}
chakraImports.sort();
ok(JSON.stringify(chakraImports) === JSON.stringify([
  'src/design-system/WorkManagementDesignSystemProvider.tsx',
  'src/design-system/system.ts',
]), `Chakra provider/library authority escaped design-system boundary: ${chakraImports.join(', ')}`);

const target = read('config/stage-h-m56-ui-architecture-inventory-target.ts');
ok(target.includes("visualRuntimeMutationAllowed: false"), 'M56 must remain governance-only');

const packageJson = JSON.parse(read('package.json'));
const releaseCheck = packageJson.scripts?.['release:check'] ?? '';
ok(releaseCheck.indexOf('ui-inventory:check') < releaseCheck.indexOf('design-system:check'), 'M56 inventory gate should run before downstream design-system verification in release:check');
ok(releaseCheck.includes('verify:ui'), 'aggregate release verification must retain historical UI verification');
ok(releaseCheck.includes('verify'), 'aggregate release verification must retain project verification');

const forbiddenM56RuntimeTargets = [
  'src/app/',
  'src/design-system/',
  'assets/css/',
  'assets/js/',
  'apps/',
  'supabase/',
];
const m56Doc = read('M56-UI-ARCHITECTURE-INVENTORY-AND-DESIGN-GOVERNANCE-BASELINE.md');
for (const boundary of ['routing', 'authentication', 'authorization/RBAC', 'state', 'persistence', 'backend contracts', 'Supabase schema/migrations']) {
  ok(m56Doc.includes(boundary), `M56 non-goal documentation missing protected boundary: ${boundary}`);
}

const snapshot = JSON.parse(read('regression-baseline/m56-ui-architecture-inventory.json'));
for (const relative of snapshot.observations.moduleCssFiles ?? []) {
  ok(exists(relative), `M56 discovery evidence references missing module CSS: ${relative}`);
}
for (const relative of snapshot.observations.directChakraImports ?? []) {
  ok(exists(relative), `M56 discovery evidence references missing Chakra owner: ${relative}`);
}

ok(forbiddenM56RuntimeTargets.length === 6, 'protected runtime boundary definition unexpectedly changed');

if (failures.length) {
  console.error('M56 UI architecture inventory deterministic verification FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('M56 UI architecture inventory deterministic verification: PASS');
console.log(`Validated ${canonicalPaths.size} canonical UI paths, design-system provider ownership, governance sequencing, and protected runtime boundaries.`);
