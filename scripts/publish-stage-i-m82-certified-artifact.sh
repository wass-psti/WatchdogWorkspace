#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
TARGET="$ROOT/config/stage-i-m82-layout-surface-responsive-composition-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-I-M82-LAYOUT-SURFACE-RESPONSIVE-COMPOSITION.md"
CONT="$ROOT/M82-CONTINUATION-STATE.md"
BASE='Work-Management-App-v1.43.2-Stage-I-M82-Certified-Baseline'
OUT="$ROOT/m82-certified-artifacts-upload"
npm run layout-composition:final-checkpoint
node scripts/verify-stage-i-m82-post-certification-state.mjs "$ROOT"
SOURCE="$(node scripts/lib/stage-i-m82-checkpoint-tree.mjs "$ROOT")"
npm run verify:historical-all
[ "$(node scripts/lib/stage-i-m82-checkpoint-tree.mjs "$ROOT")" = "$SOURCE" ] || { echo 'FAIL: M82 source drift during historical regression.' >&2; exit 1; }
TMP="$(mktemp -d)"; BACKUP="$(mktemp -d)"; trap 'rm -rf "$TMP" "$BACKUP"' EXIT
cp "$TARGET" "$BACKUP/target"; cp "$STATUS" "$BACKUP/status"; cp "$CONT" "$BACKUP/cont"
rollback(){ cp "$BACKUP/target" "$TARGET" || true; cp "$BACKUP/status" "$STATUS" || true; cp "$BACKUP/cont" "$CONT" || true; rm -rf "$OUT.next"; }
trap 'rollback; rm -rf "$TMP" "$BACKUP"' ERR
STAGE="$TMP/$BASE"; mkdir -p "$STAGE"
EX=(--exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='coverage' --exclude='test-results' --exclude='playwright-report' --exclude='.wm-modern-test-toolchain')
for i in $(seq 55 82); do EX+=("--exclude=m${i}-certified-artifacts-upload"); done
rsync -a "${EX[@]}" "$ROOT/" "$STAGE/"
python3 - "$STAGE/config/stage-i-m82-layout-surface-responsive-composition-target.ts" "$STAGE/RELEASE-STATUS-v1.43.2-STAGE-I-M82-LAYOUT-SURFACE-RESPONSIVE-COMPOSITION.md" "$STAGE/M82-CONTINUATION-STATE.md" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
 p=Path(name);s=p.read_text();s=s.replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'").replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified').replace('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS','**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE');p.write_text(s)
PY
if find "$STAGE" -type l -print -quit | grep -q .; then echo 'FAIL: symlink in M82 certified payload.' >&2; exit 1; fi
if find "$STAGE" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then echo 'FAIL: concrete environment file in M82 payload.' >&2; exit 1; fi
node "$STAGE/scripts/scan-secrets.mjs"
(
 cd "$STAGE"
 node scripts/verify-stage-i-m82-certified-state.mjs "$STAGE"
 node verify-stage-i-m82-layout-surface-responsive-composition.mjs
 node scripts/verify-stage-i-m82-layout-surface-responsive-composition-execution.mjs
 node scripts/verify-stage-i-m82-m81-source-guard.mjs
)
[ "$(node "$STAGE/scripts/lib/stage-i-m82-checkpoint-tree.mjs" "$STAGE")" = "$SOURCE" ] || { echo 'FAIL: staged M82 identity mismatch.' >&2; exit 1; }
(
 cd "$STAGE"
 find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256
 sha256sum -c CHECKSUMS.sha256 >/dev/null
)
(cd "$TMP" && zip -qry "$BASE.zip" "$BASE")
unzip -t "$TMP/$BASE.zip" >/dev/null
SHA="$(sha256sum "$TMP/$BASE.zip"|awk '{print $1}')"
AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat > "$TMP/$BASE-PASS.txt" <<PASS
Work Management App v1.43.2
Stage I — Milestone 82
Layout, Surface & Responsive Composition System
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $AT
CERTIFIED ZIP SHA-256: $SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE
M81 PROVENANCE ZIP SHA-256: 3002a9f0c3c0317bb985a157c76bfa3f42674f4e1023d27faeb5ee92fb26c2cb
M81 PROVENANCE SOURCE SHA-256: 6e592a683159119860a7b131d06652e9608d8938b4be6067c6a34d23a5bf6f49
M82 SEMANTICS VERSION: 1.43.2-m82-v1
Milestone 82 certification: PASS
PASS
node scripts/verify-stage-i-m82-certified-artifact.mjs "$TMP/$BASE.zip" "$TMP/$BASE-PASS.txt"
node scripts/verify-stage-i-m82-certified-package-hygiene.mjs "$TMP/$BASE.zip"
python3 - "$TARGET" "$STATUS" "$CONT" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
 p=Path(name);s=p.read_text();s=s.replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'").replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified').replace('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS','**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE');p.write_text(s)
PY
node scripts/verify-stage-i-m82-certified-state.mjs "$ROOT"
[ "$(node scripts/lib/stage-i-m82-checkpoint-tree.mjs "$ROOT")" = "$SOURCE" ] || { echo 'FAIL: M82 root promotion changed normalized source identity.' >&2; exit 1; }
mkdir -p "$TMP/publish"; cp "$TMP/$BASE.zip" "$TMP/publish/"; cp "$TMP/$BASE-PASS.txt" "$TMP/publish/"
rm -rf "$OUT.next"; mv "$TMP/publish" "$OUT.next"; rm -rf "$OUT"; mv "$OUT.next" "$OUT"
node scripts/verify-stage-i-m82-certified-artifact.mjs
node scripts/verify-stage-i-m82-certified-package-hygiene.mjs
trap - ERR; rm -rf "$BACKUP"
echo 'STAGE I M82 CERTIFIED ARTIFACT PUBLICATION: PASS'
echo "Certified baseline: $OUT/$BASE.zip"
echo "PASS record: $OUT/$BASE-PASS.txt"
echo "SHA-256: $SHA"
echo "Source tree SHA-256: $SOURCE"
