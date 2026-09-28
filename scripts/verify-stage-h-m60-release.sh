#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M60 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run theme:check
npm run theme:test
npm run theme:browser
npm run release:check
echo 'STAGE H M60 COLOR THEME CONTRAST ARCHITECTURE RELEASE VERIFICATION: PASS'
