#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M90 release requires Node v22.16.0.' >&2; exit 1; }
npm run data-dense-enterprise:source-guard
npm run data-dense-enterprise:check
npm run data-dense-enterprise:test
npm run data-ui:check
npm run data-ui:test
npm run board-virtualization:check
npm run users-rbac-recovery:check
npm run users-rbac-recovery:test
npm run management-authority:check
npm run management-authority:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run data-dense-enterprise:browser
npm run users-rbac-recovery:browser
npm run management-authority:browser
npm run release:check
echo 'STAGE I M90 DATA-DENSE COMPONENTS & ENTERPRISE INTERACTION PATTERNS RELEASE VERIFICATION: PASS'
