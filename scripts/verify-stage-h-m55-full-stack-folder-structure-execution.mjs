import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };

const forbiddenBrowserImports = [
  /from\s+['"][^'"]*supabase\/migrations/i,
  /from\s+['"][^'"]*supabase\/tests/i,
  /from\s+['"][^'"]*supabase\/functions/i,
  /import\s*\(\s*['"][^'"]*supabase\/(?:migrations|tests|functions)/i,
];

const browserRoots = ['src', 'assets/js'];
for (const browserRoot of browserRoots) {
  const pending = [path.join(root, browserRoot)];
  while (pending.length) {
    const current = pending.pop();
    if (!current) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(absolute);
      else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) {
        const source = fs.readFileSync(absolute, 'utf8');
        for (const pattern of forbiddenBrowserImports) {
          ok(!pattern.test(source), `browser source imports backend implementation: ${path.relative(root, absolute)}`);
        }
      }
    }
  }
}

const structure = read('config/full-stack-folder-structure.ts');
const canonicalPathMatches = [...structure.matchAll(/canonicalPaths:\s*Object\.freeze\(\[([^\]]+)\]\)/g)];
ok(canonicalPathMatches.length === 6, `expected six ownership boundaries, found ${canonicalPathMatches.length}`);

const resolved = new Set();
for (const match of canonicalPathMatches) {
  const segment = match[1] ?? '';
  for (const item of segment.matchAll(/'([^']+)'/g)) {
    const relative = item[1];
    if (!relative) continue;
    ok(fs.existsSync(path.join(root, relative)), `canonical ownership path does not exist: ${relative}`);
    resolved.add(relative);
  }
}
ok(resolved.size >= 20, `expected broad full-stack coverage, found only ${resolved.size} canonical paths`);

const packageJson = JSON.parse(read('package.json'));
const checkScript = packageJson.scripts?.check ?? '';
ok(checkScript.includes('full-stack-structure:check'), 'aggregate npm check does not include M55 structural verification');

if (failures.length) {
  console.error('M55 full-stack folder structure deterministic test FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('M55 full-stack folder structure deterministic test PASS');
console.log(`Validated ${resolved.size} canonical ownership paths and browser/backend dependency separation.`);
