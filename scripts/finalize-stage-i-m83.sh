#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M83 certification requires Node v22.16.0.' >&2; exit 1; }
TARGET="$ROOT/config/stage-i-m83-authentication-account-surfaces-target.ts"; STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-I-M83-AUTHENTICATION-ACCOUNT-SURFACES.md"; CONT="$ROOT/M83-CONTINUATION-STATE.md"
grep -q "activationState: 'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M83 target is not pending certification.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M83 release status is not pending certification.' >&2; exit 1; }
npm run dependencies:certify
SOURCE_BEFORE="$(node scripts/lib/stage-i-m83-checkpoint-tree.mjs "$ROOT")"
bash scripts/verify-stage-i-m83-release.sh
[ "$(node scripts/lib/stage-i-m83-checkpoint-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M83 source changed during dedicated certification.' >&2; exit 1; }
python3 - "$TARGET" "$STATUS" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
 p=Path(name);s=p.read_text();s=s.replace("activationState: 'implementation-complete-pending-certification'","activationState: 'certification-gates-passed-pending-regression'").replace('**State:** implementation-complete-pending-certification','**State:** certification-gates-passed-pending-regression');p.write_text(s)
PY
node scripts/verify-stage-i-m83-post-certification-state.mjs "$ROOT"
[ "$(node scripts/lib/stage-i-m83-checkpoint-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M83 intermediate promotion changed normalized source identity.' >&2; exit 1; }
echo 'STAGE I M83 DEDICATED CERTIFICATION GATES: PASS (historical regression/package/final checkpoint remain)'
echo "Normalized source tree SHA-256: $SOURCE_BEFORE"
