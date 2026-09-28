#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M68 release verification requires Node v22.16.0.' >&2; exit 1; }
npm run shell-ia:check
npm run shell-ia:test
npm run shell-ia:browser
npm run release:check
echo 'STAGE H M68 APPLICATION SHELL NAVIGATION REFINEMENT RELEASE VERIFICATION: PASS'
