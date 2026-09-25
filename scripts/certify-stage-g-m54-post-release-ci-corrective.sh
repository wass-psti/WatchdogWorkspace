#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

npm run production-readiness:workflow-governance
npm run board-backend-contract:check
npm run board-backend-contract:test
npm run board-backend-contract:workflows
npm run board-backend-contract:browser
npm run boards-table-recovery:check
npm run boards-table-recovery:test
npm run boards-table-recovery:workflows
npm run boards-table-recovery:browser
npm run boards-columns-cells-status:check
npm run boards-columns-cells-status:test
npm run boards-columns-cells-status:workflows
npm run boards-columns-cells-status:browser
npm run boards-kanban-drag-drop:check
npm run boards-kanban-drag-drop:test
npm run boards-kanban-drag-drop:workflows
npm run boards-kanban-drag-drop:browser
npm run boards-kanban-drag-drop:cdp
npm run rich-item-workspace-recovery:check
npm run rich-item-workspace-recovery:test
npm run rich-item-workspace-recovery:workflows
node scripts/verify-stage-g-m50-m49-certified-context.mjs
npm run rich-item-workspace-recovery:browser
npm run production-readiness:check
npm run production-readiness:test

echo 'M54 POST-RELEASE CI / HISTORICAL HARNESS CORRECTIVE CERTIFICATION: PASS'
