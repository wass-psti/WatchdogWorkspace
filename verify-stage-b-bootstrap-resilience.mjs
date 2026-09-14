import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const ensure = fs.readFileSync('scripts/ensure-project-dependencies.mjs', 'utf8');
const lockfileVerifier = fs.readFileSync('scripts/lib/lockfile-install-verifier.mjs', 'utf8');
const offlineProbe = fs.readFileSync('scripts/lib/npm-offline-lockfile-probe.mjs', 'utf8');
const certify = fs.readFileSync('scripts/certify-stage-b-platform.mjs', 'utf8');
const restore = fs.readFileSync('scripts/restore-required-repository-artifacts.mjs', 'utf8');

assert.match(pkg.scripts['governance:check'], /^npm run governance:restore && /, 'governance:check must synchronize governed artifacts before verification');
assert.equal(pkg.scripts['dependencies:ensure'], 'bash scripts/run-governed-toolchain.sh npm run dependencies:ensure:governed');
assert.equal(pkg.scripts['dependencies:ensure:governed'], 'node scripts/ensure-project-dependencies.mjs');
assert.match(pkg.scripts.lint, /^npm run dependencies:ensure && /, 'lint must self-prepare dependencies');
assert.equal(pkg.scripts.typecheck, 'tsc --noEmit', 'canonical typecheck must remain the strict project compiler invocation');
assert.match(pkg.scripts.build, /^npm run dependencies:ensure && /, 'build must self-prepare dependencies');
assert.match(pkg.scripts.verify, /^npm run dependencies:ensure && /, 'aggregate verify must self-prepare dependencies');
assert.match(pkg.scripts['verify:dev'], /^npm run dependencies:ensure && /, 'dev verification must self-prepare dependencies');
assert.match(pkg.scripts['verify:preview'], /^npm run dependencies:ensure && /, 'preview verification must self-prepare dependencies');
assert.match(pkg.scripts['release:check'], /npm run dependencies:ensure/, 'release:check must ensure dependencies');
assert.equal(pkg.scripts['stage-b:certify'], 'bash scripts/run-governed-toolchain.sh npm run stage-b:certify:governed');
assert.equal(pkg.scripts['stage-b:certify:governed'], 'node scripts/certify-stage-b-platform.mjs');
assert.ok(ensure.includes('probeOfflineLockfileInstall(root') && ensure.includes("['ci', '--ignore-scripts', '--offline', '--no-audit', '--fund=false']") && ensure.includes("['ci', '--ignore-scripts', '--fetch-retries=0']"), 'dependency preflight must deterministically choose exact offline or registry npm ci installation');
assert.ok(offlineProbe.includes("'ci',") && offlineProbe.includes("'--ignore-scripts'") && offlineProbe.includes("'--offline'"), 'offline dependency capability probe must materialize the exact lockfile with real npm ci rather than dry-run');
assert.ok(ensure.includes('verifyInstalledLockfileTree(root)'), 'dependency preflight must use the shared lockfile-wide dependency authority');
assert.ok(lockfileVerifier.includes("for (const binary of ['tsc', 'vite'])"), 'dependency preflight must validate TypeScript and Vite binaries through the shared lockfile authority');
assert.ok(lockfileVerifier.includes('is extraneous to package-lock.json'), 'dependency preflight must reject packages extraneous to the lockfile');
assert.match(certify, /design-system:activate:release/, 'Stage B certification must release-certify M4');
assert.match(certify, /interactions:activate:release/, 'Stage B certification must release-certify M5');
assert.match(certify, /runtime-schemas:activate:release/, 'Stage B certification must release-certify M6');
assert.match(certify, /supabase-client:activate:release/, 'Stage B certification must release-certify M7');
assert.match(certify, /tanstack-query:activate:release/, 'Stage B certification must release-certify M8');
assert.match(certify, /active-certified/g, 'Stage B certification must require certified milestone states');
assert.match(restore, /'npm run dependencies:ensure'/, 'workflow synchronization must require dependency preflight');
for (const workflow of ['.github/workflows/ci.yml','.github/workflows/deploy-pages.yml','governance-artifacts/github/workflows/ci.yml','governance-artifacts/github/workflows/deploy-pages.yml']) {
  const source=fs.readFileSync(workflow,'utf8');
  for (const token of ['npm run dependencies:ensure','npm run toolchain:dispatch:check','npm run csp-dist:check','npm run interactions:check','npm run runtime-schemas:check','npm run supabase-client:check','npm run tanstack-query:check']) assert.ok(source.includes(token), `${workflow} missing ${token}`);
}
console.log('Stage B bootstrap/resilience verification: PASS');
