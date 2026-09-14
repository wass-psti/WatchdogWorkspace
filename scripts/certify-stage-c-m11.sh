#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${1:-}" == "--toolchain-check" ]]; then
  exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc '
    set -euo pipefail
    printf "M11 governed certification toolchain: %s / npm %s\n" "$(node -v)" "$(npm -v)"
  '
fi

exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc '
  set -euo pipefail
  ROOT="$1"
  cd "$ROOT"

  echo "=== 1. GOVERNED TOOLCHAIN ==="
  echo "Node: $(node -v)"
  echo "npm:  $(npm -v)"
  test "$(node -v)" = "v22.16.0"
  test "$(npm -v)" = "10.9.2"

  echo "=== 2. INSTALL EXACT LOCKFILE DEPENDENCIES ==="
  npm ci

  echo "=== 3. M10 / M11 ARCHITECTURE PREFLIGHT ==="
  npm run react-shell:check
  npm run global-overlays:check

  echo "=== 4. STRICT TYPES ==="
  npm run typecheck

  echo "=== 5. OVERLAY / UI HISTORICAL CHAIN ==="
  npm run verify:ui

  echo "=== 6. DEV BROWSER OWNERSHIP CONTRACT ==="
  npm run verify:dev

  echo "=== 7. PRODUCTION BUILD / DIST / PREVIEW CONTRACTS ==="
  npm run build
  npm run verify:dist
  npm run verify:preview

  echo "=== 8. COMPLETE STAGE C RELEASE CERTIFICATION ==="
  npm run stage-c:certify

  echo "=== 9. FINAL CERTIFICATION STATES ==="
  npm run design-system:status
  npm run interactions:status
  npm run runtime-schemas:status
  npm run supabase-client:status
  npm run tanstack-query:status
  npm run client-state:status
  npm run react-shell:status
  npm run global-overlays:status
' wm-m11-certification "$ROOT"
