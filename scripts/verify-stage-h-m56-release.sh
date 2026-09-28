#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M56 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run ui-inventory:check
npm run ui-inventory:test
npm run ui-inventory:browser
npm run release:check
echo 'STAGE H M56 UI ARCHITECTURE INVENTORY RELEASE VERIFICATION: PASS'
