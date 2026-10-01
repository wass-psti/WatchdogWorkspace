#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M78 certification requires Node v22.16.0.' >&2; exit 1; }

TARGET="$ROOT/config/stage-i-m78-futuristic-minimalist-foundation-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-I-M78-VISUAL-SYSTEM-FOUNDATION-BASELINE-GUARD.md"
CONTINUATION="$ROOT/M78-CONTINUATION-STATE.md"
BASE='Work-Management-App-v1.43.2-Stage-I-M78-Certified-Baseline'
OUT="$ROOT/m78-certified-artifacts-upload"

grep -q "activationState: 'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M78 target is not pending certification.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M78 release status is not pending certification.' >&2; exit 1; }
grep -q '\*\*State:\*\* IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS' "$CONTINUATION" || { echo 'FAIL: M78 continuation state is not pending local certification.' >&2; exit 1; }

npm run dependencies:certify
SOURCE_BEFORE="$(node scripts/lib/stage-i-m78-checkpoint-tree.mjs "$ROOT")"
bash scripts/verify-stage-i-m78-release.sh
SOURCE_AFTER="$(node scripts/lib/stage-i-m78-checkpoint-tree.mjs "$ROOT")"
[ "$SOURCE_BEFORE" = "$SOURCE_AFTER" ] || { echo 'FAIL: M78 source tree changed during pre-certification gates.' >&2; exit 1; }

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

node scripts/verify-stage-i-m78-certified-state.mjs "$ROOT"
SOURCE_PROMOTED="$(node scripts/lib/stage-i-m78-checkpoint-tree.mjs "$ROOT")"
[ "$SOURCE_PROMOTED" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M78 certified-state promotion changed normalized source identity.' >&2; exit 1; }

npm run verify:historical-all
[ "$(node scripts/lib/stage-i-m78-checkpoint-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M78 source tree changed during historical regression.' >&2; exit 1; }

STAGE="$TMP/$BASE"
mkdir -p "$STAGE"
rsync -a \
  --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='coverage' \
  --exclude='test-results' --exclude='playwright-report' --exclude='.wm-modern-test-toolchain' \
  --exclude='m55-certified-artifacts-upload' --exclude='m56-certified-artifacts-upload' \
  --exclude='m57-certified-artifacts-upload' --exclude='m58-certified-artifacts-upload' \
  --exclude='m59-certified-artifacts-upload' --exclude='m60-certified-artifacts-upload' \
  --exclude='m61-certified-artifacts-upload' --exclude='m62-certified-artifacts-upload' \
  --exclude='m63-certified-artifacts-upload' --exclude='m64-certified-artifacts-upload' \
  --exclude='m65-certified-artifacts-upload' --exclude='m66-certified-artifacts-upload' \
  --exclude='m67-certified-artifacts-upload' --exclude='m68-certified-artifacts-upload' \
  --exclude='m69-certified-artifacts-upload' --exclude='m70-certified-artifacts-upload' \
  --exclude='m71-certified-artifacts-upload' --exclude='m72-certified-artifacts-upload' \
  --exclude='m73-certified-artifacts-upload' --exclude='m74-certified-artifacts-upload' \
  --exclude='m75-certified-artifacts-upload' --exclude='m76-certified-artifacts-upload' \
  --exclude='m77-certified-artifacts-upload' --exclude='m78-certified-artifacts-upload' \
  "$ROOT/" "$STAGE/"

if find "$STAGE" -type l -print -quit | grep -q .; then echo 'FAIL: symbolic link in M78 certified payload.' >&2; exit 1; fi
if find "$STAGE" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then echo 'FAIL: concrete environment file in M78 certified payload.' >&2; exit 1; fi
node "$STAGE/scripts/scan-secrets.mjs"
node "$STAGE/scripts/verify-stage-i-m78-certified-state.mjs" "$STAGE"
node "$STAGE/scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs"
STAGED_SOURCE="$(node "$STAGE/scripts/lib/stage-i-m78-checkpoint-tree.mjs" "$STAGE")"
[ "$STAGED_SOURCE" = "$SOURCE_BEFORE" ] || { echo 'FAIL: staged M78 payload source identity mismatch.' >&2; exit 1; }

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
Stage I — Milestone 78
Visual-System Foundation & Repository Baseline Guard
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $AT
CERTIFIED ZIP SHA-256: $SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE_BEFORE
M77 PROVENANCE SOURCE SHA-256: 4a07b2a7dbc876159858b208bd366e38115030702434fcde501f35c2bd6cd5b9
M78 SEMANTICS VERSION: 1.43.2-m78-v1
Milestone 78 certification: PASS
PASS

node scripts/verify-stage-i-m78-certified-artifact.mjs "$TMP/$BASE.zip" "$TMP/$BASE-PASS.txt"
node scripts/verify-stage-i-m78-certified-package-hygiene.mjs "$TMP/$BASE.zip"

PUBLISH="$TMP/publish"
mkdir -p "$PUBLISH"
cp "$TMP/$BASE.zip" "$PUBLISH/"
cp "$TMP/$BASE-PASS.txt" "$PUBLISH/"
rm -rf "$OUT.next"
mv "$PUBLISH" "$OUT.next"
if [ -d "$OUT" ]; then rm -rf "$OUT.previous"; mv "$OUT" "$OUT.previous"; fi
mv "$OUT.next" "$OUT"
rm -rf "$OUT.previous"

node scripts/verify-stage-i-m78-certified-state.mjs "$ROOT"
node scripts/verify-stage-i-m78-certified-artifact.mjs
node scripts/verify-stage-i-m78-certified-package-hygiene.mjs
node scripts/verify-stage-i-m78-final-checkpoint.mjs --require-certified

trap - ERR
rm -rf "$BACKUP"

echo 'STAGE I M78 VISUAL-SYSTEM FOUNDATION CERTIFICATION: PASS'
echo "Certified baseline: $OUT/$BASE.zip"
echo "PASS record: $OUT/$BASE-PASS.txt"
echo "SHA-256: $SHA"
echo "Source tree SHA-256: $SOURCE_BEFORE"
