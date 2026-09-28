#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M73 certification requires Node v22.16.0.' >&2; exit 1; }
TARGET="$ROOT/config/stage-h-m73-boards-ui-design-system-migration-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-H-M73-BOARDS-UI-DESIGN-SYSTEM-MIGRATION.md"
CONTINUATION="$ROOT/M73-CONTINUATION-STATE.md"
grep -q "activationState: 'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M73 target is not pending certification.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M73 release status is not pending certification.' >&2; exit 1; }
grep -q '\*\*State:\*\* IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS' "$CONTINUATION" || { echo 'FAIL: M73 continuation state is not pending local certification.' >&2; exit 1; }
npm run dependencies:certify
SOURCE_BEFORE="$(node scripts/lib/stage-h-m73-certification-tree.mjs "$ROOT")"
npm run boards-ui:check
npm run boards-ui:test
npm run boards-ui:browser
npm run release:check
SOURCE_AFTER="$(node scripts/lib/stage-h-m73-certification-tree.mjs "$ROOT")"
[ "$SOURCE_BEFORE" = "$SOURCE_AFTER" ] || { echo 'FAIL: M73 source tree changed during pre-certification gates.' >&2; exit 1; }
BASE='Work-Management-App-v1.43.2-Stage-H-M73-Certified-Baseline'
OUT="$ROOT/m73-certified-artifacts-upload"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
STAGE="$TMP/$BASE"; mkdir -p "$STAGE"
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='coverage' --exclude='test-results' --exclude='playwright-report' \
  --exclude='m55-certified-artifacts-upload' --exclude='m56-certified-artifacts-upload' --exclude='m57-certified-artifacts-upload' --exclude='m58-certified-artifacts-upload' --exclude='m59-certified-artifacts-upload' --exclude='m60-certified-artifacts-upload' --exclude='m61-certified-artifacts-upload' --exclude='m62-certified-artifacts-upload' --exclude='m63-certified-artifacts-upload' --exclude='m64-certified-artifacts-upload' --exclude='m65-certified-artifacts-upload' --exclude='m66-certified-artifacts-upload' --exclude='m67-certified-artifacts-upload' --exclude='m68-certified-artifacts-upload' --exclude='m69-certified-artifacts-upload' --exclude='m70-certified-artifacts-upload' --exclude='m71-certified-artifacts-upload' --exclude='m72-certified-artifacts-upload' --exclude='m73-certified-artifacts-upload' "$ROOT/" "$STAGE/"
python3 - "$STAGE/config/stage-h-m73-boards-ui-design-system-migration-target.ts" "$STAGE/RELEASE-STATUS-v1.43.2-STAGE-H-M73-BOARDS-UI-DESIGN-SYSTEM-MIGRATION.md" "$STAGE/M73-CONTINUATION-STATE.md" <<'PY2'
from pathlib import Path
import sys
for name in sys.argv[1:]:
    p=Path(name); s=p.read_text(); s=s.replace("activationState: 'implementation-complete-pending-certification'","activationState: 'active-certified'"); s=s.replace('**State:** implementation-complete-pending-certification','**State:** active-certified'); s=s.replace('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS','**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'); p.write_text(s)
PY2
STAGED_SOURCE="$(node "$STAGE/scripts/lib/stage-h-m73-certification-tree.mjs" "$STAGE")"
[ "$STAGED_SOURCE" = "$SOURCE_BEFORE" ] || { echo 'FAIL: staged active-certified M73 payload does not match verified source tree.' >&2; exit 1; }
node "$STAGE/scripts/verify-stage-h-m73-certified-state.mjs" "$STAGE"
npm run verify:historical-all
[ "$(node scripts/lib/stage-h-m73-certification-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M73 source tree changed during historical regression verification.' >&2; exit 1; }
if find "$STAGE" -type l -print -quit | grep -q .; then echo 'FAIL: symbolic link in M73 certified payload.' >&2; exit 1; fi
if find "$STAGE" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then echo 'FAIL: concrete environment file in M73 certified payload.' >&2; exit 1; fi
node "$STAGE/scripts/scan-secrets.mjs"
( cd "$STAGE"; find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256; sha256sum -c CHECKSUMS.sha256 >/dev/null )
( cd "$TMP"; zip -qry "$BASE.zip" "$BASE" )
unzip -t "$TMP/$BASE.zip" >/dev/null
SHA="$(sha256sum "$TMP/$BASE.zip" | awk '{print $1}')"; AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat > "$TMP/$BASE-PASS.txt" <<PASS
Work Management App v1.43.2
Stage H — Milestone 73
Boards UI Design-System Migration
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $AT
CERTIFIED ZIP SHA-256: $SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE_BEFORE
M73 SEMANTICS VERSION: 1.43.2-m73-v1
Milestone 73 certification: PASS
PASS
node scripts/verify-stage-h-m73-certified-artifact.mjs "$TMP/$BASE.zip" "$TMP/$BASE-PASS.txt"
node scripts/verify-stage-h-m73-certified-package-hygiene.mjs "$TMP/$BASE.zip"
PUBLISH="$TMP/publish"; mkdir -p "$PUBLISH"; cp "$TMP/$BASE.zip" "$PUBLISH/"; cp "$TMP/$BASE-PASS.txt" "$PUBLISH/"; rm -rf "$OUT.next"; mv "$PUBLISH" "$OUT.next"; if [ -d "$OUT" ]; then rm -rf "$OUT.previous"; mv "$OUT" "$OUT.previous"; fi; mv "$OUT.next" "$OUT"; rm -rf "$OUT.previous"
node scripts/verify-stage-h-m73-final-checkpoint.mjs
echo 'STAGE H M73 BOARDS UI DESIGN SYSTEM MIGRATION CERTIFICATION: PASS'
echo "Certified baseline: $OUT/$BASE.zip"; echo "PASS record: $OUT/$BASE-PASS.txt"; echo "SHA-256: $SHA"; echo "Source tree SHA-256: $SOURCE_BEFORE"
