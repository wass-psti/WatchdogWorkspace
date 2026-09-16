#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = "v22.16.0" ] || { echo "FAIL: M43 verification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
npm run settings-recovery:check
npm run settings-recovery:test
npm run settings-recovery:browser
npm run backup-dr:check
npm run backup-dr:test
npm run typecheck
npm run security:check
npm run verify:ui
npm run verify
npm run build
echo 'Stage G M43 release verification: PASS'
