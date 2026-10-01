#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M95 release requires Node v22.16.0.' >&2; exit 1; }
[ "$(npm --version)" = '10.9.2' ] || { echo 'FAIL: M95 release requires npm 10.9.2.' >&2; exit 1; }
npm run responsive-harmonization:source-guard
npm run responsive-harmonization:check
npm run responsive-harmonization:test
npm run typecheck
npm run lint:eslint
npm run build
npm run responsive-harmonization:browser
echo 'STAGE I M95 CROSS-MODULE RESPONSIVE HARMONIZATION RELEASE VERIFICATION: PASS'
