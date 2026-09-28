#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M65 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run forms:check
npm run forms:test
npm run forms:browser
npm run release:check
echo 'STAGE H M65 FORM DATA-ENTRY EXPERIENCE ARCHITECTURE RELEASE VERIFICATION: PASS'
