#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "${1:-}" == "--toolchain-check" ]]; then
  exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc 'set -euo pipefail; printf "M21 governed certification toolchain: %s / npm %s\n" "$(node -v)" "$(npm -v)"'
fi
exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc '
  set -euo pipefail
  ROOT="$1"; cd "$ROOT"
  echo "=== 1. GOVERNED TOOLCHAIN ==="; echo "Node: $(node -v)"; echo "npm:  $(npm -v)"; test "$(node -v)" = "v22.16.0"; test "$(npm -v)" = "10.9.2"
  echo "=== 2. INSTALL EXACT LOCKFILE DEPENDENCIES ==="; npm ci
  echo "=== 3. M21 RICH ITEM WORKSPACE PREFLIGHT ==="; npm run board-realtime:check; npm run rich-item-workspace:check
  echo "=== 4. GOVERNED ESLINT FAIL-FAST ==="; npm run lint:eslint
  echo "=== 5. STRICT TYPES ==="; npm run typecheck
  echo "=== 6. M21 EXECUTION + UI REGRESSION ==="; node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-rich-item-workspace-execution.mjs; npm run verify:ui
  echo "=== 7. BOUNDED CDP BROWSER DRIVER ==="; npm run verify:vite-browser-cdp
  echo "=== 8. DEV BROWSER REGRESSION CONTRACT ==="; npm run verify:dev
  echo "=== 9. PRODUCTION BUILD / DIST / PREVIEW CONTRACTS ==="; npm run build; npm run verify:dist; npm run verify:preview
  echo "=== 10. COMPLETE STAGE D RELEASE CERTIFICATION ==="; npm run stage-d:certify
  echo "=== 11. FINAL CERTIFICATION STATES ==="; npm run board-realtime:status; npm run rich-item-workspace:status
' -- "$ROOT"
