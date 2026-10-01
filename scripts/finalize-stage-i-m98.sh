#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
TARGET=config/stage-i-m98-futuristic-minimalist-production-readiness-certification-target.ts
STATUS=RELEASE-STATUS-v1.43.2-STAGE-I-M98-FUTURISTIC-MINIMALIST-PRODUCTION-READINESS-CERTIFICATION.md
grep -q "activationState: 'implementation-complete-local-certification-pending'" "$TARGET" || { echo 'FAIL: M98 target is not pending certification.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-local-certification-pending' "$STATUS" || { echo 'FAIL: M98 release status is not pending certification.' >&2; exit 1; }
SOURCE_BEFORE="$(node scripts/lib/stage-i-m98-checkpoint-tree.mjs "$ROOT")"
bash scripts/verify-stage-i-m98-release.sh
[ "$(node scripts/lib/stage-i-m98-checkpoint-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: source drift during M98 dedicated certification.' >&2; exit 1; }
python3 - "$TARGET" "$STATUS" <<'PY2'
from pathlib import Path
import sys
for name in sys.argv[1:]:
    p=Path(name)
    p.write_text(p.read_text().replace("activationState: 'implementation-complete-local-certification-pending'","activationState: 'certification-gates-passed-pending-regression'").replace('**State:** implementation-complete-local-certification-pending','**State:** certification-gates-passed-pending-regression'))
PY2
node scripts/verify-stage-i-m98-post-certification-state.mjs
echo 'STAGE I M98 DEDICATED CERTIFICATION GATES: PASS (historical regression/package/final checkpoint remain)'
echo "Normalized source tree SHA-256: $SOURCE_BEFORE"
