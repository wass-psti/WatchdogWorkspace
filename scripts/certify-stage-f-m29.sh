#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "${1:-}" == "--toolchain-check" ]]; then exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc 'set -euo pipefail; printf "M29 governed certification toolchain: %s / npm %s\n" "$(node -v)" "$(npm -v)"'; fi
exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc '
set -euo pipefail; ROOT="$1"; cd "$ROOT"
echo "=== 1. GOVERNED TOOLCHAIN ==="; test "$(node -v)" = "v22.16.0"; test "$(npm -v)" = "10.9.2"
echo "=== 2. INSTALL EXACT LOCKFILE DEPENDENCIES ==="; npm ci
echo "=== 3. M29 PREFLIGHT ==="; npm run edge-functions:check; npm run database-rls:check
echo "=== 4. LOCAL DATABASE REBUILD + PGTAP RLS SUITE ==="; npm run database-rls:test:local
echo "=== 5. GOVERNED ESLINT ==="; npm run lint:eslint
echo "=== 6. STRICT TYPES ==="; npm run typecheck
echo "=== 7. M28/M27/M20 REGRESSION ==="; npm run edge-functions:check; npm run realtime-platform:check; npm run board-realtime:check
echo "=== 8. BOUNDED CDP BROWSER DRIVER ==="; npm run verify:vite-browser-cdp
echo "=== 9. DEV BROWSER REGRESSION CONTRACT ==="; npm run verify:dev
echo "=== 10. PRODUCTION BUILD / DIST / PREVIEW CONTRACTS ==="; npm run build; npm run verify:dist; npm run verify:preview
echo "=== 11. COMPLETE STAGE F RELEASE CERTIFICATION ==="; npm run stage-f:certify
echo "=== 12. FINAL M29 STATUS ==="; npm run database-rls:status
' -- "$ROOT"
