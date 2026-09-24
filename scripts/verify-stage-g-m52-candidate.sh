#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo "FAIL: M52 candidate requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
npm run dependencies:ensure
npm run dependencies:verify-lockfile
npm run lint:eslint
npm run typecheck
npm run cross-module-rbac-e2e:check
npm run cross-module-rbac-e2e:test
npm run cross-module-rbac-e2e:database
npm run cross-module-rbac-e2e:browser
npm run build
npm run verify:dist
npm run verify:preview
echo 'Stage G M52 candidate verification: PASS'
