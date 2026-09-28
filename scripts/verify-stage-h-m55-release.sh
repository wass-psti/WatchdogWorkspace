#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M55 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run full-stack-structure:check
npm run full-stack-structure:test
npm run full-stack-structure:browser
npm run release:check
echo 'STAGE H M55 RELEASE VERIFICATION: PASS'
