#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M87 release requires Node v22.16.0.' >&2; exit 1; }
npm run tradelink-visual:source-guard
npm run tradelink-visual:check
npm run tradelink-visual:test
npm run tradelink-stabilization:check
npm run tradelink-ui:check
npm run tradelink-ui:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run tradelink-visual:browser
npm run release:check
echo 'STAGE I M87 TRADELINK VISUAL MIGRATION RELEASE VERIFICATION: PASS'
