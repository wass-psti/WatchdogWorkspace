#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo "FAIL: M51 candidate requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
npm run dependencies:ensure
npm run dependencies:verify-lockfile
npm run lint:eslint
npm run typecheck
npm run boards-realtime-concurrency:check
npm run boards-realtime-concurrency:test
npm run board-realtime:check
npm run realtime-platform:check
npm run boards-realtime-concurrency:database
npm run build
npm run verify:dist
npm run verify:preview
echo 'Stage G M51 candidate verification: PASS'
