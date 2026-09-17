#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = "v22.16.0" ] || { echo "FAIL: M45 verification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
npm run boards-collection:check
npm run boards-collection:workflows
npm run boards-collection:test
npm run boards-collection:browser
npm run route-lifecycle:check
npm run route-lifecycle:test
npm run route-lifecycle:browser
npm run management-authority:check
npm run management-authority:test
npm run management-authority:browser
npm run account-recovery:check
npm run account-recovery:test
npm run account-recovery:browser
npm run users-rbac-recovery:check
npm run users-rbac-recovery:test
npm run users-rbac-recovery:browser
npm run settings-recovery:check
npm run settings-recovery:test
npm run settings-recovery:browser
npm run typecheck
npm run security:check
npm run verify:ui
npm run verify
npm run build
echo 'Stage G M45 Boards Collection & Route Recovery release verification: PASS'
