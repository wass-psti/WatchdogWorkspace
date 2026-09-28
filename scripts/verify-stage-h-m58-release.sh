#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M58 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run design-tokens:check
npm run design-tokens:test
npm run design-tokens:browser
npm run release:check
echo 'STAGE H M58 DESIGN TOKEN ARCHITECTURE RELEASE VERIFICATION: PASS'
