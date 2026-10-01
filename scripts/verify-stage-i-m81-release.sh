#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M81 release requires Node v22.16.0.' >&2; exit 1; }
npm run token-theme:check
npm run token-theme:test
npm run shared-primitives:source-guard
npm run shared-primitives:check
npm run shared-primitives:test
npm run application-shell:source-guard
npm run application-shell:check
npm run application-shell:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run application-shell:browser
npm run release:check
echo 'STAGE I M81 APPLICATION SHELL & GLOBAL NAVIGATION RELEASE VERIFICATION: PASS'
