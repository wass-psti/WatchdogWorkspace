#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "${WM_M50_ALLOW_PRODUCTION_MIGRATION:-0}" = '1' ] || { echo 'FAIL: set WM_M50_ALLOW_PRODUCTION_MIGRATION=1 to authorize the isolated M50 production migration.' >&2; exit 1; }
: "${SUPABASE_PROJECT_REF:?FAIL: SUPABASE_PROJECT_REF is required.}"
: "${VITE_SUPABASE_URL:?FAIL: VITE_SUPABASE_URL is required.}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:?FAIL: VITE_SUPABASE_PUBLISHABLE_KEY is required.}"
EXPECTED_URL="https://${SUPABASE_PROJECT_REF}.supabase.co"
[ "${VITE_SUPABASE_URL%/}" = "$EXPECTED_URL" ] || { echo "FAIL: SUPABASE_PROJECT_REF does not match VITE_SUPABASE_URL." >&2; exit 1; }
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M50 production migration requires Node v22.16.0.' >&2; exit 1; }
[ "$(supabase --version | sed 's/^v//')" = '2.117.0' ] || { echo 'FAIL: M50 production migration requires Supabase CLI 2.117.0.' >&2; exit 1; }
MIGRATION="$ROOT/supabase/migrations/v1.43.2-stage-g-m50-rich-item-workspace-file-recovery.sql"
DEPLOYMENT="$ROOT/supabase/deployments/m50/20260922141400_stage_g_m50_rich_item_workspace_file_recovery.sql"
cmp -s "$MIGRATION" "$DEPLOYMENT" || { echo 'FAIL: M50 source migration and isolated deployment copy differ.' >&2; exit 1; }
if node scripts/verify-stage-g-m50-production-invariants.mjs >/dev/null 2>&1; then
  node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-stage-g-m46-production-contract.mjs
  echo 'Stage G M50 production recovery is already live; M50/M46 live attestations PASS; migration replay skipped.'
  exit 0
fi
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/supabase/migrations"
printf 'project_id = "m50-production-recovery-deployment"\n' > "$WORK/supabase/config.toml"
cp "$ROOT/supabase/deployments/m46/20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql" "$WORK/supabase/migrations/20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql"
cp "$ROOT/supabase/deployments/m47/20260919165239_stage_g_m47_boards_table_group_item_recovery.sql" "$WORK/supabase/migrations/20260919165239_stage_g_m47_boards_table_group_item_recovery.sql"
cp "$DEPLOYMENT" "$WORK/supabase/migrations/20260922141400_stage_g_m50_rich_item_workspace_file_recovery.sql"
supabase projects list >/dev/null
if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
  supabase --workdir "$WORK" link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
  supabase --workdir "$WORK" migration list --linked
  supabase --workdir "$WORK" db push --linked --password "$SUPABASE_DB_PASSWORD" --dry-run
  supabase --workdir "$WORK" db push --linked --password "$SUPABASE_DB_PASSWORD" --yes
else
  supabase --workdir "$WORK" link --project-ref "$SUPABASE_PROJECT_REF"
  supabase --workdir "$WORK" migration list --linked
  supabase --workdir "$WORK" db push --linked --dry-run
  supabase --workdir "$WORK" db push --linked --yes
fi
node scripts/verify-stage-g-m50-production-invariants.mjs
node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-stage-g-m46-production-contract.mjs
echo 'Stage G M50 isolated production migration + M50/M46 live attestation: PASS'
