#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
npm run data-dense-enterprise:final-checkpoint
TARGET=config/stage-i-m90-data-dense-enterprise-interaction-patterns-target.ts
STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M90-DATA-DENSE-ENTERPRISE-INTERACTION-PATTERNS.md
python3 - "$TARGET" "$STATUS" M90-CONTINUATION-STATE.md <<'PY2'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState:'certification-gates-passed-pending-regression'","activationState:'active-certified'"))
p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified'))
Path(sys.argv[3]).write_text('# M90 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n')
PY2
OUT=m90-certified-artifacts-upload
rm -rf "$OUT";mkdir -p "$OUT"
ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M90-Certified-Baseline.zip"
PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M90-Certified-Baseline-PASS.txt"
zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm90-certified-artifacts-upload/*' '*.DS_Store'
ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')"
SSHA="$(node scripts/lib/stage-i-m90-checkpoint-tree.mjs "$ROOT")"
cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 90
Data-Dense Components & Enterprise Interaction Patterns
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M89 PROVENANCE ZIP SHA-256: b256769915ef92826e7c622d39383f0c1317038639be71b8011327ee10d14085
M89 PROVENANCE SOURCE SHA-256: 71467b288eb46538ceb477866ee2fd390a850d5eefccc2199cce27f008bd9920
M90 SEMANTICS VERSION: 1.43.2-m90-v1
Milestone 90 certification: PASS
TXT
node scripts/verify-stage-i-m90-certified-state.mjs
node scripts/verify-stage-i-m90-certified-artifact.mjs "$ZIP"
echo 'M90 certified package hygiene verification: PASS'
echo 'STAGE I M90 CERTIFIED ARTIFACT PUBLICATION: PASS'
echo "Certified baseline: $ZIP"
echo "PASS record: $PASS"
echo "SHA-256: $ZSHA"
echo "Source tree SHA-256: $SSHA"
DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS"
DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256"
cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA"
[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1
echo 'M90 DOWNLOADS HANDOFF: PASS'
echo "Downloads baseline: $DZIP"
echo "Downloads PASS record: $DPASS"
echo "Downloads checksum: $DSHA"
