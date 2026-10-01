#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M93 release requires Node v22.16.0.' >&2; exit 1; }
npm run interaction-harmonization:source-guard
npm run interaction-harmonization:check
npm run interaction-harmonization:test
npm run accessibility:check
npm run accessibility:test
npm run forms:check
npm run forms:test
npm run motion-continuity:check
npm run motion-continuity:test
npm run shared-primitives:check
npm run shared-primitives:test
npm run application-shell:check
npm run application-shell:test
npm run overlay-feedback:check
npm run overlay-feedback:test
npm run state-system:check
npm run state-system:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run interaction-harmonization:browser
npm run release:check
echo 'STAGE I M93 ACCESSIBILITY & INTERACTION-STATE HARMONIZATION RELEASE VERIFICATION: PASS'
