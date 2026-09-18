#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = "v22.16.0" ] || { echo "FAIL: M46 verification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
npm run board-backend-contract:check
npm run board-backend-contract:workflows
npm run board-backend-contract:test
npm run board-backend-contract:browser
npm run board-backend-contract:database
npm run board-backend-contract:production
npm run boards-collection:check
npm run boards-collection:test
npm run boards-collection:browser
npm run backend-preflight:check
npm run backend-preflight:test
npm run backend-preflight:browser
npm run route-lifecycle:check
npm run route-lifecycle:test
npm run management-authority:check
npm run management-authority:test
npm run account-recovery:check
npm run users-rbac-recovery:check
npm run settings-recovery:check
npm run typecheck
npm run security:check
npm run verify:ui
npm run verify
npm run build
echo 'Stage G M46 Boards Backend & Data Contract Recovery release verification: PASS'
