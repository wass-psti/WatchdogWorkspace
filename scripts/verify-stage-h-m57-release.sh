#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M57 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run design-foundations:check
npm run design-foundations:test
npm run design-foundations:browser
npm run release:check
echo 'STAGE H M57 DESIGN FOUNDATIONS RELEASE VERIFICATION: PASS'
