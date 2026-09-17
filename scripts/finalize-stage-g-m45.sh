#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = "v22.16.0" ] || { echo "FAIL: M45 certification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }

TARGET="$ROOT/config/stage-g-m45-boards-collection-route-recovery-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-G-M45-BOARDS-COLLECTION-ROUTE-RECOVERY.md"
M44="$ROOT/config/stage-g-m44-management-authority-consolidation-target.ts"
OUT_DIR="$ROOT/m45-certified-artifacts-upload"
BASE='Work-Management-App-v1.43.2-Stage-G-M45-Certified-Baseline'
FINAL_ZIP="$OUT_DIR/$BASE.zip"
FINAL_PASS="$OUT_DIR/$BASE-PASS.txt"
COMMIT="${M45_SOURCE_COMMIT:-${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || printf 'unbound')}}"
[[ "$COMMIT" =~ ^[a-f0-9]{40}$ ]] || { echo "FAIL: invalid M45 source commit binding: $COMMIT" >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M45 source target must remain implementation-complete-pending-certification until certification succeeds.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M45 source release status must match the pending certification target.' >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'active-certified'" "$M44" || { echo 'FAIL: M44 active-certified prerequisite is not satisfied.' >&2; exit 1; }

SOURCE_BEFORE="$(node scripts/lib/stage-g-m45-certification-tree.mjs "$ROOT")"
[[ "$SOURCE_BEFORE" =~ ^[a-f0-9]{64}$ ]] || { echo 'FAIL: invalid pre-certification M45 source digest.' >&2; exit 1; }
TARGET_SHA_BEFORE="$(sha256sum "$TARGET" | awk '{print $1}')"
STATUS_SHA_BEFORE="$(sha256sum "$STATUS" | awk '{print $1}')"

# Fail-closed order: M45 static -> deterministic -> browser -> retained route/management
# and Account/Users/Settings regressions -> type/security/UI. Source remains pending.
npm run boards-collection:check
npm run boards-collection:workflows
npm run boards-collection:test
npm run boards-collection:browser
npm run route-lifecycle:check
npm run route-lifecycle:test
npm run route-lifecycle:browser
npm run management-authority:check
npm run management-authority:test
npm run management-authority:browser
npm run account-recovery:check
npm run account-recovery:test
npm run account-recovery:browser
npm run users-rbac-recovery:check
npm run users-rbac-recovery:test
npm run users-rbac-recovery:browser
npm run settings-recovery:check
npm run settings-recovery:test
npm run settings-recovery:browser
npm run typecheck
npm run security:check
npm run verify:ui

SOURCE_AFTER_PRE_GATES="$(node scripts/lib/stage-g-m45-certification-tree.mjs "$ROOT")"
[ "$SOURCE_AFTER_PRE_GATES" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M45 source tree changed during pre-certification gates.' >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M45 source target changed state during pre-certification gates.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M45 source release status changed state during pre-certification gates.' >&2; exit 1; }
[ "$(sha256sum "$TARGET" | awk '{print $1}')" = "$TARGET_SHA_BEFORE" ] || { echo 'FAIL: M45 source target record changed during pre-certification gates.' >&2; exit 1; }
[ "$(sha256sum "$STATUS" | awk '{print $1}')" = "$STATUS_SHA_BEFORE" ] || { echo 'FAIL: M45 source release-status record changed during pre-certification gates.' >&2; exit 1; }

# Certification staging is derived from the exact bound Git commit, not from ambient
# filesystem copy semantics. This makes tracked bytes, symlink type, and executable mode
# canonical across macOS/Linux and excludes untracked/generated state by construction.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo 'FAIL: M45 certification requires a Git worktree.' >&2; exit 1; }
BOUND_HEAD="$(git rev-parse HEAD)"
[ "$BOUND_HEAD" = "$COMMIT" ] || { echo "FAIL: M45 source commit binding does not match HEAD: bound=$COMMIT head=$BOUND_HEAD" >&2; exit 1; }
git cat-file -e "$COMMIT^{commit}" 2>/dev/null || { echo "FAIL: M45 source commit is not resolvable in the local Git object database: $COMMIT" >&2; exit 1; }

STAGE_ROOT="$(mktemp -d)"
trap 'rm -rf "$STAGE_ROOT"' EXIT
STAGE_DIR="$STAGE_ROOT/$BASE"
STAGE_ZIP="$STAGE_ROOT/$BASE.zip"
STAGE_PASS="$STAGE_ROOT/$BASE-PASS.txt"
mkdir -p "$STAGE_DIR"
git archive --format=tar "$COMMIT" | tar -xf - -C "$STAGE_DIR"
rm -f "$STAGE_DIR/CHECKSUMS.sha256"

# The canonical committed payload must be byte/type/mode-identical to the source
# certification tree before state promotion. On failure the comparator prints exact
# path-level drift, proving whether ambient working-tree state differs from the commit.
node scripts/lib/stage-g-m45-certification-tree.mjs "$ROOT" --compare "$STAGE_DIR" || {
  echo 'FAIL: initial staged M45 payload does not match the certified source tree.' >&2
  exit 1
}

# Only the isolated staged payload is promoted to active-certified.
python3 - "$STAGE_DIR/config/stage-g-m45-boards-collection-route-recovery-target.ts" "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M45-BOARDS-COLLECTION-ROUTE-RECOVERY.md" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
    p=Path(name); s=p.read_text()
    s=s.replace("activationState: 'implementation-complete-pending-certification'", "activationState: 'active-certified'")
    s=s.replace('**State:** implementation-complete-pending-certification', '**State:** active-certified')
    p.write_text(s)
PY
CERTIFIED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat >> "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M45-BOARDS-COLLECTION-ROUTE-RECOVERY.md" <<STATUS

## Final certified baseline — $CERTIFIED_AT

The fail-closed M45 certification and artifact-publication transaction passed for source commit \
\`$COMMIT\`. The packaged Boards Collection & Route Recovery state is **active-certified**. The certification-tree digest excludes only the M45 target and release-state records so the pending repository source and promoted package can be compared without self-referential state mutation.
STATUS

STAGED_DIGEST="$(node "$STAGE_DIR/scripts/lib/stage-g-m45-certification-tree.mjs" "$STAGE_DIR")"
if [ "$STAGED_DIGEST" != "$SOURCE_BEFORE" ]; then
  node scripts/lib/stage-g-m45-certification-tree.mjs "$ROOT" --compare "$STAGE_DIR" || true
  echo 'FAIL: staged active-certified M45 payload does not match the certified source tree.' >&2
  exit 1
fi
(
  cd "$STAGE_DIR"
  node verify-stage-g-m45-boards-collection-route-recovery.mjs
)
grep -q "activationState: 'active-certified'" "$STAGE_DIR/config/stage-g-m45-boards-collection-route-recovery-target.ts" || { echo 'FAIL: staged M45 target did not reach active-certified.' >&2; exit 1; }
grep -q '\*\*State:\*\* active-certified' "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M45-BOARDS-COLLECTION-ROUTE-RECOVERY.md" || { echo 'FAIL: staged M45 release status did not reach active-certified.' >&2; exit 1; }

# Historical regression and production build execute against the staged active-certified candidate.
[ -d "$ROOT/node_modules" ] || { echo 'FAIL: governed dependency tree is unavailable for the active-certified post-state gate.' >&2; exit 1; }
[ ! -e "$STAGE_DIR/node_modules" ] || { echo 'FAIL: staged candidate unexpectedly contains node_modules before post-state verification.' >&2; exit 1; }
ln -s "$ROOT/node_modules" "$STAGE_DIR/node_modules"
cleanup_stage_runtime() {
  rm -rf \
    "$STAGE_DIR/node_modules" \
    "$STAGE_DIR/dist" \
    "$STAGE_DIR/coverage" \
    "$STAGE_DIR/test-results" \
    "$STAGE_DIR/playwright-report" \
    "$STAGE_DIR/.vite" \
    "$STAGE_DIR/.vitest" \
    "$STAGE_DIR/.wm-modern-test-toolchain" \
    "$STAGE_DIR/m37-evidence" \
    "$STAGE_DIR/m45-certified-artifacts-upload" \
    "$STAGE_DIR/supabase/.temp"
}
trap 'cleanup_stage_runtime; rm -rf "$STAGE_ROOT"' EXIT
(
  cd "$STAGE_DIR"
  export PATH="$ROOT/node_modules/.bin:$PATH"
  NODE_OPTIONS="--experimental-strip-types --disable-warning=ExperimentalWarning" bash verify-project.sh
  "$ROOT/node_modules/.bin/vite" build
)
cleanup_stage_runtime
POST_STATE_DIGEST="$(node "$STAGE_DIR/scripts/lib/stage-g-m45-certification-tree.mjs" "$STAGE_DIR")"
if [ "$POST_STATE_DIGEST" != "$SOURCE_BEFORE" ]; then
  node scripts/lib/stage-g-m45-certification-tree.mjs "$ROOT" --compare "$STAGE_DIR" || true
  echo 'FAIL: active-certified M45 candidate changed during post-state historical/build verification.' >&2
  exit 1
fi
grep -q "activationState: 'active-certified'" "$STAGE_DIR/config/stage-g-m45-boards-collection-route-recovery-target.ts" || { echo 'FAIL: active-certified M45 state was lost during post-state verification.' >&2; exit 1; }
grep -q '\*\*State:\*\* active-certified' "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M45-BOARDS-COLLECTION-ROUTE-RECOVERY.md" || { echo 'FAIL: active-certified M45 release state was lost during post-state verification.' >&2; exit 1; }
SOURCE_AFTER_HISTORY="$(node scripts/lib/stage-g-m45-certification-tree.mjs "$ROOT")"
[ "$SOURCE_AFTER_HISTORY" = "$SOURCE_BEFORE" ] || { echo 'FAIL: authoritative pending M45 source changed during active-candidate historical/build gates.' >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: authoritative M45 source target is no longer pending after active-candidate post-state gates.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: authoritative M45 source release status is no longer pending after active-candidate post-state gates.' >&2; exit 1; }
[ "$(sha256sum "$TARGET" | awk '{print $1}')" = "$TARGET_SHA_BEFORE" ] || { echo 'FAIL: authoritative M45 source target record changed during active-candidate post-state gates.' >&2; exit 1; }
[ "$(sha256sum "$STATUS" | awk '{print $1}')" = "$STATUS_SHA_BEFORE" ] || { echo 'FAIL: authoritative M45 source release-status record changed during active-candidate post-state gates.' >&2; exit 1; }

# Certified payload hygiene/integrity.
if find "$STAGE_DIR" -type l -print -quit | grep -q .; then echo 'FAIL: symbolic link detected in M45 certified payload.' >&2; exit 1; fi
if find "$STAGE_DIR" -type d \( -name '.git' -o -name node_modules -o -name dist -o -name coverage -o -name test-results -o -name playwright-report -o -name '.vite' -o -name '.vitest' -o -name '.wm-modern-test-toolchain' -o -name m37-evidence \) -print -quit | grep -q .; then echo 'FAIL: generated/private directory detected in M45 certified payload.' >&2; exit 1; fi
if find "$STAGE_DIR" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then echo 'FAIL: concrete environment file detected in M45 certified payload.' >&2; exit 1; fi
node "$STAGE_DIR/scripts/scan-secrets.mjs"
(
  cd "$STAGE_DIR"
  find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256
  sha256sum -c CHECKSUMS.sha256 >/dev/null
)
(
  cd "$STAGE_ROOT"
  zip -qry "$STAGE_ZIP" "$BASE"
)
unzip -t "$STAGE_ZIP" >/dev/null
VERIFY_ROOT="$STAGE_ROOT/verify"
mkdir -p "$VERIFY_ROOT"
unzip -q "$STAGE_ZIP" -d "$VERIFY_ROOT"
[ "$(find "$VERIFY_ROOT" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')" = '1' ] || { echo 'FAIL: M45 ZIP root structure is invalid.' >&2; exit 1; }
(
  cd "$VERIFY_ROOT/$BASE"
  sha256sum -c CHECKSUMS.sha256 >/dev/null
)
VERIFY_DIGEST="$(node "$VERIFY_ROOT/$BASE/scripts/lib/stage-g-m45-certification-tree.mjs" "$VERIFY_ROOT/$BASE")"
[ "$VERIFY_DIGEST" = "$SOURCE_BEFORE" ] || { echo 'FAIL: extracted M45 certified payload source digest mismatch.' >&2; exit 1; }
ZIP_SHA="$(sha256sum "$STAGE_ZIP" | awk '{print $1}')"
cat > "$STAGE_PASS" <<PASS
Work Management App v1.43.2
Stage G — Milestone 45
Boards Collection & Route Recovery

RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $CERTIFIED_AT
CERTIFIED ZIP SHA-256: $ZIP_SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE_BEFORE
CERTIFIED SOURCE COMMIT: $COMMIT

Required gates:
- M45 static verification: PASS
- M45 deterministic verification: PASS
- M45 browser verification: 3/3 PASS
- Active/Archive/Trash collection navigation: PASS
- Board search by name/description: PASS
- Create/open/duplicate workflows: PASS
- Archive/restore/trash/permanent-delete workflows: PASS
- Inactive archived/trashed workspace route guard: PASS
- Lifecycle-appropriate list menus and inactive-viewer menu suppression: PASS
- M37-BRD-001 regression closure evidence: PASS
- M40 route lifecycle regression: PASS
- M44 management authority regression: PASS
- M41 Account functional regression: PASS
- M42 Users/RBAC functional regression: PASS
- M43 Settings functional regression: PASS
- TypeScript verification: PASS
- Security verification: PASS
- UI verification: PASS
- Post-certification state: active-certified
- Historical regression verification: PASS
- Production build: PASS
- Certified-payload secret scan: PASS
- Package checksum/hygiene verification: PASS

Milestone 45 certification: PASS
PASS

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
mv "$STAGE_ZIP" "$FINAL_ZIP"
mv "$STAGE_PASS" "$FINAL_PASS"
M45_EXPECTED_SOURCE_COMMIT="$COMMIT" node scripts/verify-stage-g-m45-certified-artifact.mjs

echo '============================================================'
echo 'STAGE G M45 CERTIFICATION: PASS'
echo "Certified baseline: $FINAL_ZIP"
echo "SHA-256: $ZIP_SHA"
echo "PASS record: $FINAL_PASS"
echo 'M45 STATUS: ACTIVE-CERTIFIED / PASS'
echo '============================================================'
