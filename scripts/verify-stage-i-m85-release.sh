#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M85 release requires Node v22.16.0.' >&2; exit 1; }
npm run time-tracker-visual:source-guard
npm run time-tracker-visual:check
npm run time-tracker-visual:test
npm run timetracker-stabilization:check
npm run time-tracker-ui:check
npm run time-tracker-ui:test
node verify-timetracker-v2-pass1.mjs
node verify-timetracker-v2-pass2.mjs
npm run recovery-quality:check
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run time-tracker-visual:browser
npm run release:check
echo 'STAGE I M85 TIMETRACKER VISUAL MIGRATION RELEASE VERIFICATION: PASS'
