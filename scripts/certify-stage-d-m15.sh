#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "${1:-}" == "--toolchain-check" ]]; then
  exec bash "$ROOT/scripts/run-governed-toolchain.sh" /bin/bash -lc '
    set -euo pipefail
    printf "M15 governed certification toolchain: %s / npm %s\n" "$(node -v)" "$(npm -v)"
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
  echo "=== 3. M15 ARCHITECTURE PREFLIGHT ==="
  npm run shared-app-ui:check
  npm run board-presentation:check
  echo "=== 4. GOVERNED ESLINT FAIL-FAST ==="
  npm run lint:eslint
  echo "=== 5. STRICT TYPES ==="
  npm run typecheck
  echo "=== 6. BOARD PRESENTATION REGRESSION CHAIN ==="
  node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-board-presentation-facade-execution.mjs
  npm run verify:ui
  echo "=== 7. DEV BROWSER BOARD FACADE OWNERSHIP CONTRACT ==="
  npm run verify:dev
  echo "=== 8. PRODUCTION BUILD / DIST / PREVIEW CONTRACTS ==="
  npm run build
  npm run verify:dist
  npm run verify:preview
  echo "=== 9. COMPLETE STAGE D RELEASE CERTIFICATION ==="
  npm run stage-d:certify
  echo "=== 10. FINAL CERTIFICATION STATES ==="
  npm run shared-app-ui:status
  npm run board-presentation:status
' -- "$ROOT"
