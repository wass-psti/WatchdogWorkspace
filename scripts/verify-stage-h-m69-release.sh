#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M69 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run data-ui:check
npm run data-ui:test
npm run data-ui:browser
npm run release:check
echo 'STAGE H M69 DATA PRESENTATION DENSE UI RELEASE VERIFICATION: PASS'
