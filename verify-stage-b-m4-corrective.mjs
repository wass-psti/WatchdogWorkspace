import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);

const requiredLive = [
  '.nvmrc',
  '.npmrc',
  '.github/dependabot.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/codeql.yml',
  '.github/workflows/dependency-review.yml',
  '.github/workflows/deploy-pages.yml',
];
const requiredRecovery = [
  'governance-artifacts/nvmrc',
  'governance-artifacts/npmrc',
  'governance-artifacts/github/dependabot.yml',
  'governance-artifacts/github/workflows/ci.yml',
  'governance-artifacts/github/workflows/codeql.yml',
  'governance-artifacts/github/workflows/dependency-review.yml',
  'governance-artifacts/github/workflows/deploy-pages.yml',
  'scripts/restore-required-repository-artifacts.mjs',
  'scripts/verify-required-repository-artifacts.mjs',
  'verify-stage-b-m4-vendor-type-compatibility.mjs',
  'scripts/security/production-csp-policy.mjs',
  'verify-stage-b-m4-csp-dist-serialization.mjs',
  'RELEASE-STATUS-v1.43.2-STAGE-B-M4-VENDOR-TYPE-CORRECTIVE.md',
];
for (const file of [...requiredLive, ...requiredRecovery]) {
  assert.ok(exists(file), `corrective M4 required artifact missing: ${file}`);
}

const exactRecoveryPairs = [
  ['governance-artifacts/nvmrc', '.nvmrc'],
  ['governance-artifacts/npmrc', '.npmrc'],
];
for (const [recovery, live] of exactRecoveryPairs) {
  assert.equal(read(recovery), read(live), `stable governance recovery artifact must remain aligned with ${live}`);
}

// Workflow/governance templates are minimum recovery baselines, not immutable
// snapshots. Later milestones may extend live workflows with additional gates.
// Validate the M4-required contracts in both copies without rejecting those
// forward-compatible extensions.
const workflowContracts = new Map([
  ['.github/workflows/ci.yml', [
    'npm run governance:check',
    'npm run security:check',
    'npm run react:check',
    'npm run design-system:check',
    'npm run corrective:check',
    'npm run vendor-types:check',
    'npm run csp-dist:check',
    'npm run lint',
    'npm run audit:ci',
    'npm run release:check',
  ]],
  ['.github/workflows/deploy-pages.yml', [
    'npm run governance:check',
    'npm run security:check',
    'npm run react:check',
    'npm run design-system:check',
    'npm run corrective:check',
    'npm run vendor-types:check',
    'npm run csp-dist:check',
    'npm run lint',
    'npm run audit:ci',
    'npm run release:check',
  ]],
  ['.github/workflows/codeql.yml', ['github/codeql-action/init@v4', 'github/codeql-action/analyze@v4']],
  ['.github/workflows/dependency-review.yml', ['actions/dependency-review-action@v4']],
  ['.github/dependabot.yml', ['package-ecosystem: npm', 'package-ecosystem: github-actions']],
]);
const recoveryPathFor = (live) => live.startsWith('.github/')
  ? `governance-artifacts/github/${live.slice('.github/'.length)}`
  : live;
for (const [live, tokens] of workflowContracts) {
  const recovery = recoveryPathFor(live);
  for (const file of [live, recovery]) {
    const source = read(file);
    for (const token of tokens) {
      assert.ok(source.includes(token), `${file} missing M4 recovery contract token: ${token}`);
    }
  }
}

const restoreSource = read('scripts/restore-required-repository-artifacts.mjs');
assert.ok(restoreSource.includes('SYNCHRONIZED ${entry.destination}'), 'governance restore must synchronize stale governed artifacts');
assert.ok(restoreSource.includes("'npm run csp-dist:check'"), 'governance restore must detect stale workflows missing the M4 CSP gate');
assert.ok(restoreSource.includes("'npm run interactions:check'"), 'governance restore must detect stale workflows missing the M5 interaction gate');
assert.ok(restoreSource.includes('PRESERVED ${entry.destination}'), 'governance restore must preserve forward-compatible workflows that satisfy current contracts');

assert.equal(read('.nvmrc').trim(), '22.16.0');
for (const token of ['engine-strict=true', 'save-exact=true', 'package-lock=true', 'audit=true']) {
  assert.ok(read('.npmrc').includes(token), `.npmrc missing ${token}`);
}

const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.packageManager, 'npm@10.9.2');
assert.equal(pkg.scripts?.['governance:restore'], 'node scripts/restore-required-repository-artifacts.mjs');
assert.equal(pkg.scripts?.['governance:artifacts'], 'node scripts/verify-required-repository-artifacts.mjs');
assert.equal(pkg.scripts?.['corrective:check'], 'node verify-stage-b-m4-corrective.mjs');

const tsconfig = JSON.parse(read('tsconfig.json'));
assert.equal(tsconfig.compilerOptions?.skipLibCheck, true, 'M4 must skip third-party declaration internals while preserving strict Work Management source checks');
assert.equal(tsconfig.compilerOptions?.strict, true, 'M4 vendor compatibility must retain strict TypeScript');
assert.equal(tsconfig.compilerOptions?.exactOptionalPropertyTypes, true, 'M4 vendor compatibility must retain exact optional property checking in Work Management source');
assert.equal(pkg.scripts?.['vendor-types:check'], 'node verify-stage-b-m4-vendor-type-compatibility.mjs');
assert.equal(pkg.scripts?.['csp-dist:check'], 'node verify-stage-b-m4-csp-dist-serialization.mjs');
for (const scriptName of ['check', 'release:check']) {
  assert.ok(pkg.scripts?.[scriptName]?.includes('npm run vendor-types:check'), `${scriptName} must include vendor-types:check`);
  assert.ok(pkg.scripts?.[scriptName]?.includes('npm run csp-dist:check'), `${scriptName} must include csp-dist:check`);
}
for (const scriptName of ['check', 'release:check']) {
  assert.ok(pkg.scripts?.[scriptName]?.includes('npm run corrective:check'), `${scriptName} must include corrective:check`);
}

const distVerifier = read('scripts/verify-dist.mjs');
assert.ok(distVerifier.includes('extractContentSecurityPolicy'), 'dist verification must decode/parse the emitted CSP meta policy');
assert.ok(distVerifier.includes('validateProductionContentSecurityPolicy'), 'dist verification must validate CSP directives semantically');
assert.equal(distVerifier.includes('index.includes(\"script-src \'self\'\")'), false, 'dist verification must not depend on raw CSP quote serialization');
const cspPolicy = read('scripts/security/production-csp-policy.mjs');
assert.ok(cspPolicy.includes("script-src must contain exactly 'self'"), 'CSP policy helper must enforce same-origin-only scripts');

const packageGovernance = read('scripts/verify-package-governance.mjs');
assert.ok(packageGovernance.includes('package-lock packageManager metadata is optional under npm 10'), 'package governance must tolerate npm 10 omitting root packageManager metadata');
const m1Governance = read('verify-stage-a-m1-ci-package-governance.mjs');
assert.ok(m1Governance.includes("packageManager != null"), 'Stage A M1 verifier must only compare lock packageManager when present');

const deploy = read('.github/workflows/deploy-pages.yml');
for (const command of [
  'npm run governance:check',
  'npm run security:check',
  'npm run react:check',
  'npm run design-system:check',
  'npm run corrective:check',
  'npm run lint',
  'npm run audit:ci',
  'npm run release:check',
]) {
  assert.ok(deploy.includes(command), `deployment workflow missing ${command}`);
}
const ci = read('.github/workflows/ci.yml');
assert.ok(ci.includes('npm run corrective:check'), 'CI workflow must execute corrective:check explicitly');
assert.ok(ci.includes('npm run vendor-types:check'), 'CI workflow must execute vendor-types:check explicitly');

const activation = read('scripts/activate-stage-b-m4.mjs');
assert.ok(activation.includes("run('npm', ['run', 'governance:artifacts'], 'Repository governance artifact preflight')"), 'M4 activation must validate repository governance artifacts before mutation');
assert.ok(activation.includes("run('npm', ['run', 'governance:restore'], 'Synchronize repository governance artifacts')"), 'M4 activation must synchronize missing or stale governance artifacts before certification');
assert.ok(activation.includes("run('npm', ['run', 'corrective:check'], 'M4 corrective integrity gate')"), 'M4 activation must execute corrective integrity before provider activation');
assert.ok(activation.includes("run('npm', ['run', 'vendor-types:check'], 'M4 vendor declaration compatibility gate')"), 'M4 activation must enforce the vendor declaration compatibility policy before typecheck');

const lintSources = {
  'scripts/verify-vite-server.mjs': read('scripts/verify-vite-server.mjs'),
  'tests/browser/run-cdp.mjs': read('tests/browser/run-cdp.mjs'),
  'verify-timetracker-runtime.mjs': read('verify-timetracker-runtime.mjs'),
  'verify-v1430-production-hardening.mjs': read('verify-v1430-production-hardening.mjs'),
};
assert.ok(!lintSources['scripts/verify-vite-server.mjs'].includes('=> setTimeout(resolveWait, 50)'), 'Vite verifier retains promise-executor return lint defect');
assert.ok(!lintSources['scripts/verify-vite-server.mjs'].includes('=> setTimeout(resolveWait, 100)'), 'Vite verifier teardown retains promise-executor return lint defect');
assert.ok(!lintSources['tests/browser/run-cdp.mjs'].includes('=> setTimeout(resolve, 50)'), 'CDP runner retains promise-executor return lint defect');
assert.ok(!lintSources['verify-timetracker-runtime.mjs'].includes('(resolve)=>setImmediate(resolve)'), 'TimeTracker runtime verifier retains promise-executor return lint defect');
assert.ok(!lintSources['verify-v1430-production-hardening.mjs'].includes('if (signal.aborted) return resolve();'), 'production hardening verifier retains promise-executor return lint defect');

console.log('Stage B Milestone 4 corrective integrity verification: PASS');
