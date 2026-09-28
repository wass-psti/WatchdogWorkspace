#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M70 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run analytics-ui:check
npm run analytics-ui:test
npm run analytics-ui:browser
npm run release:check
echo 'STAGE H M70 DASHBOARD ANALYTICS PRESENTATION RELEASE VERIFICATION: PASS'
