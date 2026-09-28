#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M66 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run overlays:check
npm run overlays:test
npm run overlays:browser
npm run release:check
echo 'STAGE H M66 OVERLAY DIALOG MENU FLOATING-SURFACE ARCHITECTURE RELEASE VERIFICATION: PASS'
