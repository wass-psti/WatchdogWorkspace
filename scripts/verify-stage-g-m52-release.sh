#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
bash scripts/verify-stage-g-m52-candidate.sh
echo 'Stage G M52 release verification: PASS'
