#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M78 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run final-ui:check
npm run final-ui:test
npm run visual-foundation:check
npm run visual-foundation:test
npm run visual-foundation:browser
npm run release:check
echo 'STAGE I M78 VISUAL-SYSTEM FOUNDATION RELEASE VERIFICATION: PASS'
