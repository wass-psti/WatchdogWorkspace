#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M92 release requires Node v22.16.0.' >&2; exit 1; }
npm run state-system:source-guard
npm run state-system:check
npm run state-system:test
npm run accessibility:check
npm run accessibility:test
npm run feedback:check
npm run feedback:test
npm run overlay-feedback:check
npm run overlay-feedback:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run state-system:browser
npm run release:check
echo 'STAGE I M92 STATE SYSTEM COVERAGE RELEASE VERIFICATION: PASS'
