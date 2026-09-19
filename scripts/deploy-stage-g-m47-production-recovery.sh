#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "${WM_M47_ALLOW_PRODUCTION_MIGRATION:-0}" = '1' ] || { echo 'FAIL: set WM_M47_ALLOW_PRODUCTION_MIGRATION=1 to authorize the governed M47 production-resume attestation.' >&2; exit 1; }
: "${SUPABASE_PROJECT_REF:?FAIL: SUPABASE_PROJECT_REF is required.}"
: "${VITE_SUPABASE_URL:?FAIL: VITE_SUPABASE_URL is required.}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:?FAIL: VITE_SUPABASE_PUBLISHABLE_KEY is required.}"
EXPECTED_URL="https://${SUPABASE_PROJECT_REF}.supabase.co"
[ "${VITE_SUPABASE_URL%/}" = "$EXPECTED_URL" ] || { echo "FAIL: SUPABASE_PROJECT_REF does not match VITE_SUPABASE_URL ($EXPECTED_URL != ${VITE_SUPABASE_URL%/})." >&2; exit 1; }
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M47 production-resume attestation requires Node v22.16.0.' >&2; exit 1; }
[ "$(supabase --version | sed 's/^v//')" = '2.117.0' ] || { echo 'FAIL: M47 production-resume attestation requires Supabase CLI 2.117.0.' >&2; exit 1; }
MIGRATION="$ROOT/supabase/migrations/v1.43.2-stage-g-m47-boards-table-group-item-recovery.sql"
M46_MIGRATION="$ROOT/supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql"
M46_DEPLOYMENT_NAME='20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql'
M46_DEPLOYMENT="$ROOT/supabase/deployments/m46/$M46_DEPLOYMENT_NAME"
M47_DEPLOYMENT_NAME='20260919165239_stage_g_m47_boards_table_group_item_recovery.sql'
M47_DEPLOYMENT="$ROOT/supabase/deployments/m47/$M47_DEPLOYMENT_NAME"
[ -s "$MIGRATION" ] || { echo 'FAIL: M47 semantic migration is missing.' >&2; exit 1; }
[ -s "$M46_MIGRATION" ] || { echo 'FAIL: certified M46 semantic migration is missing.' >&2; exit 1; }
[ -s "$M46_DEPLOYMENT" ] || { echo 'FAIL: certified M46 timestamped deployment provenance is missing.' >&2; exit 1; }
[ -s "$M47_DEPLOYMENT" ] || { echo 'FAIL: certified M47 timestamped deployment provenance is missing from the post-deployment resume checkpoint.' >&2; exit 1; }
cmp -s "$M46_MIGRATION" "$M46_DEPLOYMENT" || { echo 'FAIL: certified M46 migration and timestamped deployment provenance differ.' >&2; exit 1; }
cmp -s "$MIGRATION" "$M47_DEPLOYMENT" || { echo 'FAIL: certified M47 source migration and timestamped deployment provenance differ.' >&2; exit 1; }
M47_PROVENANCE_COUNT="$(find "$ROOT/supabase/deployments/m47" -maxdepth 1 -type f -name '[0-9]*_stage_g_m47_boards_table_group_item_recovery.sql' | wc -l | tr -d ' ')"
[ "$M47_PROVENANCE_COUNT" = '1' ] || { echo "FAIL: post-deployment resume requires exactly one M47 deployment provenance file; found $M47_PROVENANCE_COUNT." >&2; exit 1; }
if NODE_OPTIONS='--experimental-strip-types --disable-warning=ExperimentalWarning' node scripts/verify-stage-g-m47-production-invariants.mjs; then
  echo "Stage G M47 production semantics already match; migration replay skipped (provenance=$M47_DEPLOYMENT_NAME)."
  echo 'Stage G M47 post-deployment resume attestation: PASS (replay-forbidden=true)'
  exit 0
fi
echo 'FAIL: M47 production was already deployed, but semantic attestation no longer matches. This resume checkpoint forbids migration replay, migration-history repair, or rollback; investigate production drift before continuing.' >&2
exit 1
