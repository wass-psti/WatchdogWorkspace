#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ "$(node --version)" != "v22.16.0" ]; then
  echo "FAIL: M42 finalization requires Node v22.16.0; current $(node --version)."
  exit 1
fi

TARGET="$ROOT/config/stage-g-m42-users-rbac-functional-recovery-target.ts"
RELEASE_STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md"
PARENT="$(dirname "$ROOT")"
FINAL_NAME="Work-Management-App-v1.43.2-Stage-G-M42-Certified-Baseline"
FINAL_DIR="$PARENT/$FINAL_NAME"
FINAL_ZIP="$PARENT/$FINAL_NAME.zip"
PASS_RECORD="$PARENT/$FINAL_NAME-PASS.txt"
ORIGINAL_TARGET="$(mktemp)"
ORIGINAL_RELEASE_STATUS="$(mktemp)"
cp "$TARGET" "$ORIGINAL_TARGET"
cp "$RELEASE_STATUS" "$ORIGINAL_RELEASE_STATUS"
STAGE_ROOT="$(mktemp -d "$PARENT/.m42-finalize.XXXXXX")"
STAGE_DIR="$STAGE_ROOT/$FINAL_NAME"
STAGE_ZIP="$STAGE_ROOT/$FINAL_NAME.zip"
STAGE_PASS="$STAGE_ROOT/$FINAL_NAME-PASS.txt"
BACKUP_ROOT="$STAGE_ROOT/previous-certified-artifacts"
mkdir -p "$BACKUP_ROOT"
CERTIFICATION_COMMITTED=0
BACKED_UP_DIR=0
BACKED_UP_ZIP=0
BACKED_UP_PASS=0
NEW_DIR_INSTALLED=0
NEW_ZIP_INSTALLED=0
NEW_PASS_INSTALLED=0

restore_previous_certified_artifacts() {
  if [ "$NEW_DIR_INSTALLED" -eq 1 ]; then rm -rf "$FINAL_DIR"; fi
  if [ "$NEW_ZIP_INSTALLED" -eq 1 ]; then rm -f "$FINAL_ZIP"; fi
  if [ "$NEW_PASS_INSTALLED" -eq 1 ]; then rm -f "$PASS_RECORD"; fi
  if [ "$BACKED_UP_DIR" -eq 1 ]; then mv "$BACKUP_ROOT/final-dir" "$FINAL_DIR"; fi
  if [ "$BACKED_UP_ZIP" -eq 1 ]; then mv "$BACKUP_ROOT/final.zip" "$FINAL_ZIP"; fi
  if [ "$BACKED_UP_PASS" -eq 1 ]; then mv "$BACKUP_ROOT/pass.txt" "$PASS_RECORD"; fi
}

rollback_uncommitted_certification() {
  status=$?
  if [ "$CERTIFICATION_COMMITTED" -ne 1 ]; then
    cp "$ORIGINAL_TARGET" "$TARGET"
    cp "$ORIGINAL_RELEASE_STATUS" "$RELEASE_STATUS"
    restore_previous_certified_artifacts
    rm -rf "$STAGE_ROOT"
    echo 'M42 finalization did not commit; restored the pre-certification activation target, preserved prior certified artifacts, and removed staged artifacts.' >&2
    if [ "$status" -eq 0 ]; then status=1; fi
  fi
  rm -f "$ORIGINAL_TARGET" "$ORIGINAL_RELEASE_STATUS"
  return "$status"
}
trap rollback_uncommitted_certification EXIT

CERTIFICATION_TREE_HELPER="$ROOT/scripts/lib/stage-g-m42-certification-tree.mjs"
SOURCE_TREE_DIGEST_BEFORE="$(node "$CERTIFICATION_TREE_HELPER" "$ROOT")"
CERTIFIED_SOURCE_COMMIT="${GITHUB_SHA:-${WM_SOURCE_COMMIT:-unbound}}"

# Dedicated certification owns environment preflight, dependency restoration,
# every pre-activation M42 gate, activation, and its immediate state check.
npm run users-rbac-recovery:certify
SOURCE_TREE_DIGEST_AFTER_CERTIFY="$(node "$CERTIFICATION_TREE_HELPER" "$ROOT")"
if [ "$SOURCE_TREE_DIGEST_AFTER_CERTIFY" != "$SOURCE_TREE_DIGEST_BEFORE" ]; then
  echo 'FAIL: M42 source tree changed during dedicated certification; refusing to package stale evidence.'
  exit 1
fi
STATUS_OUTPUT="$(npm run users-rbac-recovery:status 2>&1)"
printf '%s\n' "$STATUS_OUTPUT"
printf '%s\n' "$STATUS_OUTPUT" | grep -q 'active-certified' || { echo 'FAIL: M42 did not reach active-certified.'; exit 1; }

# Dedicated certification already owns post-activation historical and the
# complete release gate. From this point forward the finalizer owns only the
# certified artifact transaction; any packaging failure still rolls the target
# and release-status record back to their exact pre-certification state.

CERTIFIED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
mkdir -p "$STAGE_DIR"
tar \
  --exclude='./.git' --exclude='*/.git' --exclude='*/.git/*' \
  --exclude='./node_modules' --exclude='*/node_modules' --exclude='*/node_modules/*' \
  --exclude='./test-results' --exclude='*/test-results' --exclude='*/test-results/*' \
  --exclude='./playwright-report' --exclude='*/playwright-report' --exclude='*/playwright-report/*' \
  --exclude='./coverage' --exclude='*/coverage' --exclude='*/coverage/*' \
  --exclude='./dist' --exclude='*/dist' --exclude='*/dist/*' \
  --exclude='./.vite' --exclude='*/.vite' --exclude='*/.vite/*' \
  --exclude='./.vitest' --exclude='*/.vitest' --exclude='*/.vitest/*' \
  --exclude='./m37-evidence' --exclude='*/m37-evidence' --exclude='*/m37-evidence/*' \
  --exclude='./.env' --exclude='./.env.local' --exclude='./.env.*.local' \
  --exclude='./npm-debug.log*' --exclude='./.DS_Store' --exclude='*/.DS_Store' \
  -cf - . | (cd "$STAGE_DIR" && tar -xf -)
find "$STAGE_DIR" -name '.DS_Store' -delete
STAGED_SOURCE_TREE_DIGEST="$(node "$STAGE_DIR/scripts/lib/stage-g-m42-certification-tree.mjs" "$STAGE_DIR")"
if [ "$STAGED_SOURCE_TREE_DIGEST" != "$SOURCE_TREE_DIGEST_BEFORE" ]; then
  echo 'FAIL: staged M42 certified baseline does not match the source tree that was certified.'
  exit 1
fi
# Certified source baselines retain environment templates only. Any concrete/local
# environment file is deployment-specific and must not cross the package boundary.
find "$STAGE_DIR" -type f -name '.env*' ! -name '*.example' -delete

# A certified baseline must never contain repository internals, local runtime
# secrets/config, generated evidence, package installations, or build outputs.
if find "$STAGE_DIR" -type d \
  \( -name '.git' -o -name 'node_modules' -o -name 'test-results' -o -name 'playwright-report' -o -name 'coverage' -o -name 'dist' -o -name '.vite' -o -name '.vitest' -o -name 'm37-evidence' \) \
  -print -quit | grep -q .; then
  echo 'FAIL: generated/private directory detected in staged M42 certified baseline.'
  exit 1
fi
if find "$STAGE_DIR" -type f \
  \( -name 'npm-debug.log*' -o -name '.DS_Store' \) \
  -print -quit | grep -q .; then
  echo 'FAIL: local/private file detected in staged M42 certified baseline.'
  exit 1
fi
if find "$STAGE_DIR" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then
  echo 'FAIL: concrete/local environment file detected in staged M42 certified baseline.'
  exit 1
fi

# The release-status record inside a certified baseline must agree with the
# certified activation target. Keep the working-tree record pending until the
# package transaction itself has been reverified and is ready to commit.
STAGED_RELEASE_STATUS="$STAGE_DIR/$(basename "$RELEASE_STATUS")"
awk '
  BEGIN { updated=0 }
  !updated && /^- \*\*State:\*\*/ { print "- **State:** active-certified"; updated=1; next }
  { print }
  END { if (!updated) exit 42 }
' "$STAGED_RELEASE_STATUS" > "$STAGED_RELEASE_STATUS.tmp"
mv "$STAGED_RELEASE_STATUS.tmp" "$STAGED_RELEASE_STATUS"
cat >> "$STAGED_RELEASE_STATUS" <<STATUS

## Final certified baseline — $CERTIFIED_AT

The complete fail-closed M42 certification and artifact-publication transaction passed. This baseline is **active-certified**. The external PASS record is bound to the certified ZIP SHA-256; the packaged release-status record intentionally does not embed that digest to avoid a self-referential archive hash.
STATUS
grep -Fq -- '- **State:** active-certified' "$STAGED_RELEASE_STATUS" || {
  echo 'FAIL: staged M42 release-status record was not synchronized to active-certified.'
  exit 1
}
if find "$STAGE_DIR" -type l -print -quit | grep -q .; then
  echo 'FAIL: symbolic link detected in staged M42 certified baseline.'
  find "$STAGE_DIR" -type l -print
  exit 1
fi

# Scan the exact staged payload, after package-specific pruning/status updates and
# before checksums/ZIP creation. This makes the certified artifact—not merely the
# working tree—the security boundary.
node "$STAGE_DIR/scripts/scan-secrets.mjs"
(
  cd "$STAGE_DIR"
  rm -f CHECKSUMS.sha256
  find . -type f ! -name CHECKSUMS.sha256 -print0 | sort -z | xargs -0 shasum -a 256 > CHECKSUMS.sha256
  shasum -a 256 -c CHECKSUMS.sha256 >/dev/null
)

(
  cd "$STAGE_ROOT"
  zip -qry "$STAGE_ZIP" "$FINAL_NAME" -x \
    '*/.git/*' '*/node_modules/*' '*/test-results/*' '*/playwright-report/*' \
    '*/coverage/*' '*/dist/*' '*/.vite/*' '*/.vitest/*' '*/m37-evidence/*' \
    '*/.env' '*/.env.local' '*/.env.*.local' '*/npm-debug.log*' '*/.DS_Store'
)
unzip -t "$STAGE_ZIP" >/dev/null
ZIP_VERIFY_ROOT="$STAGE_ROOT/zip-verify"
mkdir -p "$ZIP_VERIFY_ROOT"
unzip -q "$STAGE_ZIP" -d "$ZIP_VERIFY_ROOT"
if [ ! -d "$ZIP_VERIFY_ROOT/$FINAL_NAME" ] || [ "$(find "$ZIP_VERIFY_ROOT" -mindepth 1 -maxdepth 1 -print | wc -l | tr -d ' ')" != "1" ]; then
  echo 'FAIL: staged M42 ZIP must contain exactly the expected certified baseline root.'
  exit 1
fi
if find "$ZIP_VERIFY_ROOT/$FINAL_NAME" -type l -print -quit | grep -q .; then
  echo 'FAIL: symbolic link detected after extracting staged M42 ZIP.'
  exit 1
fi
(
  cd "$ZIP_VERIFY_ROOT/$FINAL_NAME"
  shasum -a 256 -c CHECKSUMS.sha256 >/dev/null
)
FINAL_SHA="$(shasum -a 256 "$STAGE_ZIP" | awk '{print $1}')"

cat > "$STAGE_PASS" <<PASS
Work Management App v1.43.2
Stage G — Milestone 42
Users / RBAC Functional Recovery

RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $CERTIFIED_AT
CERTIFIED ZIP SHA-256: $FINAL_SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE_TREE_DIGEST_BEFORE
CERTIFIED SOURCE COMMIT: $CERTIFIED_SOURCE_COMMIT

Required gates:
- Dependency preflight: PASS
- M42 static verification: PASS
- M42 deterministic verification: PASS
- M42 browser verification: PASS
- Database/RLS verification: PASS
- Dedicated M42 certification: PASS
- Post-certification state: active-certified
- Historical regression verification: PASS
- TypeScript verification: PASS
- Security verification: PASS
- UI verification: PASS
- Package checksum/hygiene verification: PASS
- Certified-payload secret scan: PASS
- Release-status synchronization: PASS

Milestone 42 certification: PASS
PASS

# Commit all certified artifacts as one recoverable swap. Existing known-good
# artifacts are moved into the staging backup first and restored automatically
# if any subsequent move fails.
if [ -e "$FINAL_DIR" ]; then mv "$FINAL_DIR" "$BACKUP_ROOT/final-dir"; BACKED_UP_DIR=1; fi
if [ -e "$FINAL_ZIP" ]; then mv "$FINAL_ZIP" "$BACKUP_ROOT/final.zip"; BACKED_UP_ZIP=1; fi
if [ -e "$PASS_RECORD" ]; then mv "$PASS_RECORD" "$BACKUP_ROOT/pass.txt"; BACKED_UP_PASS=1; fi
mv "$STAGE_DIR" "$FINAL_DIR"; NEW_DIR_INSTALLED=1
mv "$STAGE_ZIP" "$FINAL_ZIP"; NEW_ZIP_INSTALLED=1
mv "$STAGE_PASS" "$PASS_RECORD"; NEW_PASS_INSTALLED=1

# Revalidate the published artifacts after the recoverable swap. The commit
# point remains after these checks so any publication anomaly restores the
# previous certified artifacts and the pre-certification activation target.
unzip -t "$FINAL_ZIP" >/dev/null
PUBLISHED_SHA="$(shasum -a 256 "$FINAL_ZIP" | awk '{print $1}')"
if [ "$PUBLISHED_SHA" != "$FINAL_SHA" ]; then
  echo "FAIL: published M42 ZIP digest differs from staged certified digest."
  exit 1
fi
(
  cd "$FINAL_DIR"
  shasum -a 256 -c CHECKSUMS.sha256 >/dev/null
)
grep -Fq "CERTIFIED ZIP SHA-256: $FINAL_SHA" "$PASS_RECORD" || {
  echo 'FAIL: published M42 PASS record is not bound to the published ZIP digest.'
  exit 1
}
grep -Fq "CERTIFIED SOURCE TREE SHA-256: $SOURCE_TREE_DIGEST_BEFORE" "$PASS_RECORD" || {
  echo 'FAIL: published M42 PASS record is not bound to the certified source tree digest.'
  exit 1
}
grep -Fq "CERTIFIED SOURCE COMMIT: $CERTIFIED_SOURCE_COMMIT" "$PASS_RECORD" || {
  echo 'FAIL: published M42 PASS record is not bound to the certified source commit.'
  exit 1
}
grep -Fq -- '- **State:** active-certified' "$FINAL_DIR/$(basename "$RELEASE_STATUS")" || {
  echo 'FAIL: published M42 release-status record is not active-certified.'
  exit 1
}

# Commit the working-tree release-status record only after the published
# artifacts have been fully reverified. Any failure before CERTIFICATION_COMMITTED
# restores both this record and the activation target from exact snapshots.
cp "$FINAL_DIR/$(basename "$RELEASE_STATUS")" "$RELEASE_STATUS"
grep -Fq -- '- **State:** active-certified' "$RELEASE_STATUS" || {
  echo 'FAIL: working-tree M42 release-status synchronization failed.'
  exit 1
}

CERTIFICATION_COMMITTED=1
trap - EXIT
# Cleanup happens after the certification transaction is committed. Cleanup
# failure is non-fatal: the certified artifacts have already been reverified,
# and reporting certification failure here would create a false-negative state.
rm -f "$ORIGINAL_TARGET" "$ORIGINAL_RELEASE_STATUS" || echo 'WARN: unable to remove M42 certification snapshots after committed certification.' >&2
rm -rf "$STAGE_ROOT" || echo 'WARN: unable to remove M42 staging directory after committed certification.' >&2

echo '============================================================'
echo 'STAGE G M42 CERTIFICATION: PASS'
echo "Certified baseline: $FINAL_ZIP"
echo "SHA-256: $FINAL_SHA"
echo "PASS record: $PASS_RECORD"
echo 'M42 STATUS: ACTIVE-CERTIFIED / PASS'
echo '============================================================'
