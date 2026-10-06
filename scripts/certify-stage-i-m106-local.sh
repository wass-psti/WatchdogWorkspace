#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo '============================================================'
echo 'M106 DEPLOY-PAGES V5 LOCAL CERTIFICATION'
echo '============================================================'
node scripts/verify-stage-i-m106-m105-source-guard.mjs
node verify-v1432-m106-deploy-pages-v5-compatibility.mjs
node scripts/verify-stage-i-m105-m104-source-guard.mjs
node verify-stage-f-m36-production-cutover-certification.mjs
node verify-stage-g-m54-functional-production-readiness-certification.mjs
node scripts/verify-stage-g-m54-execution.mjs
rm -rf node_modules dist coverage test-results playwright-report
npm ci
npm run dependencies:ensure
npm audit --audit-level=high
npm run governance:sync-check
npm run corrective:check
npm run cutover:check
npm run cutover:test
npm run production-readiness:check
npm run production-readiness:test
npm run typecheck
npm run lint
npm run build
npm run verify:dist
npm run release:check
npm run verify:historical-all
node scripts/verify-stage-i-m106-m105-source-guard.mjs
node verify-v1432-m106-deploy-pages-v5-compatibility.mjs
echo 'M106 LOCAL CERTIFICATION: PASS'
