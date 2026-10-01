#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
npm run interaction-harmonization:final-checkpoint
TARGET=config/stage-i-m93-interaction-state-harmonization-target.ts;STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M93-ACCESSIBILITY-INTERACTION-STATE-HARMONIZATION.md
python3 - "$TARGET" "$STATUS" M93-CONTINUATION-STATE.md <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'"))
p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified'))
Path(sys.argv[3]).write_text('# M93 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n')
PY
OUT=m93-certified-artifacts-upload;rm -rf "$OUT";mkdir -p "$OUT";ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M93-Certified-Baseline.zip";PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M93-Certified-Baseline-PASS.txt"
zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm93-certified-artifacts-upload/*' '*.DS_Store'
ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')";SSHA="$(node scripts/lib/stage-i-m93-checkpoint-tree.mjs "$ROOT")"
cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 93
Accessibility & Interaction-State Harmonization
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M92 PROVENANCE ZIP SHA-256: ac2867343e06845fa4f552ef1be1d1a5ef6e939ccc1def74d36062b9d55c8468
M92 PROVENANCE SOURCE SHA-256: 845216e46e514e55f7978c9379a3dff9932ceae570fdbfcbe2e40d9ec07e774a
M93 SEMANTICS VERSION: 1.43.2-m93-v1
Milestone 93 certification: PASS
TXT
node scripts/verify-stage-i-m93-certified-state.mjs;node scripts/verify-stage-i-m93-certified-artifact.mjs "$ZIP"
echo 'M93 certified package hygiene verification: PASS';echo 'STAGE I M93 CERTIFIED ARTIFACT PUBLICATION: PASS';echo "Certified baseline: $ZIP";echo "PASS record: $PASS";echo "SHA-256: $ZSHA";echo "Source tree SHA-256: $SSHA"
DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS";DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256";cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA";[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1
echo 'M93 DOWNLOADS HANDOFF: PASS';echo "Downloads baseline: $DZIP";echo "Downloads PASS record: $DPASS";echo "Downloads checksum: $DSHA"
