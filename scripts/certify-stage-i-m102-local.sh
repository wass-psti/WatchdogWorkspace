#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT_DIR="${HOME}/Downloads"
ZIP_NAME="Work-Management-App-v1.43.2-Stage-I-M102-Boards-Data-Portability-Certified-Baseline.zip"
ZIP_PATH="$OUT_DIR/$ZIP_NAME"
SHA_PATH="$ZIP_PATH.sha256"
PASS_PATH="$OUT_DIR/Work-Management-App-v1.43.2-Stage-I-M102-Boards-Data-Portability-Certified-Baseline-PASS.txt"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
section(){ printf '\n============================================================\n%s\n============================================================\n' "$1"; }

section '1. ENVIRONMENT PREPARATION'
node --version
npm --version
git --version

section '2. CANONICAL BASELINE / WORKSPACE / REPOSITORY VALIDATION'
test -f package.json
test -f package-lock.json
test -f M102-M101-BASELINE-SOURCE-MANIFEST.json
test -f M102-BOARDS-IMPORT-EXPORT-SPECIFICATION.md
test -f templates/boards/work-management-board-import-template.csv
test -f templates/boards/work-management-board-import-template.xlsx
test -f verify-v1432-m102-board-data-portability.mjs
node scripts/verify-stage-i-m102-m101-source-guard.mjs

section '3. TOOLCHAIN + DEPENDENCY INSTALLATION / INTEGRITY'
rm -rf node_modules
npm ci
npm run dependencies:ensure
npm audit --audit-level=high

section '4. STATIC ANALYSIS / TYPECHECK / LINT / BUILD'
npm run boards-data-portability:check
node scripts/verify-stage-i-m102-m101-source-guard.mjs
npm run typecheck
npm run lint
npm run build

section '5. DETERMINISTIC / DATABASE / ROUND-TRIP TESTS'
npm run modern-tests:check
npm run modern-tests:test
npm run database-rls:check
npm run boards-import-preview:database
npm run boards-data-portability:check
npm run verify:ui

section '6. BROWSER / E2E VALIDATION'
npm run verify:vite-browser-cdp
npm run verify:preview
npm run modern-tests:toolchain:ensure
npm run test:m99:sidebar
npm run settings-recovery:browser

section '7. DEDICATED CERTIFICATION / HISTORICAL SUCCESSOR CHAIN'
npm run boards-data-portability:check
node scripts/verify-stage-i-m101-m100-source-guard.mjs
node scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs
npm run workspace-regression:check
npm run workspace-regression:test
npm run futuristic-readiness:check
npm run futuristic-readiness:test

section '8. POST-CERTIFICATION REPOSITORY / STATE VALIDATION'
node scripts/verify-stage-i-m102-m101-source-guard.mjs
npm run boards-data-portability:check

section '9. HISTORICAL REGRESSION VALIDATION'
npm run verify:historical-all

section '10. CHECKSUM / PACKAGE HYGIENE / CERTIFIED ARTIFACT EMISSION'
mkdir -p "$OUT_DIR" "$TMP_DIR/repository"
rsync -a --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude 'coverage/' \
  --exclude 'test-results/' \
  --exclude 'playwright-report/' \
  --exclude '.DS_Store' \
  --exclude 'Thumbs.db' \
  "$ROOT/" "$TMP_DIR/repository/"
(
  cd "$TMP_DIR/repository"
  zip -q -X -r "$ZIP_PATH" .
)
unzip -t "$ZIP_PATH" >/dev/null
ZIP_SHA="$(shasum -a 256 "$ZIP_PATH" | awk '{print $1}')"
printf '%s  %s\n' "$ZIP_SHA" "$ZIP_NAME" > "$SHA_PATH"
test "$ZIP_SHA" = "$(awk '{print $1}' "$SHA_PATH")"

section '11. FINAL CHECKPOINT VALIDATION'
npm run boards-data-portability:check
node scripts/verify-stage-i-m102-m101-source-guard.mjs
npm run verify:vite-browser-cdp
npm run verify:preview

cat > "$PASS_PATH" <<PASS
M102 LOCAL CERTIFICATION: PASS
Repository: work-management-app@1.43.2
Checkpoint: Stage I M102 Boards Export, Import Specification, Templates, and Round-Trip Compatibility
Certified ZIP: $ZIP_NAME
SHA-256: $ZIP_SHA
State: FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE
PASS

cat "$PASS_PATH"
echo "M102 LOCAL CERTIFICATION: PASS"
echo "Certified ZIP: $ZIP_PATH"
echo "Checksum: $SHA_PATH"
echo "PASS record: $PASS_PATH"
