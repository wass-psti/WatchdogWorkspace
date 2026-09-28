#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M67 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run feedback:check
npm run feedback:test
npm run feedback:browser
npm run release:check
echo 'STAGE H M67 FEEDBACK STATUS EMPTY-STATE ERROR UX RELEASE VERIFICATION: PASS'
