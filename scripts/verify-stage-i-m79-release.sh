#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M79 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run visual-foundation:check
npm run visual-foundation:test
npm run token-theme:source-guard
npm run token-theme:check
npm run token-theme:test
npm run lint:eslint
npm run typecheck
npm run build
npm run token-theme:browser
npm run release:check
echo 'STAGE I M79 DESIGN TOKENS / SEMANTIC THEME RELEASE VERIFICATION: PASS'
