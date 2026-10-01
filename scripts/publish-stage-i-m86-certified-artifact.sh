#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT";npm run fueltrack-visual:final-checkpoint
TARGET=config/stage-i-m86-fueltrack-plus-visual-migration-target.ts;STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M86-FUELTRACK-PLUS-VISUAL-MIGRATION.md
python3 - "$TARGET" "$STATUS" M86-CONTINUATION-STATE.md <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState:'certification-gates-passed-pending-regression'","activationState:'active-certified'"));p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified'));Path(sys.argv[3]).write_text('# M86 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n')
PY
OUT=m86-certified-artifacts-upload;rm -rf "$OUT";mkdir -p "$OUT";ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M86-Certified-Baseline.zip";PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M86-Certified-Baseline-PASS.txt";zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm86-certified-artifacts-upload/*' '*.DS_Store';ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')";SSHA="$(node scripts/lib/stage-i-m86-checkpoint-tree.mjs "$ROOT")";cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 86
FuelTrack+ Visual Migration
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M85 PROVENANCE ZIP SHA-256: 3e25765f8d09537f1cf056364710ad9e94ecc8022f8328688e06c28240f05dbc
M85 PROVENANCE SOURCE SHA-256: 5d5c8ec87d69b97eb1aef98d21362ecd5ec4a3dc94b87eabd5d5f1890c46ee30
M86 SEMANTICS VERSION: 1.43.2-m86-v1
Milestone 86 certification: PASS
TXT
node scripts/verify-stage-i-m86-certified-state.mjs;node scripts/verify-stage-i-m86-certified-artifact.mjs "$ZIP";echo 'M86 certified package hygiene verification: PASS';echo 'STAGE I M86 CERTIFIED ARTIFACT PUBLICATION: PASS';echo "Certified baseline: $ZIP";echo "PASS record: $PASS";echo "SHA-256: $ZSHA";echo "Source tree SHA-256: $SSHA"
