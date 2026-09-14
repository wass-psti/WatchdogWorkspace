#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "${1:-}" == "--toolchain-check" ]]; then exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc 'set -euo pipefail; printf "M30 governed certification toolchain: %s / npm %s\n" "$(node -v)" "$(npm -v)"'; fi
exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc '
set -euo pipefail; ROOT="$1"; cd "$ROOT"
echo "=== 1. GOVERNED TOOLCHAIN ==="; test "$(node -v)" = "v22.16.0"; test "$(npm -v)" = "10.9.2"
echo "=== 2. INSTALL EXACT APPLICATION LOCKFILE DEPENDENCIES ==="; npm ci
echo "=== 3. M29/M30 PREFLIGHT ==="; npm run database-rls:check; npm run modern-tests:check
echo "=== 4. MODERN UNIT/COMPONENT TESTS ==="; npm run modern-tests:test
echo "=== 5. MODERN V8 COVERAGE GATE ==="; npm run modern-tests:coverage
echo "=== 6. MODERN PLAYWRIGHT REAL-BROWSER SMOKE ==="; npm run modern-tests:e2e
echo "=== 7. GOVERNED ESLINT ==="; npm run lint:eslint
echo "=== 8. STRICT TYPES ==="; npm run typecheck
echo "=== 9. M29/M28/M27/M20 REGRESSION ==="; npm run database-rls:check; npm run edge-functions:check; npm run realtime-platform:check; npm run board-realtime:check
echo "=== 10. DATABASE/RLS BEHAVIORAL REGRESSION ==="; npm run database-rls:test:local
echo "=== 11. BOUNDED CDP REAL-BROWSER REGRESSION ==="; npm run verify:vite-browser-cdp
echo "=== 12. DEV BROWSER REGRESSION CONTRACT ==="; npm run verify:dev
echo "=== 13. PRODUCTION BUILD / DIST / PREVIEW CONTRACTS ==="; npm run build; npm run verify:dist; npm run verify:preview
echo "=== 14. COMPLETE STAGE F RELEASE CERTIFICATION ==="; npm run stage-f:certify
echo "=== 15. FINAL M30 STATUS ==="; npm run modern-tests:status
' -- "$ROOT"
