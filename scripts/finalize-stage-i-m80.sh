#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M80 certification requires Node v22.16.0.' >&2; exit 1; }
TARGET="$ROOT/config/stage-i-m80-shared-primitive-component-layer-target.ts"; STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-I-M80-SHARED-PRIMITIVE-COMPONENT-LAYER.md"; CONT="$ROOT/M80-CONTINUATION-STATE.md"
grep -q "activationState: 'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M80 target is not pending certification.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M80 release status is not pending certification.' >&2; exit 1; }
npm run dependencies:certify
SOURCE_BEFORE="$(node scripts/lib/stage-i-m80-checkpoint-tree.mjs "$ROOT")"
bash scripts/verify-stage-i-m80-release.sh
[ "$(node scripts/lib/stage-i-m80-checkpoint-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M80 source tree changed during dedicated certification gates.' >&2; exit 1; }
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT; cp "$TARGET" "$TMP/target"; cp "$STATUS" "$TMP/status"; cp "$CONT" "$TMP/cont"
rollback(){ cp "$TMP/target" "$TARGET" || true; cp "$TMP/status" "$STATUS" || true; cp "$TMP/cont" "$CONT" || true; }; trap 'rollback; rm -rf "$TMP"' ERR
python3 - "$TARGET" "$STATUS" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
 p=Path(name); s=p.read_text(); s=s.replace("activationState: 'implementation-complete-pending-certification'","activationState: 'certification-gates-passed-pending-regression'").replace('**State:** implementation-complete-pending-certification','**State:** certification-gates-passed-pending-regression'); p.write_text(s)
PY
node scripts/verify-stage-i-m80-post-certification-state.mjs "$ROOT"
[ "$(node scripts/lib/stage-i-m80-checkpoint-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M80 intermediate promotion changed normalized source identity.' >&2; exit 1; }
trap - ERR
rm -rf "$TMP"
echo 'STAGE I M80 DEDICATED CERTIFICATION GATES: PASS (historical regression/package/final checkpoint remain)'
echo "Normalized source tree SHA-256: $SOURCE_BEFORE"
