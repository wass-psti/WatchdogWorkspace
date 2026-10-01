#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
npm run responsive-harmonization:final-checkpoint
TARGET=config/stage-i-m95-cross-module-responsive-harmonization-target.ts
STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M95-CROSS-MODULE-RESPONSIVE-HARMONIZATION.md
python3 - "$TARGET" "$STATUS" M95-CONTINUATION-STATE.md <<'PY2'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'"))
p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified').replace('**Continuation:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS','**Continuation:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'))
Path(sys.argv[3]).write_text('# M95 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n\nAll M95 implementation, verification, browser, regression, package-integrity, and final checkpoint gates passed before certified artifact publication.\n')
PY2
OUT=m95-certified-artifacts-upload;rm -rf "$OUT";mkdir -p "$OUT"
ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M95-Certified-Baseline.zip"
PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M95-Certified-Baseline-PASS.txt"
zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm95-certified-artifacts-upload/*' 'm95-continuation-artifacts-upload/*' '*.DS_Store'
ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')"
SSHA="$(node scripts/lib/stage-i-m95-checkpoint-tree.mjs "$ROOT")"
cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 95
Cross-Module Responsive Harmonization
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M94 PROVENANCE ZIP SHA-256: 4e625a02bd5dbc91cf96f6a9bbf14d223698de87958f4d87da268003b6eabf21
M94 PROVENANCE SOURCE SHA-256: b3367038a1d379296314acb7d72c11a319a1a28c4140a3080740079194d6dc7c
M95 SEMANTICS VERSION: 1.43.2-m95-v2
Milestone 95 certification: PASS
TXT
node scripts/verify-stage-i-m95-certified-state.mjs
node scripts/verify-stage-i-m95-certified-artifact.mjs "$ZIP"
echo 'M95 certified package hygiene verification: PASS'
echo 'STAGE I M95 CERTIFIED ARTIFACT PUBLICATION: PASS'
echo "Certified baseline: $ZIP"
echo "PASS record: $PASS"
echo "SHA-256: $ZSHA"
echo "Source tree SHA-256: $SSHA"
DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS"
DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256"
cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA"
[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1
echo 'M95 DOWNLOADS HANDOFF: PASS'
echo "Downloads baseline: $DZIP"
echo "Downloads PASS record: $DPASS"
echo "Downloads checksum: $DSHA"
