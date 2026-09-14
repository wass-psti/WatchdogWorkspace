import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const required = [
  '.nvmrc',
  '.npmrc',
  'eslint.config.mjs',
  '.github/dependabot.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/codeql.yml',
  '.github/workflows/dependency-review.yml',
  '.github/workflows/deploy-pages.yml',
  '.github/workflows/database-tests.yml',
  '.github/workflows/modern-tests.yml',
  '.github/workflows/performance.yml',
  '.github/workflows/observability.yml',
  '.github/workflows/service-worker-updates.yml',
  '.github/workflows/backup-disaster-recovery.yml',
  '.github/workflows/final-legacy-deletion.yml',
  '.github/workflows/production-cutover.yml',
  '.github/workflows/functional-regression-baseline.yml',
  '.github/workflows/backend-capability-preflight.yml',
  'scripts/verify-package-governance.mjs',
  'scripts/scan-secrets.mjs',
  'docs/CI-PACKAGE-GOVERNANCE.md',
  'scripts/ensure-project-dependencies.mjs',
  'scripts/certify-stage-b-platform.mjs',
  'scripts/run-governed-toolchain.sh',
  'verify-stage-b-governed-toolchain-dispatch.mjs',
];

const missing = required.filter((entry) => !fs.existsSync(path.join(root, entry)));
if (missing.length > 0) {
  console.error('Required repository governance artifacts: FAIL');
  for (const entry of missing) console.error(`- missing: ${entry}`);
  console.error('\nRun `npm run governance:restore` from this corrective package, then re-run the command.');
  process.exit(1);
}

console.log(`Required repository governance artifacts: PASS (${required.length}/${required.length})`);
