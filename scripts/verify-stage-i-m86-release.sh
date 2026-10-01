#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M86 release requires Node v22.16.0.' >&2; exit 1; }
npm run fueltrack-visual:source-guard
npm run fueltrack-visual:check
npm run fueltrack-visual:test
npm run fueltrack-stabilization:check
npm run fueltrack-ui:check
npm run fueltrack-ui:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run fueltrack-visual:browser
npm run release:check
echo 'STAGE I M86 FUELTRACK+ VISUAL MIGRATION RELEASE VERIFICATION: PASS'
