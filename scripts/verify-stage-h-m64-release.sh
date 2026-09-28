#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M64 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run core-components:check
npm run core-components:test
npm run core-components:browser
npm run release:check
echo 'STAGE H M64 CORE COMPONENT SYSTEM CONSOLIDATION RELEASE VERIFICATION: PASS'
