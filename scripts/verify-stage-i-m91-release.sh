#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M91 release requires Node v22.16.0.' >&2; exit 1; }
npm run overlay-feedback:source-guard
npm run overlay-feedback:check
npm run overlay-feedback:test
npm run accessibility:check
npm run accessibility:test
npm run overlays:check
npm run overlays:test
npm run feedback:check
npm run feedback:test
npm run shared-primitives:check
npm run shared-primitives:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run overlay-feedback:browser
npm run release:check
echo 'STAGE I M91 DIALOG, DRAWER, OVERLAY & FEEDBACK SYSTEM RELEASE VERIFICATION: PASS'
