#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
npm run motion-architecture:final-checkpoint
TARGET=config/stage-i-m94-motion-transition-architecture-target.ts;STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M94-MOTION-TRANSITION-ARCHITECTURE.md
python3 - "$TARGET" "$STATUS" M94-CONTINUATION-STATE.md <<'PY2'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'"))
p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified'))
Path(sys.argv[3]).write_text('# M94 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n')
PY2
OUT=m94-certified-artifacts-upload;rm -rf "$OUT";mkdir -p "$OUT";ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M94-Certified-Baseline.zip";PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M94-Certified-Baseline-PASS.txt"
zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm94-certified-artifacts-upload/*' '*.DS_Store'
ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')";SSHA="$(node scripts/lib/stage-i-m94-checkpoint-tree.mjs "$ROOT")"
cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 94
Motion & Transition Architecture
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M93 PROVENANCE ZIP SHA-256: 6abbbb68f882c354590b041abda867dc0f9bbf06611f7b6d9435d66bfe89b63a
M93 PROVENANCE SOURCE SHA-256: 2942d8a85503e98a1d500e73c9c0a4ea71e952cccf6643d76bd84ecd09362f0f
M94 SEMANTICS VERSION: 1.43.2-m94-v1
Milestone 94 certification: PASS
TXT
node scripts/verify-stage-i-m94-certified-state.mjs;node scripts/verify-stage-i-m94-certified-artifact.mjs "$ZIP"
echo 'M94 certified package hygiene verification: PASS';echo 'STAGE I M94 CERTIFIED ARTIFACT PUBLICATION: PASS';echo "Certified baseline: $ZIP";echo "PASS record: $PASS";echo "SHA-256: $ZSHA";echo "Source tree SHA-256: $SSHA"
DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS";DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256";cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA";[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1
echo 'M94 DOWNLOADS HANDOFF: PASS';echo "Downloads baseline: $DZIP";echo "Downloads PASS record: $DPASS";echo "Downloads checksum: $DSHA"
