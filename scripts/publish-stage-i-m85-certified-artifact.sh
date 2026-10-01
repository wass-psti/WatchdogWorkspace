#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
TARGET="$ROOT/config/stage-i-m85-time-tracker-visual-migration-target.ts"; STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-I-M85-TIMETRACKER-VISUAL-MIGRATION.md"; CONT="$ROOT/M85-CONTINUATION-STATE.md"
BASE='Work-Management-App-v1.43.2-Stage-I-M85-Certified-Baseline'; OUT="$ROOT/m85-certified-artifacts-upload"
npm run time-tracker-visual:final-checkpoint
SOURCE="$(node scripts/lib/stage-i-m85-checkpoint-tree.mjs "$ROOT")"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT; STAGE="$TMP/$BASE"; mkdir -p "$STAGE"
EX=(--exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='coverage' --exclude='test-results' --exclude='playwright-report' --exclude='.wm-modern-test-toolchain'); for i in $(seq 55 85); do EX+=("--exclude=m${i}-certified-artifacts-upload"); done
rsync -a "${EX[@]}" "$ROOT/" "$STAGE/"
python3 - "$STAGE/config/stage-i-m85-time-tracker-visual-migration-target.ts" "$STAGE/RELEASE-STATUS-v1.43.2-STAGE-I-M85-TIMETRACKER-VISUAL-MIGRATION.md" "$STAGE/M85-CONTINUATION-STATE.md" <<'PY2'
from pathlib import Path
import sys
for name in sys.argv[1:]:
 p=Path(name);s=p.read_text().replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'").replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified').replace('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS','**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE');p.write_text(s)
PY2
if find "$STAGE" -type l -print -quit | grep -q .; then echo 'FAIL: symlink in M85 certified payload.' >&2; exit 1; fi
node "$STAGE/scripts/scan-secrets.mjs"
(cd "$STAGE" && node scripts/verify-stage-i-m85-certified-state.mjs "$STAGE" && node verify-stage-i-m85-time-tracker-visual-migration.mjs && node scripts/verify-stage-i-m85-time-tracker-visual-migration-execution.mjs && node scripts/verify-stage-i-m85-m84-source-guard.mjs)
[ "$(node "$STAGE/scripts/lib/stage-i-m85-checkpoint-tree.mjs" "$STAGE")" = "$SOURCE" ] || { echo 'FAIL: staged M85 identity mismatch.' >&2; exit 1; }
(cd "$STAGE" && find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256 && sha256sum -c CHECKSUMS.sha256 >/dev/null)
(cd "$TMP" && zip -qry "$BASE.zip" "$BASE"); unzip -t "$TMP/$BASE.zip" >/dev/null; SHA="$(shasum -a 256 "$TMP/$BASE.zip"|awk '{print $1}')"; AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat > "$TMP/$BASE-PASS.txt" <<PASS
Work Management App v1.43.2
Stage I — Milestone 85
TimeTracker Visual Migration
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $AT
CERTIFIED ZIP SHA-256: $SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE
M84 PROVENANCE ZIP SHA-256: f43db59178707306ab14f05c5a30894acf5338d7b52879ca291b37615372ee46
M84 PROVENANCE SOURCE SHA-256: 5612e7b2835316a47966e818bf26f411b3d9a9238770271b26e21105f334288c
M85 SEMANTICS VERSION: 1.43.2-m85-v1
Milestone 85 certification: PASS
PASS
node scripts/verify-stage-i-m85-certified-artifact.mjs "$TMP/$BASE.zip" "$TMP/$BASE-PASS.txt"; node scripts/verify-stage-i-m85-certified-package-hygiene.mjs "$TMP/$BASE.zip"
python3 - "$TARGET" "$STATUS" "$CONT" <<'PY2'
from pathlib import Path
import sys
for name in sys.argv[1:]:
 p=Path(name);s=p.read_text().replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'").replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified').replace('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS','**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE');p.write_text(s)
PY2
node scripts/verify-stage-i-m85-certified-state.mjs "$ROOT"; [ "$(node scripts/lib/stage-i-m85-checkpoint-tree.mjs "$ROOT")" = "$SOURCE" ] || { echo 'FAIL: root M85 promotion changed normalized source identity.' >&2; exit 1; }
rm -rf "$OUT"; mkdir -p "$OUT"; cp "$TMP/$BASE.zip" "$OUT/"; cp "$TMP/$BASE-PASS.txt" "$OUT/"; node scripts/verify-stage-i-m85-certified-artifact.mjs; node scripts/verify-stage-i-m85-certified-package-hygiene.mjs
echo 'STAGE I M85 CERTIFIED ARTIFACT PUBLICATION: PASS'; echo "Certified baseline: $OUT/$BASE.zip"; echo "PASS record: $OUT/$BASE-PASS.txt"; echo "SHA-256: $SHA"; echo "Source tree SHA-256: $SOURCE"
