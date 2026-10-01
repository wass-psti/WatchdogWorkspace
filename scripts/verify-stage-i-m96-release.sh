#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M96 release requires Node v22.16.0.' >&2; exit 1; }
[ "$(npm --version)" = '10.9.2' ] || { echo 'FAIL: M96 release requires npm 10.9.2.' >&2; exit 1; }
npm run visual-consistency:source-guard
npm run visual-consistency:check
npm run visual-consistency:test
npm run typecheck
npm run lint:eslint
npm run build
npm run visual-consistency:browser
echo 'STAGE I M96 VISUAL CONSISTENCY & LEGACY STYLING RETIREMENT RELEASE VERIFICATION: PASS'
