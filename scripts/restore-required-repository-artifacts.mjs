import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const entries = [
  {
    source: 'governance-artifacts/nvmrc',
    destination: '.nvmrc',
    mode: 'exact',
  },
  {
    source: 'governance-artifacts/npmrc',
    destination: '.npmrc',
    mode: 'exact',
  },
  {
    source: 'governance-artifacts/github/dependabot.yml',
    destination: '.github/dependabot.yml',
    requiredTokens: ['package-ecosystem: npm', 'package-ecosystem: github-actions'],
  },
  {
    source: 'governance-artifacts/github/workflows/ci.yml',
    destination: '.github/workflows/ci.yml',
    requiredTokens: [
      'npm run dependencies:ensure',
      'npm run toolchain:dispatch:check',
      'npm run governance:check',
      'npm run security:check',
      'npm run react:check',
      'npm run design-system:check',
      'npm run corrective:check',
      'npm run vendor-types:check',
      'npm run csp-dist:check',
      'npm run interactions:check',
      'npm run runtime-schemas:check',
      'npm run supabase-client:check',
      'npm run tanstack-query:check',
      'npm run client-state:check',
      'npm run react-shell:check',
      'npm run global-overlays:check',
      'npm run authentication-ui:check',
      'npm run account-settings-users:check',
      'npm run shared-app-ui:check',
      'npm run board-presentation:check',
      'npm run database-rls:check',
      'npm run modern-tests:check',
      'npm run performance:check',
      'npm run observability:check',
      'npm run observability:test',
      'npm run service-worker-update:check',
      'npm run service-worker-update:test',
      'npm run backup-dr:check',
      'npm run backup-dr:test',
      'npm run cutover:check',
      'npm run cutover:test',
      'npm run cutover:artifact',
      'npm run cutover:evidence',
      'npm run functional-regression:check',
      'npm run functional-regression:test',
      'npm run lint',
      'npm run audit:ci',
      'npm run release:check',
    ],
  },
  {
    source: 'governance-artifacts/github/workflows/codeql.yml',
    destination: '.github/workflows/codeql.yml',
    requiredTokens: ['github/codeql-action/init@v4', 'github/codeql-action/analyze@v4'],
  },
  {
    source: 'governance-artifacts/github/workflows/dependency-review.yml',
    destination: '.github/workflows/dependency-review.yml',
    requiredTokens: ['actions/dependency-review-action@v4'],
  },
  {
    source: 'governance-artifacts/github/workflows/database-tests.yml',
    destination: '.github/workflows/database-tests.yml',
    requiredTokens: [
      'supabase/setup-cli@v1',
      'version: 2.117.0',
      'actions/setup-node@v4',
      'npm run database-rls:test:local',
      'version: 2.117.0',
    ],
  },
  {
    source: 'governance-artifacts/github/workflows/modern-tests.yml',
    destination: '.github/workflows/modern-tests.yml',
    requiredTokens: [
      'actions/setup-node@v4',
      'npm run modern-tests:check',
      'npm run modern-tests:test',
      'npm run modern-tests:coverage',
      'npm run modern-tests:e2e',
    ],
  },
  {
    source: 'governance-artifacts/github/workflows/performance.yml',
    destination: '.github/workflows/performance.yml',
    requiredTokens: [
      'actions/setup-node@v4',
      'npm run performance:check',
      'npm run performance:bench',
      'npm run performance:bundle',
    ],
  },
  {
    source: 'governance-artifacts/github/workflows/observability.yml',
    destination: '.github/workflows/observability.yml',
    requiredTokens: [
      'actions/setup-node@v4',
      'npm run observability:check',
      'npm run observability:test',
      'npm run lint:eslint',
      'npm run typecheck',
    ],
  },
  {
    source: 'governance-artifacts/github/workflows/service-worker-updates.yml',
    destination: '.github/workflows/service-worker-updates.yml',
    requiredTokens: [
      'actions/setup-node@v4',
      'npm run service-worker-update:check',
      'npm run service-worker-update:test',
      'npm run service-worker-update:dist',
      'npm run verify:preview',
    ],
  },
  {
    source: 'governance-artifacts/github/workflows/backup-disaster-recovery.yml',
    destination: '.github/workflows/backup-disaster-recovery.yml',
    requiredTokens: [
      'actions/setup-node@v4',
      'npm run backup-dr:check',
      'npm run backup-dr:test',
      'npm run database-rls:check',
      'npm run observability:check',
      'npm run service-worker-update:check',
      'npm run lint:eslint',
      'npm run typecheck',
    ],
  },
  {
    source: 'governance-artifacts/github/workflows/production-cutover.yml',
    destination: '.github/workflows/production-cutover.yml',
    requiredTokens: [
      'actions/setup-node@v4',
      'npm ci',
      'npm run release:check',
      'npm run cutover:check',
      'npm run cutover:test',
      'npm run cutover:artifact',
      'npm run cutover:evidence',
      'actions/upload-artifact@v4',
    ],
  },

  {
    source: 'governance-artifacts/github/workflows/functional-regression-baseline.yml',
    destination: '.github/workflows/functional-regression-baseline.yml',
    requiredTokens: [
      'npm ci',
      'npm run functional-regression:check',
      'npm run functional-regression:test',
      'npm run functional-regression:browser',
      'npm run functional-regression:evidence',
      'actions/upload-artifact@v4',
    ],
  },  {
    source: 'governance-artifacts/github/workflows/deploy-pages.yml',
    destination: '.github/workflows/deploy-pages.yml',
    requiredTokens: [
      'npm run dependencies:ensure',
      'npm run toolchain:dispatch:check',
      'npm run governance:check',
      'npm run security:check',
      'npm run react:check',
      'npm run design-system:check',
      'npm run corrective:check',
      'npm run vendor-types:check',
      'npm run csp-dist:check',
      'npm run interactions:check',
      'npm run runtime-schemas:check',
      'npm run supabase-client:check',
      'npm run tanstack-query:check',
      'npm run client-state:check',
      'npm run react-shell:check',
      'npm run global-overlays:check',
      'npm run authentication-ui:check',
      'npm run account-settings-users:check',
      'npm run shared-app-ui:check',
      'npm run board-presentation:check',
      'npm run database-rls:check',
      'npm run modern-tests:check',
      'npm run performance:check',
      'npm run observability:check',
      'npm run observability:test',
      'npm run service-worker-update:check',
      'npm run service-worker-update:test',
      'npm run backup-dr:check',
      'npm run backup-dr:test',
      'npm run cutover:check',
      'npm run cutover:test',
      'npm run cutover:artifact',
      'npm run cutover:evidence',
      'npm run functional-regression:check',
      'npm run functional-regression:test',
      'npm run lint',
      'npm run audit:ci',
      'npm run release:check',
    ],
  },
];

let restored = 0;
let synchronized = 0;
let preserved = 0;

for (const entry of entries) {
  const source = path.join(root, entry.source);
  const destination = path.join(root, entry.destination);
  if (!fs.existsSync(source)) throw new Error(`Governance restore template missing: ${entry.source}`);

  const canonical = fs.readFileSync(source, 'utf8');
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, canonical);
    restored += 1;
    console.log(`RESTORED ${entry.destination}`);
    continue;
  }

  const current = fs.readFileSync(destination, 'utf8');
  const stale = entry.mode === 'exact'
    ? current !== canonical
    : (entry.requiredTokens ?? []).some((token) => !current.includes(token));

  if (stale) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, canonical);
    synchronized += 1;
    console.log(`SYNCHRONIZED ${entry.destination}`);
    continue;
  }

  preserved += 1;
  console.log(`PRESERVED ${entry.destination}`);
}

console.log(`Repository governance restore: PASS (${restored} restored, ${synchronized} synchronized, ${preserved} preserved, ${entries.length} governed)`);
