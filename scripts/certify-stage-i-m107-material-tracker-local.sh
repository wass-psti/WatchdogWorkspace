#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo '============================================================'
echo 'M107 MATERIAL TRACKER INTEGRATION LOCAL CERTIFICATION'
echo '============================================================'

test "$(node -v)" = 'v22.16.0'
test "$(npm -v)" = '10.9.2'

echo '=== 1. PREDECESSOR / INTEGRATION SOURCE AUTHORITY ==='
node scripts/verify-stage-i-m107-m106-source-guard.mjs
node scripts/verify-material-tracker-integration.mjs
node scripts/scan-secrets.mjs

echo '=== 2. MATERIAL TRACKER CLEAN DEPENDENCY INSTALL ==='
rm -rf integrations/material-tracker/node_modules integrations/material-tracker/dist apps/material-tracker
npm --prefix integrations/material-tracker ci --ignore-scripts
npm --prefix integrations/material-tracker audit --audit-level=high

echo '=== 3. MATERIAL TRACKER DETERMINISTIC / REGRESSION GATES ==='
npm --prefix integrations/material-tracker run check:integration
npm --prefix integrations/material-tracker run check:static
npm --prefix integrations/material-tracker run check:data-clean
npm --prefix integrations/material-tracker run test:deterministic
npm --prefix integrations/material-tracker run test:regression
npm --prefix integrations/material-tracker run test:exports
npm --prefix integrations/material-tracker run test:import-export
npm --prefix integrations/material-tracker run check:package
npm --prefix integrations/material-tracker run build

test -f integrations/material-tracker/dist/index.html

echo '=== 4. WORK MANAGEMENT CLEAN DEPENDENCY INSTALL ==='
rm -rf node_modules dist coverage test-results playwright-report
npm ci
npm run dependencies:ensure
npm audit --audit-level=high

echo '=== 5. HOST STATIC / TYPE / LINT / BUILD ==='
npm run material-tracker:integration:check
npm run typecheck
npm run lint
npm run build

test -f apps/material-tracker/index.html
test -f dist/apps/material-tracker/index.html

echo '=== 6. HOST RUNTIME / DIST / PREVIEW VERIFICATION ==='
npm run verify:vite
npm run verify:dist
npm run verify:preview
node verify-v1432-embedded-runtime-production.mjs

echo '=== 7. FULL CURRENT RELEASE / HISTORICAL REGRESSION ==='
npm run release:check
npm run verify:historical-all

echo '=== 8. POST-CERTIFICATION SOURCE / SECURITY CHECK ==='
node scripts/verify-stage-i-m107-m106-source-guard.mjs
node scripts/verify-material-tracker-integration.mjs
node scripts/scan-secrets.mjs

echo 'M107 MATERIAL TRACKER LOCAL INTEGRATION CERTIFICATION: PASS'
