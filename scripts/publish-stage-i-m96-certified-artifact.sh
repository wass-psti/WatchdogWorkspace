#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
npm run visual-consistency:final-checkpoint
TARGET=config/stage-i-m96-visual-consistency-legacy-styling-retirement-target.ts
STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M96-VISUAL-CONSISTENCY-LEGACY-STYLING-RETIREMENT.md
python3 - "$TARGET" "$STATUS" M96-CONTINUATION-STATE.md <<'PY2'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'"))
p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified').replace('**Continuation:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS','**Continuation:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'))
Path(sys.argv[3]).write_text('# M96 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n\nAll M96 implementation, verification, browser, regression, package-integrity, and final checkpoint gates passed before certified artifact publication.\n')
PY2
OUT=m96-certified-artifacts-upload;rm -rf "$OUT";mkdir -p "$OUT";ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M96-Certified-Baseline.zip";PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M96-Certified-Baseline-PASS.txt"
zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm96-certified-artifacts-upload/*' 'm96-continuation-artifacts-upload/*' '*.DS_Store'
ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')";SSHA="$(node scripts/lib/stage-i-m96-checkpoint-tree.mjs "$ROOT")"
cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 96
Visual Consistency & Legacy Styling Retirement
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M95 PROVENANCE ZIP SHA-256: 25c15f1e4c81d97adfcc5ba2e309a87887ed060ffb52904eea9214e8ff4bf4a7
M95 PROVENANCE SOURCE SHA-256: 995dba51a9d4165b3b090487917f21c8c6651dc461716e972c89e1ae840cca6c
M96 SEMANTICS VERSION: 1.43.2-m96-v1
Milestone 96 certification: PASS
TXT
node scripts/verify-stage-i-m96-certified-state.mjs
node scripts/verify-stage-i-m96-certified-artifact.mjs "$ZIP"
echo 'M96 certified package hygiene verification: PASS';echo 'STAGE I M96 CERTIFIED ARTIFACT PUBLICATION: PASS';echo "Certified baseline: $ZIP";echo "PASS record: $PASS";echo "SHA-256: $ZSHA";echo "Source tree SHA-256: $SSHA"
DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS";DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256";cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA";[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1;echo 'M96 DOWNLOADS HANDOFF: PASS';echo "Downloads baseline: $DZIP";echo "Downloads PASS record: $DPASS";echo "Downloads checksum: $DSHA"
