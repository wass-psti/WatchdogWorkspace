#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M59 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run typography:check
npm run typography:test
npm run typography:browser
npm run release:check
echo 'STAGE H M59 TYPOGRAPHY CONTENT HIERARCHY RELEASE VERIFICATION: PASS'
