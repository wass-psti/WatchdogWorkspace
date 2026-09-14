#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ "$(node --version)" != "v22.16.0" ]; then
  echo "FAIL: M41 finalization requires Node v22.16.0; current $(node --version)."
  exit 1
fi

npm run dependencies:ensure
npm run account-recovery:check
npm run account-recovery:test
npm run account-recovery:browser
npm run account-recovery:certify

STATUS_OUTPUT="$(npm run account-recovery:status 2>&1)"
printf '%s\n' "$STATUS_OUTPUT"
printf '%s\n' "$STATUS_OUTPUT" | grep -q 'active-certified' || { echo 'FAIL: M41 did not reach active-certified.'; exit 1; }

node scripts/verify-all-historical-verifiers.mjs
npm run typecheck
npm run security:check
npm run verify:ui

PARENT="$(dirname "$ROOT")"
FINAL_NAME="Work-Management-App-v1.43.2-Stage-G-M41-Certified-Baseline"
FINAL_DIR="$PARENT/$FINAL_NAME"
FINAL_ZIP="$PARENT/$FINAL_NAME.zip"
PASS_RECORD="$PARENT/$FINAL_NAME-PASS.txt"

rm -rf "$FINAL_DIR" "$FINAL_ZIP"
mkdir -p "$FINAL_DIR"

tar \
  --exclude='./node_modules' \
  --exclude='./test-results' \
  --exclude='./playwright-report' \
  --exclude='./coverage' \
  --exclude='./dist' \
  --exclude='./.vite' \
  --exclude='./.DS_Store' \
  -cf - . | (cd "$FINAL_DIR" && tar -xf -)

find "$FINAL_DIR" -name '.DS_Store' -delete
if find "$FINAL_DIR" -type l -print -quit | grep -q .; then
  echo 'FAIL: symbolic link detected in final M41 baseline.'
  find "$FINAL_DIR" -type l -print
  exit 1
fi

(
  cd "$FINAL_DIR"
  rm -f CHECKSUMS.sha256
  find . -type f ! -name CHECKSUMS.sha256 -print0 | sort -z | xargs -0 shasum -a 256 > CHECKSUMS.sha256
  shasum -a 256 -c CHECKSUMS.sha256 >/dev/null
)

CERTIFIED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat > "$PASS_RECORD" <<PASS
Work Management App v1.43.2
Stage G — Milestone 41
Account Functional Recovery

RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $CERTIFIED_AT

Required gates:
- Dependency preflight: PASS
- M41 static verification: PASS
- M41 deterministic verification: PASS
- M41 browser verification: PASS
- Dedicated M41 certification: PASS
- Post-certification state: active-certified
- Historical regression verification: PASS
- TypeScript verification: PASS
- Security verification: PASS
- UI verification: PASS
- Package checksum/hygiene verification: PASS

Milestone 41 certification: PASS
PASS

cd "$PARENT"
zip -qry "$FINAL_ZIP" "$FINAL_NAME" -x '*/node_modules/*' '*/test-results/*' '*/playwright-report/*' '*/coverage/*' '*/dist/*' '*/.vite/*' '*/.DS_Store'
unzip -t "$FINAL_ZIP" >/dev/null
FINAL_SHA="$(shasum -a 256 "$FINAL_ZIP" | awk '{print $1}')"

echo '============================================================'
echo 'STAGE G M41 CERTIFICATION: PASS'
echo "Certified baseline: $FINAL_ZIP"
echo "SHA-256: $FINAL_SHA"
echo "PASS record: $PASS_RECORD"
echo 'M41 STATUS: ACTIVE-CERTIFIED / PASS'
echo '============================================================'
