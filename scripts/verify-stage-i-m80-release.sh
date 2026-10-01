#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M80 release requires Node v22.16.0.' >&2; exit 1; }
npm run token-theme:check
npm run token-theme:test
npm run shared-primitives:source-guard
npm run shared-primitives:check
npm run shared-primitives:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run shared-primitives:browser
npm run release:check
echo 'STAGE I M80 SHARED PRIMITIVE COMPONENT LAYER RELEASE VERIFICATION: PASS'
