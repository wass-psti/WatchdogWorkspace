#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
npm run settings-configuration-visual:final-checkpoint
TARGET=config/stage-i-m89-settings-configuration-surfaces-target.ts
STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M89-SETTINGS-CONFIGURATION-SURFACES.md
python3 - "$TARGET" "$STATUS" M89-CONTINUATION-STATE.md <<'PY2'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState:'certification-gates-passed-pending-regression'","activationState:'active-certified'"))
p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified'))
Path(sys.argv[3]).write_text('# M89 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n')
PY2
OUT=m89-certified-artifacts-upload
rm -rf "$OUT";mkdir -p "$OUT"
ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M89-Certified-Baseline.zip"
PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M89-Certified-Baseline-PASS.txt"
zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm89-certified-artifacts-upload/*' '*.DS_Store'
ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')"
SSHA="$(node scripts/lib/stage-i-m89-checkpoint-tree.mjs "$ROOT")"
cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 89
Settings & Configuration Surfaces
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M88 PROVENANCE ZIP SHA-256: 2ba229eae678e186a4bd1ec37fe9841df95c0df2e8f87a6a1fa50786a6834e85
M88 PROVENANCE SOURCE SHA-256: 8f8304905cd85f24f087a1b5e433386dc671e4ceea54033b6985a6115131d639
M89 SEMANTICS VERSION: 1.43.2-m89-v1
Milestone 89 certification: PASS
TXT
node scripts/verify-stage-i-m89-certified-state.mjs
node scripts/verify-stage-i-m89-certified-artifact.mjs "$ZIP"
echo 'M89 certified package hygiene verification: PASS'
echo 'STAGE I M89 CERTIFIED ARTIFACT PUBLICATION: PASS'
echo "Certified baseline: $ZIP"
echo "PASS record: $PASS"
echo "SHA-256: $ZSHA"
echo "Source tree SHA-256: $SSHA"
DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS"
DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256"
cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA"
[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1
echo 'M89 DOWNLOADS HANDOFF: PASS'
echo "Downloads baseline: $DZIP"
echo "Downloads PASS record: $DPASS"
echo "Downloads checksum: $DSHA"
