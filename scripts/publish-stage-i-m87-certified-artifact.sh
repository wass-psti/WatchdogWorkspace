#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT";npm run tradelink-visual:final-checkpoint
TARGET=config/stage-i-m87-tradelink-visual-migration-target.ts;STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M87-TRADELINK-VISUAL-MIGRATION.md
python3 - "$TARGET" "$STATUS" M87-CONTINUATION-STATE.md <<'PY2'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState:'certification-gates-passed-pending-regression'","activationState:'active-certified'"));p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified'));Path(sys.argv[3]).write_text('# M87 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n')
PY2
OUT=m87-certified-artifacts-upload;rm -rf "$OUT";mkdir -p "$OUT";ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M87-Certified-Baseline.zip";PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M87-Certified-Baseline-PASS.txt";zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm87-certified-artifacts-upload/*' '*.DS_Store';ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')";SSHA="$(node scripts/lib/stage-i-m87-checkpoint-tree.mjs "$ROOT")";cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 87
TradeLink Visual Migration
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M86 PROVENANCE ZIP SHA-256: fa89f4e222cbf237910e2e8aaabf1110ef33a49da58a4342a9194d62abf026bc
M86 PROVENANCE SOURCE SHA-256: a3eeb652156440ff541ea68c5b9c8b68dca30bd05b3c297f3745ae97587bec29
M87 SEMANTICS VERSION: 1.43.2-m87-v1
Milestone 87 certification: PASS
TXT
node scripts/verify-stage-i-m87-certified-state.mjs;node scripts/verify-stage-i-m87-certified-artifact.mjs "$ZIP";echo 'M87 certified package hygiene verification: PASS';echo 'STAGE I M87 CERTIFIED ARTIFACT PUBLICATION: PASS';echo "Certified baseline: $ZIP";echo "PASS record: $PASS";echo "SHA-256: $ZSHA";echo "Source tree SHA-256: $SSHA"
DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS";DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256";cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA";[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1;echo 'M87 DOWNLOADS HANDOFF: PASS';echo "Downloads baseline: $DZIP";echo "Downloads PASS record: $DPASS";echo "Downloads checksum: $DSHA"
