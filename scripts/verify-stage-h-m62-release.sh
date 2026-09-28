#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M62 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run responsive:check
npm run responsive:test
npm run responsive:browser
npm run release:check
echo 'STAGE H M62 RESPONSIVE ARCHITECTURE ADAPTIVE PRIMITIVES RELEASE VERIFICATION: PASS'
