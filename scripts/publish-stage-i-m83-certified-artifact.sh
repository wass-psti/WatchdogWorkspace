#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
TARGET="$ROOT/config/stage-i-m83-authentication-account-surfaces-target.ts"; STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-I-M83-AUTHENTICATION-ACCOUNT-SURFACES.md"; CONT="$ROOT/M83-CONTINUATION-STATE.md"
BASE='Work-Management-App-v1.43.2-Stage-I-M83-Certified-Baseline'; OUT="$ROOT/m83-certified-artifacts-upload"
npm run authentication-account:final-checkpoint
SOURCE="$(node scripts/lib/stage-i-m83-checkpoint-tree.mjs "$ROOT")"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT; STAGE="$TMP/$BASE"; mkdir -p "$STAGE"
EX=(--exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='coverage' --exclude='test-results' --exclude='playwright-report' --exclude='.wm-modern-test-toolchain'); for i in $(seq 55 83); do EX+=("--exclude=m${i}-certified-artifacts-upload"); done
rsync -a "${EX[@]}" "$ROOT/" "$STAGE/"
python3 - "$STAGE/config/stage-i-m83-authentication-account-surfaces-target.ts" "$STAGE/RELEASE-STATUS-v1.43.2-STAGE-I-M83-AUTHENTICATION-ACCOUNT-SURFACES.md" "$STAGE/M83-CONTINUATION-STATE.md" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
 p=Path(name);s=p.read_text();s=s.replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'").replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified').replace('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS','**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE');p.write_text(s)
PY
if find "$STAGE" -type l -print -quit | grep -q .; then echo 'FAIL: symlink in M83 certified payload.' >&2; exit 1; fi
node "$STAGE/scripts/scan-secrets.mjs"
(cd "$STAGE" && node scripts/verify-stage-i-m83-certified-state.mjs "$STAGE" && node verify-stage-i-m83-authentication-account-surfaces.mjs && node scripts/verify-stage-i-m83-authentication-account-surfaces-execution.mjs && node scripts/verify-stage-i-m83-m82-source-guard.mjs)
[ "$(node "$STAGE/scripts/lib/stage-i-m83-checkpoint-tree.mjs" "$STAGE")" = "$SOURCE" ] || { echo 'FAIL: staged M83 identity mismatch.' >&2; exit 1; }
(cd "$STAGE" && find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256 && sha256sum -c CHECKSUMS.sha256 >/dev/null)
(cd "$TMP" && zip -qry "$BASE.zip" "$BASE"); unzip -t "$TMP/$BASE.zip" >/dev/null; SHA="$(shasum -a 256 "$TMP/$BASE.zip"|awk '{print $1}')"; AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat > "$TMP/$BASE-PASS.txt" <<PASS
Work Management App v1.43.2
Stage I — Milestone 83
Authentication & Account Surfaces
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $AT
CERTIFIED ZIP SHA-256: $SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE
M82 PROVENANCE ZIP SHA-256: be5a15bb18146e9d9e85637bd526a879c188170c93b61a3160a5aecb0ce07ab3
M82 PROVENANCE SOURCE SHA-256: ea5ef107443b6b1eadce08a9be5b71e45ca0f250076280a03625f295c56ee2cd
M83 SEMANTICS VERSION: 1.43.2-m83-v1
Milestone 83 certification: PASS
PASS
node scripts/verify-stage-i-m83-certified-artifact.mjs "$TMP/$BASE.zip" "$TMP/$BASE-PASS.txt"; node scripts/verify-stage-i-m83-certified-package-hygiene.mjs "$TMP/$BASE.zip"
python3 - "$TARGET" "$STATUS" "$CONT" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
 p=Path(name);s=p.read_text();s=s.replace("activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'").replace('**State:** certification-gates-passed-pending-regression','**State:** active-certified').replace('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS','**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE');p.write_text(s)
PY
node scripts/verify-stage-i-m83-certified-state.mjs "$ROOT"; [ "$(node scripts/lib/stage-i-m83-checkpoint-tree.mjs "$ROOT")" = "$SOURCE" ] || { echo 'FAIL: root M83 promotion changed normalized source identity.' >&2; exit 1; }
rm -rf "$OUT"; mkdir -p "$OUT"; cp "$TMP/$BASE.zip" "$OUT/"; cp "$TMP/$BASE-PASS.txt" "$OUT/"; node scripts/verify-stage-i-m83-certified-artifact.mjs; node scripts/verify-stage-i-m83-certified-package-hygiene.mjs
echo 'STAGE I M83 CERTIFIED ARTIFACT PUBLICATION: PASS'; echo "Certified baseline: $OUT/$BASE.zip"; echo "PASS record: $OUT/$BASE-PASS.txt"; echo "SHA-256: $SHA"; echo "Source tree SHA-256: $SOURCE"
