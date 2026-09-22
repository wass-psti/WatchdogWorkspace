#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo "FAIL: M49 candidate verification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
npm run lint:eslint
npm run boards-kanban-drag-drop:check
npm run boards-kanban-drag-drop:workflows
npm run boards-kanban-drag-drop:test
npm run boards-kanban-drag-drop:browser
npm run boards-kanban-drag-drop:production-boundary
npm run boards-kanban-drag-drop:cdp
npm run boards-columns-cells-status:check
npm run boards-columns-cells-status:test
npm run boards-columns-cells-status:browser
npm run boards-columns-cells-status:production-boundary
npm run boards-columns-cells-status:finalizer:test
npm run boards-table-recovery:check
npm run boards-table-recovery:test
npm run boards-table-recovery:browser
npm run boards-table-recovery:database
npm run boards-table-recovery:production
npm run boards-table-recovery:finalizer:test
npm run board-backend-contract:check
npm run board-backend-contract:test
npm run board-backend-contract:browser
npm run board-backend-contract:database
npm run board-backend-contract:production
npm run board-backend-contract:finalizer:test
npm run boards-collection:check
npm run boards-collection:test
npm run boards-collection:browser
npm run tanstack-table-evaluation:check
npm run board-virtualization:check
npm run database-rls:test:local
npm run typecheck
npm run security:check
npm run verify:ui
npm run verify
npm run build
echo 'Stage G M49 candidate verification: PASS'
