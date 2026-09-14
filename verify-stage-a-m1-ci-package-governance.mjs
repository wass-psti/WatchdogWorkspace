import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const exists = (path) => fs.existsSync(path);

for (const path of [
  '.nvmrc',
  '.npmrc',
  'eslint.config.mjs',
  '.github/workflows/ci.yml',
  '.github/workflows/codeql.yml',
  '.github/workflows/dependency-review.yml',
  '.github/workflows/observability.yml',
  '.github/workflows/backup-disaster-recovery.yml',
  '.github/dependabot.yml',
  'scripts/verify-package-governance.mjs',
  'scripts/scan-secrets.mjs',
  'docs/CI-PACKAGE-GOVERNANCE.md',
]) {
  assert.ok(exists(path), `Stage A M1 governance artifact missing: ${path}`);
}

const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.packageManager, 'npm@10.9.2');
assert.equal(pkg.engines?.node, '>=22.12.0 <23');
assert.equal(pkg.engines?.npm, '>=10.9.0 <11');
assert.equal(pkg.devDependencies?.vite, '8.2.2');
assert.equal(pkg.devDependencies?.typescript, '5.8.3');
for (const script of ['governance:check', 'lint:eslint', 'lint:typescript', 'lint', 'audit:ci', 'ci:check']) {
  assert.ok(pkg.scripts?.[script], `Stage A M1 package script missing: ${script}`);
}
assert.match(pkg.scripts['lint:eslint'], /eslint@10\.9\.1/, 'ESLint bootstrap version must be pinned');
assert.match(pkg.scripts.check, /governance:check/, 'normal check must include package governance');
assert.match(pkg.scripts['release:check'], /governance:check/, 'release gate must include package governance');

const lock = JSON.parse(read('package-lock.json'));
assert.equal(lock.lockfileVersion, 3);
if (lock.packages?.['']?.packageManager != null) {
  assert.equal(lock.packages[''].packageManager, pkg.packageManager);
}
assert.deepEqual(lock.packages?.['']?.engines, pkg.engines);
assert.deepEqual(lock.packages?.['']?.devDependencies, pkg.devDependencies);

const ci = read('.github/workflows/ci.yml');
for (const token of [
  'node-version-file: .nvmrc',
  'npm ci',
  'npm run governance:check',
  'npm run lint',
  'npm run audit:ci',
  'npm run release:check',
  'npm run observability:check',
  'npm run observability:test',
  'SHA256SUMS.txt',
  'actions/upload-artifact@v4',
]) {
  assert.ok(ci.includes(token), `CI workflow missing ${token}`);
}

const deploy = read('.github/workflows/deploy-pages.yml');
for (const token of [
  'node-version-file: .nvmrc',
  'npm ci',
  'npm run governance:check',
  'npm run lint',
  'npm run audit:ci',
  'npm run release:check',
  'npm run observability:check',
  'npm run observability:test',
  'path: ./dist',
]) {
  assert.ok(deploy.includes(token), `deployment workflow missing ${token}`);
}

const codeql = read('.github/workflows/codeql.yml');
assert.ok(codeql.includes('javascript-typescript'));
assert.ok(codeql.includes('github/codeql-action/init@v4'));
assert.ok(codeql.includes('github/codeql-action/analyze@v4'));

const depReview = read('.github/workflows/dependency-review.yml');
assert.ok(depReview.includes('actions/dependency-review-action@v4'));
assert.ok(depReview.includes('fail-on-severity: high'));

const dependabot = read('.github/dependabot.yml');
assert.ok(dependabot.includes('package-ecosystem: npm'));
assert.ok(dependabot.includes('package-ecosystem: github-actions'));

const eslint = read('eslint.config.mjs');
assert.ok(eslint.includes("'no-debugger': 'error'"));
assert.ok(eslint.includes("'no-unreachable': 'error'"));
assert.ok(eslint.includes("'no-unsafe-optional-chaining': 'error'"));
assert.ok(eslint.includes("'apps/**'"), 'legacy embedded application sources must remain outside the new host lint boundary until their migration stage');

const governanceDoc = read('docs/CI-PACKAGE-GOVERNANCE.md');
assert.ok(governanceDoc.includes('TypeScript remains governed by the strict compiler'));
assert.ok(governanceDoc.includes('branch-protection configuration is an external GitHub setting'));

console.log('Stage A Milestone 1 CI and package governance verification: PASS');
