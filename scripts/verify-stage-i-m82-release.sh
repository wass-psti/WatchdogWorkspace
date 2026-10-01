#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M82 release requires Node v22.16.0.' >&2; exit 1; }
npm run application-shell:source-guard
npm run application-shell:check
npm run application-shell:test
npm run layout-composition:source-guard
npm run layout-composition:check
npm run layout-composition:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run layout-composition:browser
npm run release:check
echo 'STAGE I M82 LAYOUT, SURFACE & RESPONSIVE COMPOSITION RELEASE VERIFICATION: PASS'
