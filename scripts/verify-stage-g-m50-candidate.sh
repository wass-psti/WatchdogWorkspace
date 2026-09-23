#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo "FAIL: M50 candidate verification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
npm run dependencies:ensure
npm run modern-tests:toolchain:ensure
npm run lint:eslint
npm run typecheck
node verify-stage-g-m42-users-rbac-functional-recovery.mjs
node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1240-architecture-phase3.mjs
bash tests/browser/run-browser-tests.sh
npm run rich-item-workspace-recovery:check
npm run rich-item-workspace-recovery:workflows
npm run rich-item-workspace-recovery:test
npm run rich-item-workspace-recovery:database
npm run database-rls:test:local
M50_BROWSER_GREP='@m50-files|@m50-delete-recovery' npm run rich-item-workspace-recovery:browser
npm run rich-item-workspace-recovery:browser
npm run rich-item-workspace-recovery:finalizer:test
npm run rich-item-workspace:check
npm run boards-kanban-drag-drop:verify:candidate
echo 'Stage G M50 candidate verification: PASS'
