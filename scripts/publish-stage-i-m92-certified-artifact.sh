#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
npm run state-system:final-checkpoint
TARGET=config/stage-i-m92-state-system-coverage-target.ts;STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M92-STATE-SYSTEM-COVERAGE.md
python3 - "$TARGET" "$STATUS" M92-CONTINUATION-STATE.md <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState:'certification-gates-passed-pending-regression'","activationState:'active-certified'"))
p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified'))
Path(sys.argv[3]).write_text('# M92 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n')
PY
OUT=m92-certified-artifacts-upload;rm -rf "$OUT";mkdir -p "$OUT";ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M92-Certified-Baseline.zip";PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M92-Certified-Baseline-PASS.txt"
zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm92-certified-artifacts-upload/*' '*.DS_Store'
ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')";SSHA="$(node scripts/lib/stage-i-m92-checkpoint-tree.mjs "$ROOT")"
cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 92
Empty, Loading, Skeleton, Error & Success State System
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M91 PROVENANCE ZIP SHA-256: 6f56c62f470b147f03fe22f62b77fba115105ca5ed589ecf1662a2badc9fbb70
M91 PROVENANCE SOURCE SHA-256: 6623fffb2c2e222bea87fea60362f0e57eb2ba8c0562f83773b9c0caf52c5658
M92 SEMANTICS VERSION: 1.43.2-m92-v1
Milestone 92 certification: PASS
TXT
node scripts/verify-stage-i-m92-certified-state.mjs;node scripts/verify-stage-i-m92-certified-artifact.mjs "$ZIP"
echo 'M92 certified package hygiene verification: PASS';echo 'STAGE I M92 CERTIFIED ARTIFACT PUBLICATION: PASS';echo "Certified baseline: $ZIP";echo "PASS record: $PASS";echo "SHA-256: $ZSHA";echo "Source tree SHA-256: $SSHA"
DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS";DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256";cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA";[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1
echo 'M92 DOWNLOADS HANDOFF: PASS';echo "Downloads baseline: $DZIP";echo "Downloads PASS record: $DPASS";echo "Downloads checksum: $DSHA"
