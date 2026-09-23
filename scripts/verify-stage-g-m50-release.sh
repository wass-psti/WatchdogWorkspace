#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
bash scripts/verify-stage-g-m50-candidate.sh
npm run rich-item-workspace-recovery:production
npm run board-backend-contract:production
npm run boards-table-recovery:production
npm run boards-kanban-drag-drop:production-boundary
echo 'Stage G M50 Rich Item Workspace & File Recovery release verification: PASS'
