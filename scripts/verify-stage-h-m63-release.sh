#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M63 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run accessibility:check
npm run accessibility:test
npm run accessibility:browser
npm run release:check
echo 'STAGE H M63 ACCESSIBILITY FOUNDATION INTERACTION SEMANTICS RELEASE VERIFICATION: PASS'
