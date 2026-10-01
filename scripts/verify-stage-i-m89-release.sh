#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M89 release requires Node v22.16.0.' >&2; exit 1; }
npm run settings-configuration-visual:source-guard
npm run settings-configuration-visual:check
npm run settings-configuration-visual:test
npm run settings-recovery:check
npm run settings-recovery:test
npm run management-authority:check
npm run management-authority:test
npm run theme:check
npm run theme:test
npm run token-theme:check
npm run token-theme:test
npm run lint:eslint
npm run typecheck
npm run build
npm run performance:bundle
npm run settings-configuration-visual:browser
npm run settings-recovery:browser
npm run management-authority:browser
npm run release:check
echo 'STAGE I M89 SETTINGS & CONFIGURATION SURFACES RELEASE VERIFICATION: PASS'
