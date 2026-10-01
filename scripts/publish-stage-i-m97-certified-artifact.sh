#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT";npm run workspace-regression:final-checkpoint;TARGET=config/stage-i-m97-workspace-wide-visual-regression-functional-preservation-target.ts;STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M97-WORKSPACE-WIDE-VISUAL-REGRESSION-FUNCTIONAL-PRESERVATION.md
python3 - "$TARGET" "$STATUS" M97-CONTINUATION-STATE.md <<'PY2'
from pathlib import Path
import sys
p=Path(sys.argv[1]);p.write_text(p.read_text().replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'"));p=Path(sys.argv[2]);p.write_text(p.read_text().replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified').replace('**Continuation:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS','**Continuation:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'));Path(sys.argv[3]).write_text('# M97 Continuation State\n\n**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE\n\nAll M97 source-preservation, cross-browser visual, screenshot evidence, functional preservation, historical regression, artifact-integrity, and final checkpoint gates passed before certified publication.\n')
PY2
# Rebuild the in-repository checksum manifest after certification-state mutation and
# after browser evidence generation so the published archive is internally self-verifying.
find . -type f \
  ! -path './.git/*' \
  ! -path './node_modules/*' \
  ! -path './dist/*' \
  ! -path './coverage/*' \
  ! -path './test-results/*' \
  ! -path './playwright-report/*' \
  ! -path './.wm-modern-test-toolchain/*' \
  ! -path './m97-certified-artifacts-upload/*' \
  ! -path './m97-continuation-artifacts-upload/*' \
  ! -name 'CHECKSUMS.sha256' \
  -print0 | sort -z | xargs -0 shasum -a 256 > CHECKSUMS.sha256
shasum -a 256 -c CHECKSUMS.sha256 >/dev/null
OUT=m97-certified-artifacts-upload;rm -rf "$OUT";mkdir -p "$OUT";ZIP="$OUT/Work-Management-App-v1.43.2-Stage-I-M97-Certified-Baseline.zip";PASS="$OUT/Work-Management-App-v1.43.2-Stage-I-M97-Certified-Baseline-PASS.txt";zip -qr "$ZIP" . -x 'node_modules/*' 'dist/*' 'coverage/*' 'test-results/*' 'playwright-report/*' '.git/*' 'm97-certified-artifacts-upload/*' 'm97-continuation-artifacts-upload/*' '*.DS_Store';ZSHA="$(shasum -a 256 "$ZIP"|awk '{print $1}')";SSHA="$(node scripts/lib/stage-i-m97-checkpoint-tree.mjs "$ROOT")";cat > "$PASS" <<TXT
Work Management App v1.43.2
Stage I — Milestone 97
Workspace-Wide Visual Regression & Functional Preservation
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED ZIP SHA-256: $ZSHA
CERTIFIED SOURCE TREE SHA-256: $SSHA
M96 PROVENANCE ZIP SHA-256: 300d769769b27353cd08cf9e83ce2e96ab39ccb50c5e4940e0fb79ddee4701d2
M96 PROVENANCE SOURCE SHA-256: 26d0d6e9950fbe71d45d1df244ad56975b4f3092354212fd66af70b7bc82062a
M97 SEMANTICS VERSION: 1.43.2-m97-v1
SCREENSHOT EVIDENCE: 84 PNGs across Chromium/Firefox/WebKit × mobile/tablet/laptop/desktop × 7 workspace surfaces
Milestone 97 certification: PASS
TXT
node scripts/verify-stage-i-m97-certified-state.mjs;node scripts/verify-stage-i-m97-certified-artifact.mjs "$ZIP";echo 'M97 certified package hygiene verification: PASS';echo 'STAGE I M97 CERTIFIED ARTIFACT PUBLICATION: PASS';echo "Certified baseline: $ZIP";echo "PASS record: $PASS";echo "SHA-256: $ZSHA";echo "Source tree SHA-256: $SSHA";DOWNLOADS="${HOME}/Downloads";mkdir -p "$DOWNLOADS";DZIP="$DOWNLOADS/$(basename "$ZIP")";DPASS="$DOWNLOADS/$(basename "$PASS")";DSHA="$DZIP.sha256";cp -f "$ZIP" "$DZIP";cp -f "$PASS" "$DPASS";shasum -a 256 "$DZIP" > "$DSHA";[ "$(shasum -a 256 "$DZIP"|awk '{print $1}')" = "$ZSHA" ] || exit 1;echo 'M97 DOWNLOADS HANDOFF: PASS';echo "Downloads baseline: $DZIP";echo "Downloads PASS record: $DPASS";echo "Downloads checksum: $DSHA"
