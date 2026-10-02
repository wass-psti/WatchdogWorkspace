#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
ARTIFACT_BASENAME="Work-Management-App-v1.43.2-Stage-I-M99-Certified-Baseline"
OUT_DIR="${M99_OUTPUT_DIR:-$HOME/Downloads}"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/m99-cert.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

SOURCE_MANIFEST_BEFORE="$TMP_DIR/source-before.sha256"
SOURCE_MANIFEST_AFTER="$TMP_DIR/source-after.sha256"
PACKAGE_ROOT="$TMP_DIR/package"
ZIP_PATH="$OUT_DIR/${ARTIFACT_BASENAME}.zip"
SHA_PATH="$OUT_DIR/${ARTIFACT_BASENAME}.sha256"
PASS_PATH="$OUT_DIR/${ARTIFACT_BASENAME}-PASS.txt"

manifest() {
  find . -type f \
    ! -path './node_modules/*' \
    ! -path './dist/*' \
    ! -path './test-results/*' \
    ! -path './playwright-report/*' \
    ! -path './.git/*' \
    ! -name '.DS_Store' \
    ! -name 'Thumbs.db' \
    ! -name '*.swp' \
    ! -name '*.tmp' \
    -print0 \
    | LC_ALL=C sort -z \
    | xargs -0 shasum -a 256
}

section() {
  printf '\n============================================================\n'
  printf '%s\n' "$1"
  printf '============================================================\n'
}

section '1. ENVIRONMENT PREPARATION'
node --version
npm --version
git --version || true

section '2. WORKSPACE / REPOSITORY VALIDATION'
test -f package.json
test -f package-lock.json
test -f verify-v1432-shell-section-resize-corrective.mjs
test -f verify-v1432-m99-sidebar-resizer-minimal-affordance-corrective.mjs
test -f tests/modern/e2e/m99-sidebar-interaction-containment.spec.mjs
test -f scripts/run-stage-i-m99-sidebar-browser.mjs
node -e 'const p=require("./package.json"); if(p.name!=="work-management-app"||p.version!=="1.43.2") process.exit(1); console.log(`Repository identity: ${p.name}@${p.version}`)'
manifest > "$SOURCE_MANIFEST_BEFORE"
printf 'Repository/source manifest capture: PASS\n'

section '3. DEPENDENCY INSTALLATION + DEPENDENCY-INTEGRITY VALIDATION'
rm -rf node_modules
npm ci
npm ls --all >/dev/null
npm run dependencies:ensure
printf 'Dependency installation/integrity: PASS\n'

section '4. STATIC VERIFICATION'
npm run verify:m99:sidebar
node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1432-m99-sidebar-resizer-minimal-affordance-corrective.mjs
npm run verify:m99:hosted
npm run typecheck
npm run lint
npm run build
printf 'Static/type/lint/build verification: PASS\n'

section '5. DETERMINISTIC AUTOMATED TESTS'
npm run modern-tests:check
npm run modern-tests:test
npm run verify:ui
printf 'Deterministic automated tests: PASS\n'

section '6. BROWSER / E2E GATE'
npm run test:m99:sidebar
npm run settings-recovery:browser
printf 'M99 + hosted M43 browser/E2E gates: PASS\n'

section '7. DEDICATED CERTIFICATION'
npm run verify:m99:sidebar
node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1432-m99-sidebar-resizer-minimal-affordance-corrective.mjs
npm run verify:m99:hosted
npm run workspace-regression:check
npm run workspace-regression:test
npm run futuristic-readiness:check
npm run futuristic-readiness:test
printf 'Dedicated M99 successor certification: PASS\n'

section '8. POST-CERTIFICATION REPOSITORY / STATE VALIDATION'
manifest > "$SOURCE_MANIFEST_AFTER"
cmp -s "$SOURCE_MANIFEST_BEFORE" "$SOURCE_MANIFEST_AFTER" || {
  printf 'ERROR: repository source state changed during certification.\n' >&2
  diff -u "$SOURCE_MANIFEST_BEFORE" "$SOURCE_MANIFEST_AFTER" || true
  exit 1
}
printf 'Post-certification source-state identity: PASS\n'

section '9. HISTORICAL REGRESSION GATE'
npm run verify:historical-all
printf 'Historical regression gate: PASS\n'

section '10. CHECKSUM + PACKAGE-HYGIENE VERIFICATION'
HYGIENE_FILE="$TMP_DIR/package-hygiene.txt"
find . -type f \
  \( -name '.DS_Store' -o -name 'Thumbs.db' -o -name '*.swp' -o -name '*.tmp' \) \
  -print > "$HYGIENE_FILE"
if [ -s "$HYGIENE_FILE" ]; then
  printf 'ERROR: package-hygiene violations detected:\n' >&2
  cat "$HYGIENE_FILE" >&2
  exit 1
fi

rm -rf "$PACKAGE_ROOT"
mkdir -p "$PACKAGE_ROOT"
rsync -a ./ "$PACKAGE_ROOT/" \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude 'test-results/' \
  --exclude 'playwright-report/' \
  --exclude '.DS_Store' \
  --exclude 'Thumbs.db' \
  --exclude '*.swp' \
  --exclude '*.tmp'

mkdir -p "$OUT_DIR"
rm -f "$ZIP_PATH" "$SHA_PATH" "$PASS_PATH"
(
  cd "$PACKAGE_ROOT"
  zip -q -X -r "$ZIP_PATH" .
)
ZIP_SHA="$(shasum -a 256 "$ZIP_PATH" | awk '{print $1}')"
printf '%s  %s\n' "$ZIP_SHA" "$(basename "$ZIP_PATH")" > "$SHA_PATH"
ACTUAL_SHA="$(shasum -a 256 "$ZIP_PATH" | awk '{print $1}')"
test "$ZIP_SHA" = "$ACTUAL_SHA"
printf 'Certified ZIP SHA-256: %s\n' "$ZIP_SHA"
printf 'Package hygiene/checksum: PASS\n'

section '11. FINAL CHECKPOINT VALIDATION'
npm run verify:m99:sidebar
node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1432-m99-sidebar-resizer-minimal-affordance-corrective.mjs
npm run verify:m99:hosted
npm run typecheck
npm run lint
# `npm run lint` invokes dependencies:ensure, which may restore the exact
# application lockfile tree and remove the isolated modern test toolchain.
# Re-bootstrap the governed test-only toolchain before the final browser gate.
npm run modern-tests:check
npm run modern-tests:test
npm run test:m99:sidebar
npm run settings-recovery:browser

cat > "$PASS_PATH" <<EOF
M99 LOCAL CERTIFICATION: PASS
Repository: work-management-app@1.43.2
Checkpoint: Stage I M99 Sidebar Dropdown + Resize Containment + Minimal Resizer Affordance Corrective
Certified ZIP: $(basename "$ZIP_PATH")
SHA-256: $ZIP_SHA
State: FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE
EOF

printf '\nM99 LOCAL CERTIFICATION: PASS\n'
printf 'Certified ZIP: %s\n' "$ZIP_PATH"
printf 'Checksum:      %s\n' "$SHA_PATH"
printf 'PASS record:   %s\n' "$PASS_PATH"
