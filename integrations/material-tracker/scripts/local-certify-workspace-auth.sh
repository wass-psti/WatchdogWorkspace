#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
VERSION="$(node -p "require('./package.json').version")"
WORKSPACE_ID="${MT_E2E_WORKSPACE_ID:-00000000-0000-4000-8000-000000000001}"
export MT_E2E_WORKSPACE_ID="$WORKSPACE_ID"

echo "============================================================"
echo "STAGE 1 - ENVIRONMENT PREPARATION"
echo "============================================================"
node -v; npm -v; uname -m; sw_vers

echo "============================================================"
echo "STAGE 2 - WORKSPACE / REPOSITORY VALIDATION"
echo "============================================================"
test -f package.json; test -f package-lock.json; test -f src/MaterialTrackerApp.jsx
test -f supabase/config.toml
test -f supabase/migrations/20261003061912_material_tracker_workspace_integration.sql
test -f supabase/migrations/20261003063134_material_tracker_viewer_comment_guard.sql
test -f supabase/migrations/20261003063657_material_tracker_private_helper_guard.sql
test -f supabase/migrations/20261003080739_material_tracker_notification_write_guard.sql
test -f supabase/migrations/20261003115017_material_tracker_atomic_file_import.sql
test -f supabase/migrations/20261003115954_material_tracker_import_payload_bounds.sql
test -f docs/MATERIAL_IMPORT_SPECIFICATION.md
test -f templates/material-tracker-import-template.csv
test -f templates/material-tracker-import-template.xlsx
test -f CHECKSUMS.sha256
shasum -a 256 -c CHECKSUMS.sha256
npm run check:integration
npm run check:data-clean

echo "============================================================"
echo "STAGE 3 - DEPENDENCY INSTALLATION / INTEGRITY"
echo "============================================================"
rm -rf node_modules dist
npm ci
npm ls --depth=0
npm run check:security

echo "============================================================"
echo "STAGE 4 - STATIC VERIFICATION"
echo "============================================================"
npm run check:static
npm run check:integration
npm run check:data-clean

echo "============================================================"
echo "STAGE 5 - DETERMINISTIC AUTOMATED TESTS"
echo "============================================================"
npm run test:deterministic
npm run test:exports
npm run test:import-export
npm run build
test -f dist/index.html
npx supabase@2.117.0 link --project-ref jtlusodorfnyzgyuewkz
node scripts/check-supabase-migrations.mjs

echo "============================================================"
echo "STAGE 6 - AUTHENTICATED BROWSER / E2E GATE"
echo "============================================================"
echo "Chrome may open to the live WatchdogWorkspace. Enter credentials only in that page, never Terminal."
npm run test:browser

echo "============================================================"
echo "STAGE 7 - DEDICATED CERTIFICATION"
echo "============================================================"
npm run certify

echo "============================================================"
echo "STAGE 8 - POST-CERTIFICATION REPOSITORY / STATE VALIDATION"
echo "============================================================"
npm run check:integration
npm run check:static
npm run check:data-clean
npm run build
test -f dist/index.html

echo "============================================================"
echo "STAGE 9 - HISTORICAL REGRESSION GATE"
echo "============================================================"
npm run test:regression

echo "============================================================"
echo "STAGE 10 - CHECKSUM / PACKAGE-HYGIENE VERIFICATION"
echo "============================================================"
shasum -a 256 -c CHECKSUMS.sha256
npm run check:package
test ! -f CERTIFICATION_PASS.txt

echo "============================================================"
echo "STAGE 11 - FINAL CHECKPOINT VALIDATION"
echo "============================================================"
npm run check:integration
npm run check:static
npm run check:data-clean
npm run test:deterministic
npm run test:exports
npm run test:import-export
npm run test:regression
npm run build
test -f dist/index.html

echo "Every required gate passed. Certified artifact creation is now permitted."
rm -rf node_modules dist supabase/.temp
cat > CERTIFICATION_PASS.txt <<PASS
Material Tracker WatchdogWorkspace Integration Certification
Version: ${VERSION}
State: FULLY VERIFIED BY REQUIRED LOCAL CERTIFICATION PIPELINE
PASS
rm -f FINAL_CHECKSUMS.sha256
find . -type f ! -name 'FINAL_CHECKSUMS.sha256' -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256 > FINAL_CHECKSUMS.sha256
shasum -a 256 -c FINAL_CHECKSUMS.sha256
cd ..
CERTIFIED_ZIP="Material-Tracker-v${VERSION}-WatchdogWorkspace-Integration-Certified-Baseline.zip"
rm -f "$CERTIFIED_ZIP" "$CERTIFIED_ZIP.sha256"
zip -qr "$CERTIFIED_ZIP" "$(basename "$ROOT")" -x '*/node_modules/*' '*/dist/*' '*/supabase/.temp/*' '*.DS_Store'
shasum -a 256 "$CERTIFIED_ZIP" > "$CERTIFIED_ZIP.sha256"
DOWNLOADS_DIR="$HOME/Downloads"
if [ -d "$DOWNLOADS_DIR" ]; then
  cp -f "$CERTIFIED_ZIP" "$DOWNLOADS_DIR/$CERTIFIED_ZIP"
  cp -f "$CERTIFIED_ZIP.sha256" "$DOWNLOADS_DIR/$CERTIFIED_ZIP.sha256"
fi
echo "============================================================"
echo "ALL REQUIRED LOCAL CERTIFICATION GATES PASS"
echo "============================================================"
echo "Certified baseline: $(pwd)/$CERTIFIED_ZIP"
if [ -d "$DOWNLOADS_DIR" ]; then
  echo "Downloads copy: $DOWNLOADS_DIR/$CERTIFIED_ZIP"
fi
echo "SHA-256:"; cat "$CERTIFIED_ZIP.sha256"
