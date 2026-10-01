#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT";TARGET="$ROOT/config/stage-i-m87-tradelink-visual-migration-target.ts";STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-I-M87-TRADELINK-VISUAL-MIGRATION.md"
grep -q "activationState:'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M87 target is not pending certification.' >&2; exit 1; };grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || exit 1
npm run dependencies:certify;SOURCE_BEFORE="$(node scripts/lib/stage-i-m87-checkpoint-tree.mjs "$ROOT")";bash scripts/verify-stage-i-m87-release.sh;[ "$(node scripts/lib/stage-i-m87-checkpoint-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || exit 1
python3 - "$TARGET" "$STATUS" <<'PY2'
from pathlib import Path
import sys
for n in sys.argv[1:]:
 p=Path(n);s=p.read_text().replace("activationState:'implementation-complete-pending-certification'","activationState:'certification-gates-passed-pending-regression'").replace('**State:** implementation-complete-pending-certification','**State:** certification-gates-passed-pending-regression');p.write_text(s)
PY2
node scripts/verify-stage-i-m87-post-certification-state.mjs
echo 'STAGE I M87 DEDICATED CERTIFICATION GATES: PASS (historical regression/package/final checkpoint remain)';echo "Normalized source tree SHA-256: $SOURCE_BEFORE"
