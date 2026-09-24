#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo 'FAIL: M54 certification requires Node v22.16.0.' >&2; exit 1; }
TARGET="$ROOT/config/stage-g-m54-functional-production-readiness-certification-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-G-M54-FUNCTIONAL-PRODUCTION-READINESS-CERTIFICATION.md"
ATTEST="$ROOT/m54-live-attestation.json"
ROLLBACK="$ROOT/release-artifacts/m54/rollback-source/Work-Management-App-v1.43.2-Stage-G-M53-Certified-Baseline.zip"
grep -q "activationState: 'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M54 target is not pending certification.' >&2; exit 1; }
test -f "$ATTEST" || { echo 'FAIL: M54 live deployment attestation is missing.' >&2; exit 1; }
node - <<'NODE'
const a=require('./m54-live-attestation.json');
if(a.milestone!==54||a.semanticsVersion!=='1.43.2-m54-v1'||a.authenticatedWorkflowPass!==true||!a.repository||!a.commitSha||!a.workflowRunId||!/^https:\/\//.test(a.productionUrl||'')) throw new Error('M54 live attestation is incomplete or invalid.');
NODE
printf '%s  %s\n' '34fde2a39bc3b3a68c0cea300977813e868b96ebf78774d96d3944b9e417b0af' "$ROLLBACK" | sha256sum -c -
npm run production-readiness:check
npm run production-readiness:test
npm run verify:historical-all
node scripts/scan-secrets.mjs
BASE='Work-Management-App-v1.43.2-Stage-G-M54-Production-Baseline'
RB='Work-Management-App-v1.43.2-Stage-G-M54-Rollback-Baseline'
OUT="$ROOT/m54-certified-artifacts-upload"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
STAGE="$TMP/$BASE"; mkdir -p "$STAGE"
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='coverage' --exclude='test-results' --exclude='playwright-report' --exclude='m54-certified-artifacts-upload' "$ROOT/" "$STAGE/"
python3 - "$STAGE/config/stage-g-m54-functional-production-readiness-certification-target.ts" "$STAGE/RELEASE-STATUS-v1.43.2-STAGE-G-M54-FUNCTIONAL-PRODUCTION-READINESS-CERTIFICATION.md" "$STAGE/M54-CONTINUATION-STATE.md" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
    p=Path(name)
    s=p.read_text()
    s=s.replace("activationState: 'implementation-complete-pending-certification'","activationState: 'active-certified'")
    s=s.replace('State: implementation-complete-pending-certification','State: active-certified')
    s=s.replace('State: IMPLEMENTATION COMPLETE — LOCAL/LIVE VERIFICATION AND CERTIFICATION REMAIN','State: FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE')
    p.write_text(s)
PY
if find "$STAGE" -type l -print -quit | grep -q .; then echo 'FAIL: symbolic link in M54 certified payload.' >&2; exit 1; fi
if find "$STAGE" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then echo 'FAIL: concrete environment file in M54 certified payload.' >&2; exit 1; fi
node "$STAGE/scripts/scan-secrets.mjs"
(cd "$STAGE" && find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256 && sha256sum -c CHECKSUMS.sha256 >/dev/null)
(cd "$TMP" && zip -qry "$BASE.zip" "$BASE")
cp "$ROLLBACK" "$TMP/$RB.zip"
unzip -t "$TMP/$BASE.zip" >/dev/null
unzip -t "$TMP/$RB.zip" >/dev/null
SHA="$(sha256sum "$TMP/$BASE.zip"|awk '{print $1}')"
RBSHA="$(sha256sum "$TMP/$RB.zip"|awk '{print $1}')"
AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat > "$TMP/$BASE-PASS.txt" <<PASS
Work Management App v1.43.2
Stage G — Milestone 54
Functional Production Readiness Certification
RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $AT
PRODUCTION BASELINE SHA-256: $SHA
ROLLBACK BASELINE SHA-256: $RBSHA
M54 SEMANTICS VERSION: 1.43.2-m54-v1
Milestone 54 certification: PASS
PASS
rm -rf "$OUT"; mkdir -p "$OUT"
mv "$TMP/$BASE.zip" "$OUT/"
mv "$TMP/$RB.zip" "$OUT/"
mv "$TMP/$BASE-PASS.txt" "$OUT/"
echo 'STAGE G M54 FUNCTIONAL PRODUCTION READINESS CERTIFICATION: PASS'
echo "Production baseline: $OUT/$BASE.zip"
echo "Rollback baseline: $OUT/$RB.zip"
echo "SHA-256: $SHA"
echo "Rollback SHA-256: $RBSHA"
