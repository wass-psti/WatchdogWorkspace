#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "${WM_M46_ALLOW_PRODUCTION_MIGRATION:-0}" = '1' ] || { echo 'FAIL: set WM_M46_ALLOW_PRODUCTION_MIGRATION=1 to authorize the isolated M46 production migration.' >&2; exit 1; }
: "${SUPABASE_PROJECT_REF:?FAIL: SUPABASE_PROJECT_REF is required.}"
: "${VITE_SUPABASE_URL:?FAIL: VITE_SUPABASE_URL is required.}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:?FAIL: VITE_SUPABASE_PUBLISHABLE_KEY is required.}"
EXPECTED_URL="https://${SUPABASE_PROJECT_REF}.supabase.co"
[ "${VITE_SUPABASE_URL%/}" = "$EXPECTED_URL" ] || { echo "FAIL: SUPABASE_PROJECT_REF does not match VITE_SUPABASE_URL ($EXPECTED_URL != ${VITE_SUPABASE_URL%/})." >&2; exit 1; }
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M46 production migration requires Node v22.16.0.' >&2; exit 1; }
[ "$(supabase --version | sed 's/^v//')" = '2.117.0' ] || { echo 'FAIL: M46 production migration requires Supabase CLI 2.117.0.' >&2; exit 1; }
MIGRATION="$ROOT/supabase/migrations/v1.43.2-stage-g-m46-boards-backend-data-contract-recovery.sql"
DEPLOYMENT="$ROOT/supabase/deployments/m46/20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql"
cmp -s "$MIGRATION" "$DEPLOYMENT" || { echo 'FAIL: M46 source migration and isolated deployment copy differ.' >&2; exit 1; }
# Production is attestation-first. If the exact governed contract is already live,
# do not replay DDL merely because a local migration ledger differs.
if NODE_OPTIONS='--experimental-strip-types --disable-warning=ExperimentalWarning' node scripts/verify-stage-g-m46-production-contract.mjs >/dev/null 2>&1; then
  echo 'Stage G M46 production contract already matches the governed version/digest; migration replay skipped.'
  exit 0
fi
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/supabase/migrations"
printf 'project_id = "m46-production-contract-deployment"\n' > "$WORK/supabase/config.toml"
cp "$DEPLOYMENT" "$WORK/supabase/migrations/20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql"
supabase projects list >/dev/null
if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
  supabase --workdir "$WORK" link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
  echo '=== M46 production migration dry run ==='
  supabase --workdir "$WORK" db push --linked --include-all --password "$SUPABASE_DB_PASSWORD" --dry-run
  echo '=== M46 production migration apply ==='
  supabase --workdir "$WORK" db push --linked --include-all --password "$SUPABASE_DB_PASSWORD" --yes
else
  # Keep this branch array-free: macOS ships Bash 3.2, where an empty array
  # expanded under `set -u` can terminate the script before `supabase link`.
  supabase --workdir "$WORK" link --project-ref "$SUPABASE_PROJECT_REF"
  echo '=== M46 production migration dry run ==='
  supabase --workdir "$WORK" db push --linked --include-all --dry-run
  echo '=== M46 production migration apply ==='
  supabase --workdir "$WORK" db push --linked --include-all --yes
fi
NODE_OPTIONS='--experimental-strip-types --disable-warning=ExperimentalWarning' node scripts/verify-stage-g-m46-production-contract.mjs
echo 'Stage G M46 isolated production migration + live catalog attestation: PASS'
