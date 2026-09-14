import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const tsconfig = JSON.parse(read('tsconfig.json'));
const compiler = tsconfig.compilerOptions ?? {};
const pkg = JSON.parse(read('package.json'));

for (const [flag, expected] of [
  ['strict', true],
  ['noImplicitAny', true],
  ['strictNullChecks', true],
  ['noUncheckedIndexedAccess', true],
  ['exactOptionalPropertyTypes', true],
  ['useUnknownInCatchVariables', true],
  ['noImplicitReturns', true],
  ['noUnusedLocals', true],
  ['noUnusedParameters', true],
]) {
  assert.equal(compiler[flag], expected, `M4 vendor compatibility must not weaken Work Management TypeScript flag ${flag}.`);
}

assert.equal(
  compiler.skipLibCheck,
  true,
  'M4 must skip validation of third-party declaration internals while continuing to typecheck Work Management source against their public APIs.',
);
assert.equal(compiler.allowJs, false, 'M4 vendor compatibility must not re-enable JavaScript compilation.');
assert.deepEqual(compiler.types, [], 'M4 must not globally inject Node or vendor ambient types into browser source.');
assert.equal(pkg.scripts?.typecheck, 'tsc --noEmit', 'The canonical typecheck must remain the normal project compiler invocation.');

const forbiddenWorkarounds = [
  'patch-package',
  'typescript/lib',
];
for (const dependency of forbiddenWorkarounds) {
  assert.equal(dependency in (pkg.dependencies ?? {}), false, `M4 must not add vendor type workaround dependency ${dependency}.`);
  assert.equal(dependency in (pkg.devDependencies ?? {}), false, `M4 must not add vendor type workaround devDependency ${dependency}.`);
}
assert.equal(fs.existsSync('patches'), false, 'M4 must not patch third-party packages in node_modules.');

const sourceRoots = ['src', 'assets/js', 'config'];
const sourceFiles = [];
const walk = (directory) => {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:ts|tsx|d\.ts)$/.test(entry.name)) sourceFiles.push(full);
  }
};
sourceRoots.forEach(walk);

for (const file of sourceFiles) {
  const source = read(file);
  for (const token of ['@ts-ignore', '@ts-nocheck', '@ts-expect-error']) {
    assert.equal(source.includes(token), false, `M4 vendor compatibility must not suppress Work Management type errors with ${token}: ${file}`);
  }
}

console.log(`Stage B Milestone 4 vendor declaration compatibility verification: PASS (${sourceFiles.length} Work Management TS/TSX declaration/source files remain strict; third-party .d.ts internals skipped)`);
