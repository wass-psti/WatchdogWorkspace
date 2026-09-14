#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "${1:-}" == "--toolchain-check" ]]; then exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc 'set -euo pipefail; printf "M28 governed certification toolchain: %s / npm %s\n" "$(node -v)" "$(npm -v)"'; fi
exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc '
set -euo pipefail; ROOT="$1"; cd "$ROOT"
echo "=== 1. GOVERNED TOOLCHAIN ==="; test "$(node -v)" = "v22.16.0"; test "$(npm -v)" = "10.9.2"
echo "=== 2. INSTALL EXACT LOCKFILE DEPENDENCIES ==="; npm ci
echo "=== 3. M28 PREFLIGHT ==="; npm run realtime-platform:check; npm run edge-functions:check
echo "=== 4. GOVERNED ESLINT ==="; npm run lint:eslint
echo "=== 5. STRICT TYPES ==="; npm run typecheck
echo "=== 6. M28 EXECUTION + M27/M20 REGRESSION ==="; node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-edge-functions-execution.mjs; npm run realtime-platform:check; npm run board-realtime:check
echo "=== 7. BOUNDED CDP BROWSER DRIVER ==="; npm run verify:vite-browser-cdp
echo "=== 8. DEV BROWSER REGRESSION CONTRACT ==="; npm run verify:dev
echo "=== 9. PRODUCTION BUILD / DIST / PREVIEW CONTRACTS ==="; npm run build; npm run verify:dist; npm run verify:preview
echo "=== 10. COMPLETE STAGE F RELEASE CERTIFICATION ==="; npm run stage-f:certify
echo "=== 11. FINAL M28 STATUS ==="; npm run realtime-platform:status; npm run edge-functions:status
' -- "$ROOT"
