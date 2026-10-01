#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
TARGET="$ROOT/config/stage-i-m96-visual-consistency-legacy-styling-retirement-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-I-M96-VISUAL-CONSISTENCY-LEGACY-STYLING-RETIREMENT.md"
grep -q "activationState: 'implementation-complete-local-certification-pending'" "$TARGET" || { echo 'FAIL: M96 target is not pending certification.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-local-certification-pending' "$STATUS" || { echo 'FAIL: M96 release status is not pending certification.' >&2; exit 1; }
SOURCE_BEFORE="$(node scripts/lib/stage-i-m96-checkpoint-tree.mjs "$ROOT")"
bash scripts/verify-stage-i-m96-release.sh
[ "$(node scripts/lib/stage-i-m96-checkpoint-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: source drift during M96 dedicated certification.' >&2; exit 1; }
python3 - "$TARGET" "$STATUS" <<'PY2'
from pathlib import Path
import sys
for name in sys.argv[1:]:
 p=Path(name);s=p.read_text().replace("activationState: 'implementation-complete-local-certification-pending'","activationState: 'certification-gates-passed-pending-regression'").replace('**State:** implementation-complete-local-certification-pending','**State:** certification-gates-passed-pending-regression');p.write_text(s)
PY2
node scripts/verify-stage-i-m96-post-certification-state.mjs
echo 'STAGE I M96 DEDICATED CERTIFICATION GATES: PASS (historical regression/package/final checkpoint remain)'
echo "Normalized source tree SHA-256: $SOURCE_BEFORE"
