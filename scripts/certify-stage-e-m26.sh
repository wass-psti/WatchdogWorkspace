#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "${1:-}" == "--toolchain-check" ]]; then exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc 'set -euo pipefail; printf "M26 governed certification toolchain: %s / npm %s\n" "$(node -v)" "$(npm -v)"'; fi
exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc '
set -euo pipefail; ROOT="$1"; cd "$ROOT"
echo "=== 1. GOVERNED TOOLCHAIN ==="; test "$(node -v)" = "v22.16.0"; test "$(npm -v)" = "10.9.2"
echo "=== 2. INSTALL EXACT LOCKFILE DEPENDENCIES ==="; npm ci
echo "=== 3. M26 PREFLIGHT ==="; npm run tradelink-stabilization:check; npm run iframe-retirement:check
echo "=== 4. GOVERNED ESLINT ==="; npm run lint:eslint
echo "=== 5. STRICT TYPES ==="; npm run typecheck
echo "=== 6. M26 EXECUTION + EMBEDDED REGRESSION ==="; node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-module-presentation-execution.mjs; node verify-timetracker-runtime.mjs; node verify-fueltrack-integration.mjs; node verify-tradelink-integration.mjs; node verify-v1270-domain-browser-quality.mjs; node verify-v1300-motion-architecture.mjs; node verify-v1432-embedded-runtime-production.mjs; npm run verify:ui
echo "=== 7. BOUNDED CDP BROWSER DRIVER ==="; npm run verify:vite-browser-cdp
echo "=== 8. DEV BROWSER REGRESSION CONTRACT ==="; npm run verify:dev
echo "=== 9. PRODUCTION BUILD / DIST / PREVIEW CONTRACTS ==="; npm run build; npm run verify:dist; npm run verify:preview
echo "=== 10. COMPLETE STAGE E RELEASE CERTIFICATION ==="; npm run stage-e:certify
echo "=== 11. FINAL M26 STATUS ==="; npm run iframe-retirement:status
' -- "$ROOT"
