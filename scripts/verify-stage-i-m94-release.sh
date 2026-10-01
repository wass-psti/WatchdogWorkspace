#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M94 release requires Node v22.16.0.' >&2; exit 1; }
npm run motion-architecture:source-guard
npm run motion-architecture:check
npm run motion-architecture:test
npm run motion-continuity:check
npm run motion-continuity:test
npm run accessibility:check
npm run accessibility:test
npm run application-shell:check
npm run application-shell:test
npm run overlay-feedback:check
npm run overlay-feedback:test
npm run interaction-harmonization:check
npm run interaction-harmonization:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run motion-architecture:browser
npm run release:check
echo 'STAGE I M94 MOTION & TRANSITION ARCHITECTURE RELEASE VERIFICATION: PASS'
