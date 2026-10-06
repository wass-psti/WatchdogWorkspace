#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT_DIR="${HOME}/Downloads"
ZIP_NAME="Work-Management-App-v1.43.2-Stage-I-M104-Hosted-Certification-Synchronization-Certified-Baseline.zip"
ZIP_PATH="$OUT_DIR/$ZIP_NAME"
SHA_PATH="$ZIP_PATH.sha256"
PASS_PATH="$OUT_DIR/Work-Management-App-v1.43.2-Stage-I-M104-Hosted-Certification-Synchronization-Certified-Baseline-PASS.txt"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
section(){ printf '\n============================================================\n%s\n============================================================\n' "$1"; }
section '1. ENVIRONMENT / SOURCE AUTHORITY'
node --version; npm --version; git --version
node scripts/verify-stage-i-m104-m103-source-guard.mjs
node verify-v1432-m104-hosted-certification-synchronization.mjs
section '2. DEPENDENCY / STATIC / BUILD'
rm -rf node_modules
npm ci
npm run dependencies:ensure
npm audit --audit-level=high
npm run typecheck
npm run lint
npm run build
section '3. ORIGINATING FAILURE REPRODUCTION GATES'
node scripts/verify-stage-h-m73-boards-ui-design-system-migration-execution.mjs
npm run modern-tests:toolchain:ensure
npm run route-lifecycle:browser
npm run management-authority:browser
npm run boards-collection:browser
npm run board-backend-contract:browser
npm run boards-table-recovery:browser
npm run boards-columns-cells-status:browser
npm run boards-kanban-drag-drop:browser
node scripts/run-rich-item-workspace-file-recovery-browser.mjs
section '4. PROMPTS 1-4 / DATABASE / REGRESSION PRESERVATION'
npm run prompts1-4:check
npm run database-rls:check
npm run prompts1-4:database
npm run modern-tests:test
npm run verify:ui
npm run workspace-regression:check
npm run workspace-regression:test
npm run futuristic-readiness:check
npm run futuristic-readiness:test
section '5. RELEASE / HISTORICAL / POST-STATE'
npm run release:check
npm run verify:historical-all
node scripts/verify-stage-i-m104-m103-source-guard.mjs
node verify-v1432-m104-hosted-certification-synchronization.mjs
section '6. PACKAGE / INTEGRITY'
mkdir -p "$OUT_DIR" "$TMP_DIR/repository"
rsync -a --delete --exclude '.git/' --exclude 'node_modules/' --exclude 'dist/' --exclude 'coverage/' --exclude 'test-results/' --exclude 'playwright-report/' --exclude '.DS_Store' --exclude 'Thumbs.db' "$ROOT/" "$TMP_DIR/repository/"
(cd "$TMP_DIR/repository" && zip -q -X -r "$ZIP_PATH" .)
unzip -t "$ZIP_PATH" >/dev/null
ZIP_SHA="$(shasum -a 256 "$ZIP_PATH" | awk '{print $1}')"
printf '%s  %s\n' "$ZIP_SHA" "$ZIP_NAME" > "$SHA_PATH"
test "$ZIP_SHA" = "$(awk '{print $1}' "$SHA_PATH")"
section '7. FINAL CHECKPOINT VALIDATION'
node scripts/verify-stage-i-m104-m103-source-guard.mjs
node verify-v1432-m104-hosted-certification-synchronization.mjs
npm run prompts1-4:check
npm run verify:vite-browser-cdp
npm run verify:preview
cat > "$PASS_PATH" <<PASS
M104 LOCAL CERTIFICATION: PASS
Repository: work-management-app@1.43.2
Checkpoint: Stage I M104 Hosted Certification Synchronization
Certified ZIP: $ZIP_NAME
SHA-256: $ZIP_SHA
State: FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE
PASS
cat "$PASS_PATH"
echo "M104 LOCAL CERTIFICATION: PASS"
echo "Certified ZIP: $ZIP_PATH"
echo "Checksum: $SHA_PATH"
echo "PASS record: $PASS_PATH"
