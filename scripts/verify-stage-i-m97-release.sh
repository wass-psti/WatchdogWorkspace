#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M97 release requires Node v22.16.0.' >&2; exit 1; }
[ "$(npm --version)" = '10.9.2' ] || { echo 'FAIL: M97 release requires npm 10.9.2.' >&2; exit 1; }
npm run workspace-regression:source-guard
npm run workspace-regression:check
npm run workspace-regression:test
npm run functional-regression:check
npm run functional-regression:test
npm run cross-module-rbac-e2e:check
npm run timetracker-stabilization:check
npm run fueltrack-stabilization:check
npm run tradelink-stabilization:check
npm run typecheck
npm run lint:eslint
npm run build
npm run workspace-regression:browser
npm run workspace-regression:evidence
echo 'STAGE I M97 WORKSPACE-WIDE VISUAL REGRESSION & FUNCTIONAL PRESERVATION RELEASE VERIFICATION: PASS'
