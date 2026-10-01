#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M98 release requires Node v22.16.0.' >&2; exit 1; }
[ "$(npm --version)" = '10.9.2' ] || { echo 'FAIL: M98 release requires npm 10.9.2.' >&2; exit 1; }
npm run futuristic-readiness:source-guard
npm run futuristic-readiness:check
npm run futuristic-readiness:test
npm run typecheck
npm run lint:eslint
npm run build
npm run futuristic-readiness:browser
npm run futuristic-readiness:evidence
echo 'STAGE I M98 FUTURISTIC MINIMALIST PRODUCTION READINESS RELEASE VERIFICATION: PASS'
