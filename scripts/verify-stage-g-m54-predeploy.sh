#!/usr/bin/env bash
set -euo pipefail
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M54 pre-deployment verification requires Node v22.16.0.' >&2; exit 1; }
npm run dependencies:ensure
npm run production-readiness:check
npm run production-readiness:test
npm run lint:eslint
npm run typecheck
npm run release:check
npm run database-rls:test:local
npm run cross-module-rbac-e2e:database
npm run cross-module-rbac-e2e:browser
npm run recovery-quality:browser
npm run build
npm run verify:dist
npm run verify:preview
echo 'M54 PRE-DEPLOYMENT FUNCTIONAL PRODUCTION READINESS GATE: PASS'
