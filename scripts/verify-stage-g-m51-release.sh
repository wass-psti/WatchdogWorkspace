#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
bash scripts/verify-stage-g-m51-candidate.sh
: "${WM_M51_PRODUCTION_EQUIVALENT_VERIFIED:?FAIL: set WM_M51_PRODUCTION_EQUIVALENT_VERIFIED=1 only after authenticated two-session Presence/Broadcast/token-refresh/reconnect/conflict/fallback browser verification against the target Supabase environment.}"
[ "$WM_M51_PRODUCTION_EQUIVALENT_VERIFIED" = '1' ] || { echo 'FAIL: M51 production-equivalent two-session verification has not been attested.' >&2; exit 1; }
echo 'Stage G M51 browser/release gate: PASS'
