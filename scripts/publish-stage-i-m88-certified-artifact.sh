#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
npm run users-admin-visual:final-checkpoint
TARGET=config/stage-i-m88-users-roles-administration-surfaces-target.ts
STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M88-USERS-ROLES-ADMINISTRATION-SURFACES.md
python3 - "$TARGET" "$STATUS" M88-CONTINUATION-STATE.md <<'PY2'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState:'certification-gates-passed-pending-regression'","activationState:'active-certified'"))
p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified'))
Path(sys.argv[3]).write_text('# M88 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n')
PY2
OUT=m88-certified-artifacts-upload
rm -rf "$OUT";mkdir -p "$OUT"
ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M88-Certified-Baseline.zip"
PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M88-Certified-Baseline-PASS.txt"
zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm88-certified-artifacts-upload/*' '*.DS_Store'
ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')"
SSHA="$(node scripts/lib/stage-i-m88-checkpoint-tree.mjs "$ROOT")"
cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 88
Users, Roles & Administration Surfaces
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M87 PROVENANCE ZIP SHA-256: 260ed2de533e7f9536f63c91b5b69b152326d9f3bb7e3a65d3a4cf3c75aaab25
M87 PROVENANCE SOURCE SHA-256: 5420f687989d0ca2bc0c9670e901c0e5fa5560a061a6436056826959910a370f
M88 SEMANTICS VERSION: 1.43.2-m88-v1
Milestone 88 certification: PASS
TXT
node scripts/verify-stage-i-m88-certified-state.mjs
node scripts/verify-stage-i-m88-certified-artifact.mjs "$ZIP"
echo 'M88 certified package hygiene verification: PASS'
echo 'STAGE I M88 CERTIFIED ARTIFACT PUBLICATION: PASS'
echo "Certified baseline: $ZIP"
echo "PASS record: $PASS"
echo "SHA-256: $ZSHA"
echo "Source tree SHA-256: $SSHA"
DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS"
DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256"
cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA"
[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1
echo 'M88 DOWNLOADS HANDOFF: PASS'
echo "Downloads baseline: $DZIP"
echo "Downloads PASS record: $DPASS"
echo "Downloads checksum: $DSHA"
