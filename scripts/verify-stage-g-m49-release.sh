#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo "FAIL: M49 release verification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
bash scripts/verify-stage-g-m49-candidate.sh
npm run boards-kanban-drag-drop:production-boundary
npm run boards-table-recovery:production
npm run board-backend-contract:production
echo 'Stage G M49 Boards Kanban & Drag/Drop Recovery release verification: PASS'
