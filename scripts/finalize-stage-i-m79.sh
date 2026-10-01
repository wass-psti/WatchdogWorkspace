#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M79 certification requires Node v22.16.0.' >&2; exit 1; }

TARGET="$ROOT/config/stage-i-m79-design-tokens-semantic-theme-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-I-M79-DESIGN-TOKENS-SEMANTIC-THEME-ARCHITECTURE.md"
CONTINUATION="$ROOT/M79-CONTINUATION-STATE.md"
BASE='Work-Management-App-v1.43.2-Stage-I-M79-Certified-Baseline'
OUT="$ROOT/m79-certified-artifacts-upload"

grep -q "activationState: 'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M79 target is not pending certification.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M79 release status is not pending certification.' >&2; exit 1; }
grep -q '\*\*State:\*\* IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS' "$CONTINUATION" || { echo 'FAIL: M79 continuation state is not pending local certification.' >&2; exit 1; }

npm run dependencies:certify
SOURCE_BEFORE="$(node scripts/lib/stage-i-m79-checkpoint-tree.mjs "$ROOT")"
bash scripts/verify-stage-i-m79-release.sh
SOURCE_AFTER="$(node scripts/lib/stage-i-m79-checkpoint-tree.mjs "$ROOT")"
[ "$SOURCE_BEFORE" = "$SOURCE_AFTER" ] || { echo 'FAIL: M79 source tree changed during pre-certification gates.' >&2; exit 1; }

TMP="$(mktemp -d)"
BACKUP="$(mktemp -d)"
trap 'rm -rf "$TMP" "$BACKUP"' EXIT
cp "$TARGET" "$BACKUP/target"
cp "$STATUS" "$BACKUP/status"
cp "$CONTINUATION" "$BACKUP/continuation"

rollback() {
  cp "$BACKUP/target" "$TARGET" || true
  cp "$BACKUP/status" "$STATUS" || true
  cp "$BACKUP/continuation" "$CONTINUATION" || true
  rm -rf "$OUT.next"
}
trap 'rollback; rm -rf "$TMP" "$BACKUP"' ERR

python3 - "$TARGET" "$STATUS" "$CONTINUATION" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
    p=Path(name)
    s=p.read_text()
    s=s.replace("activationState: 'implementation-complete-pending-certification'", "activationState: 'active-certified'")
    s=s.replace('**State:** implementation-complete-pending-certification', '**State:** active-certified')
    s=s.replace('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS', '**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE')
    p.write_text(s)
PY

node scripts/verify-stage-i-m79-certified-state.mjs "$ROOT"
SOURCE_PROMOTED="$(node scripts/lib/stage-i-m79-checkpoint-tree.mjs "$ROOT")"
[ "$SOURCE_PROMOTED" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M79 certified-state promotion changed normalized source identity.' >&2; exit 1; }

npm run verify:historical-all
[ "$(node scripts/lib/stage-i-m79-checkpoint-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M79 source tree changed during historical regression.' >&2; exit 1; }

STAGE="$TMP/$BASE"
mkdir -p "$STAGE"
RSYNC_EXCLUDES=(
  --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='coverage'
  --exclude='test-results' --exclude='playwright-report' --exclude='.wm-modern-test-toolchain'
)
for i in $(seq 55 79); do RSYNC_EXCLUDES+=("--exclude=m${i}-certified-artifacts-upload"); done
rsync -a "${RSYNC_EXCLUDES[@]}" "$ROOT/" "$STAGE/"

if find "$STAGE" -type l -print -quit | grep -q .; then echo 'FAIL: symbolic link in M79 certified payload.' >&2; exit 1; fi
if find "$STAGE" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then echo 'FAIL: concrete environment file in M79 certified payload.' >&2; exit 1; fi
node "$STAGE/scripts/scan-secrets.mjs"
node "$STAGE/scripts/verify-stage-i-m79-certified-state.mjs" "$STAGE"
(
  cd "$STAGE"
  node verify-stage-i-m79-design-tokens-semantic-theme.mjs
  node scripts/verify-stage-i-m79-design-tokens-semantic-theme-execution.mjs
  node scripts/verify-stage-i-m79-m78-source-guard.mjs
)
STAGED_SOURCE="$(node "$STAGE/scripts/lib/stage-i-m79-checkpoint-tree.mjs" "$STAGE")"
[ "$STAGED_SOURCE" = "$SOURCE_BEFORE" ] || { echo 'FAIL: staged M79 payload source identity mismatch.' >&2; exit 1; }

(
  cd "$STAGE"
  find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256
  sha256sum -c CHECKSUMS.sha256 >/dev/null
)
(
  cd "$TMP"
  zip -qry "$BASE.zip" "$BASE"
)
unzip -t "$TMP/$BASE.zip" >/dev/null
SHA="$(sha256sum "$TMP/$BASE.zip" | awk '{print $1}')"
AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat > "$TMP/$BASE-PASS.txt" <<PASS
Work Management App v1.43.2
Stage I — Milestone 79
Design Tokens & Semantic Theme Architecture
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $AT
CERTIFIED ZIP SHA-256: $SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE_BEFORE
M78 PROVENANCE ZIP SHA-256: 8414ed0aa4dc596af45b76ba16aae8f28d87bc1b41ddc39108c138acf5e662f2
M78 PROVENANCE SOURCE SHA-256: 437188880f12256e1bcd76924e3704e51005900af166251d513232bfcc27866a
M79 SEMANTICS VERSION: 1.43.2-m79-v1
Milestone 79 certification: PASS
PASS

node scripts/verify-stage-i-m79-certified-artifact.mjs "$TMP/$BASE.zip" "$TMP/$BASE-PASS.txt"
node scripts/verify-stage-i-m79-certified-package-hygiene.mjs "$TMP/$BASE.zip"

PUBLISH="$TMP/publish"
mkdir -p "$PUBLISH"
cp "$TMP/$BASE.zip" "$PUBLISH/"
cp "$TMP/$BASE-PASS.txt" "$PUBLISH/"
rm -rf "$OUT.next"
mv "$PUBLISH" "$OUT.next"
if [ -d "$OUT" ]; then rm -rf "$OUT.previous"; mv "$OUT" "$OUT.previous"; fi
mv "$OUT.next" "$OUT"
rm -rf "$OUT.previous"

node scripts/verify-stage-i-m79-certified-state.mjs "$ROOT"
node scripts/verify-stage-i-m79-certified-artifact.mjs
node scripts/verify-stage-i-m79-certified-package-hygiene.mjs
node scripts/verify-stage-i-m79-final-checkpoint.mjs --require-certified

trap - ERR
rm -rf "$BACKUP"

echo 'STAGE I M79 DESIGN TOKENS / SEMANTIC THEME CERTIFICATION: PASS'
echo "Certified baseline: $OUT/$BASE.zip"
echo "PASS record: $OUT/$BASE-PASS.txt"
echo "SHA-256: $SHA"
echo "Source tree SHA-256: $SOURCE_BEFORE"
