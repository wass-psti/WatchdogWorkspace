#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${1:-}" == "--toolchain-check" ]]; then
  exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc '
    set -euo pipefail
    printf "M14 governed certification toolchain: %s / npm %s\n" "$(node -v)" "$(npm -v)"
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

  echo "=== 3. M10 / M11 / M12 / M13 / M14 ARCHITECTURE PREFLIGHT ==="
  npm run react-shell:check
  npm run global-overlays:check
  npm run authentication-ui:check
  npm run account-settings-users:check
  npm run shared-app-ui:check

  echo "=== 4. GOVERNED ESLINT FAIL-FAST ==="
  npm run lint:eslint

  echo "=== 5. STRICT TYPES ==="
  npm run typecheck

  echo "=== 6. COMMAND / SHARED APPLICATION UI REGRESSION CHAIN ==="
  node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-shared-application-ui-execution.mjs
  npm run verify:ui

  echo "=== 7. DEV BROWSER SHARED UI OWNERSHIP CONTRACT ==="
  npm run verify:dev

  echo "=== 8. PRODUCTION BUILD / DIST / PREVIEW CONTRACTS ==="
  npm run build
  npm run verify:dist
  npm run verify:preview

  echo "=== 9. COMPLETE STAGE C RELEASE CERTIFICATION ==="
  npm run stage-c:certify

  echo "=== 10. FINAL CERTIFICATION STATES ==="
  npm run design-system:status
  npm run interactions:status
  npm run runtime-schemas:status
  npm run supabase-client:status
  npm run tanstack-query:status
  npm run client-state:status
  npm run react-shell:status
  npm run global-overlays:status
  npm run authentication-ui:status
  npm run account-settings-users:status
  npm run shared-app-ui:status
' -- "$ROOT"
