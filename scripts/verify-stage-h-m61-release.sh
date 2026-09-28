#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M61 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run layout:check
npm run layout:test
npm run layout:browser
npm run release:check
echo 'STAGE H M61 LAYOUT GRID SPATIAL SYSTEM RELEASE VERIFICATION: PASS'
