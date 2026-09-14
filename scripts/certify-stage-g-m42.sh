#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
TARGET="$ROOT/config/stage-g-m42-users-rbac-functional-recovery-target.ts"
RELEASE_STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md"
ORIGINAL_TARGET="$(mktemp)"
ORIGINAL_RELEASE_STATUS="$(mktemp)"
cp "$TARGET" "$ORIGINAL_TARGET"
cp "$RELEASE_STATUS" "$ORIGINAL_RELEASE_STATUS"
CERTIFICATION_VERIFIED=0

rollback_unverified_certification() {
  status=$?
  if [ "$CERTIFICATION_VERIFIED" -ne 1 ]; then
    cp "$ORIGINAL_TARGET" "$TARGET"
    cp "$ORIGINAL_RELEASE_STATUS" "$RELEASE_STATUS"
    echo 'M42 dedicated certification did not complete; restored the pre-certification activation target and release-status record.' >&2
    if [ "$status" -eq 0 ]; then status=1; fi
  fi
  rm -f "$ORIGINAL_TARGET" "$ORIGINAL_RELEASE_STATUS"
  return "$status"
}
trap rollback_unverified_certification EXIT

# Release activation is itself the complete, rollback-safe source-certification
# transaction. It cannot be bypassed by caller-provided environment markers or
# mintable attestations and owns preflight, dependencies, browser, Database/RLS,
# activation, post-state, historical, and full release verification.
npm run users-rbac-recovery:activate:release

STATUS_OUTPUT="$(npm run users-rbac-recovery:status 2>&1)"
printf '%s\n' "$STATUS_OUTPUT"
printf '%s\n' "$STATUS_OUTPUT" | grep -q 'active-certified' || {
  echo 'FAIL: M42 dedicated certification did not reach active-certified.'
  exit 1
}

CERTIFICATION_VERIFIED=1
trap - EXIT
rm -f "$ORIGINAL_TARGET" "$ORIGINAL_RELEASE_STATUS"
echo 'Stage G M42 Users / RBAC Functional Recovery certification: PASS'
