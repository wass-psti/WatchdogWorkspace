#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M52 certification requires Node v22.16.0.' >&2; exit 1; }
TARGET="$ROOT/config/stage-g-m52-cross-module-rbac-authenticated-e2e-certification-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-G-M52-CROSS-MODULE-RBAC-AUTHENTICATED-E2E-CERTIFICATION.md"
grep -q "activationState: 'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M52 target is not pending certification.' >&2; exit 1; }
bash scripts/verify-stage-g-m52-release.sh
SOURCE="$(node scripts/lib/stage-g-m52-certification-tree.mjs "$ROOT")"
BASE='Work-Management-App-v1.43.2-Stage-G-M52-Certified-Baseline'; OUT="$ROOT/m52-certified-artifacts-upload"; TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
STAGE="$TMP/$BASE"; mkdir -p "$STAGE"
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='coverage' --exclude='test-results' --exclude='playwright-report' --exclude='m52-certified-artifacts-upload' "$ROOT/" "$STAGE/"
python3 - "$STAGE/config/stage-g-m52-cross-module-rbac-authenticated-e2e-certification-target.ts" "$STAGE/RELEASE-STATUS-v1.43.2-STAGE-G-M52-CROSS-MODULE-RBAC-AUTHENTICATED-E2E-CERTIFICATION.md" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
 p=Path(name);s=p.read_text();s=s.replace("activationState: 'implementation-complete-pending-certification'","activationState: 'active-certified'").replace('State: implementation-complete-pending-certification','State: active-certified');p.write_text(s)
PY
[ "$(node "$STAGE/scripts/lib/stage-g-m52-certification-tree.mjs" "$STAGE")" = "$SOURCE" ] || { echo 'FAIL: staged M52 source tree differs from verified source.' >&2; exit 1; }
grep -q "activationState: 'active-certified'" "$STAGE/config/stage-g-m52-cross-module-rbac-authenticated-e2e-certification-target.ts"
grep -q '^State: active-certified$' "$STAGE/RELEASE-STATUS-v1.43.2-STAGE-G-M52-CROSS-MODULE-RBAC-AUTHENTICATED-E2E-CERTIFICATION.md"
echo 'Stage G M52 post-certification staged-state check: PASS'
npm run verify:historical-all
if find "$STAGE" -type l -print -quit | grep -q .; then echo 'FAIL: symbolic link in certified payload.' >&2; exit 1; fi
if find "$STAGE" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then echo 'FAIL: concrete environment file in certified payload.' >&2; exit 1; fi
node "$STAGE/scripts/scan-secrets.mjs"
(cd "$STAGE" && find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256 && sha256sum -c CHECKSUMS.sha256 >/dev/null)
(cd "$TMP" && zip -qry "$BASE.zip" "$BASE")
unzip -t "$TMP/$BASE.zip" >/dev/null
SHA="$(sha256sum "$TMP/$BASE.zip"|awk '{print $1}')"; AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat > "$TMP/$BASE-PASS.txt" <<PASS
Work Management App v1.43.2
Stage G — Milestone 52
Cross-Module RBAC & Authenticated E2E Certification
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $AT
CERTIFIED ZIP SHA-256: $SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE
M52 SEMANTICS VERSION: 1.43.2-m52-v1
Milestone 52 certification: PASS
PASS
rm -rf "$OUT"; mkdir -p "$OUT"; mv "$TMP/$BASE.zip" "$OUT/"; mv "$TMP/$BASE-PASS.txt" "$OUT/"
echo 'STAGE G M52 CERTIFICATION: PASS'
echo "Certified baseline: $OUT/$BASE.zip"
echo "SHA-256: $SHA"
