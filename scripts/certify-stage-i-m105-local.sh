#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo
echo "============================================================"
echo "M105 LOCAL CERTIFICATION"
echo "============================================================"

echo
echo "1. SOURCE / SUCCESSOR AUTHORITY"
node scripts/verify-stage-i-m105-m104-source-guard.mjs
node verify-v1432-m105-production-backend-parity.mjs
node scripts/verify-stage-i-m104-m103-source-guard.mjs
node verify-v1432-m104-hosted-certification-synchronization.mjs

echo
echo "2. DEPENDENCY INTEGRITY"
rm -rf node_modules
npm ci
npm run dependencies:ensure
npm audit --audit-level=high

echo
echo "3. STATIC / TYPES / LINT / BUILD"
npm run typecheck
npm run lint
npm run build

echo
echo "4. BACKEND PREFLIGHT"
npm run backend-preflight:check
npm run backend-preflight:test

echo
echo "5. BOARDS BACKEND REGRESSION"
npm run board-backend-contract:check
npm run board-backend-contract:test
npm run board-backend-contract:browser

echo
echo "6. IMPORT / EXPORT REGRESSION"
npm run prompts1-4:check
npm run database-rls:check
npm run prompts1-4:database
npm run modern-tests:test
npm run verify:ui

echo
echo "7. RELEASE CERTIFICATION"
npm run release:check

echo
echo "8. HISTORICAL REGRESSION"
npm run verify:historical-all

echo
echo "9. POST-CERTIFICATION AUTHORITY"
node scripts/verify-stage-i-m105-m104-source-guard.mjs
node verify-v1432-m105-production-backend-parity.mjs
node scripts/verify-stage-i-m104-m103-source-guard.mjs

echo
echo "============================================================"
echo "M105 LOCAL CERTIFICATION: PASS"
echo "============================================================"
