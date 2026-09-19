#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo "FAIL: M47 release verification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
bash scripts/verify-stage-g-m47-candidate.sh
npm run boards-table-recovery:production
npm run boards-table-recovery:deployment-provenance
echo 'Stage G M47 Boards Table / Group / Item Recovery release verification: PASS'
