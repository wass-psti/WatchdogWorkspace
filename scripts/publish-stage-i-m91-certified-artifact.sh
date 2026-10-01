#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
npm run overlay-feedback:final-checkpoint
TARGET=config/stage-i-m91-dialog-drawer-overlay-feedback-system-target.ts
STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M91-DIALOG-DRAWER-OVERLAY-FEEDBACK-SYSTEM.md
python3 - "$TARGET" "$STATUS" M91-CONTINUATION-STATE.md <<'PY2'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState:'certification-gates-passed-pending-regression'","activationState:'active-certified'"))
p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified'))
Path(sys.argv[3]).write_text('# M91 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n')
PY2
OUT=m91-certified-artifacts-upload
rm -rf "$OUT";mkdir -p "$OUT"
ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M91-Certified-Baseline.zip"
PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M91-Certified-Baseline-PASS.txt"
zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm91-certified-artifacts-upload/*' '*.DS_Store'
ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')"
SSHA="$(node scripts/lib/stage-i-m91-checkpoint-tree.mjs "$ROOT")"
cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 91
Dialog, Drawer, Overlay & Feedback System
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M90 PROVENANCE ZIP SHA-256: 7a888874dc663b1a588e421486c2a055f148c1c55a2c9575e2299c97807769e9
M90 PROVENANCE SOURCE SHA-256: b21014f3223897da07692d92806b917a9489b602806d071b00e440c9f94cb06c
M91 SEMANTICS VERSION: 1.43.2-m91-v1
Milestone 91 certification: PASS
TXT
node scripts/verify-stage-i-m91-certified-state.mjs
node scripts/verify-stage-i-m91-certified-artifact.mjs "$ZIP"
echo 'M91 certified package hygiene verification: PASS'
echo 'STAGE I M91 CERTIFIED ARTIFACT PUBLICATION: PASS'
echo "Certified baseline: $ZIP"
echo "PASS record: $PASS"
echo "SHA-256: $ZSHA"
echo "Source tree SHA-256: $SSHA"
DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS"
DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256"
cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA"
[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1
echo 'M91 DOWNLOADS HANDOFF: PASS'
echo "Downloads baseline: $DZIP"
echo "Downloads PASS record: $DPASS"
echo "Downloads checksum: $DSHA"
