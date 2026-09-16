#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = "v22.16.0" ] || { echo "FAIL: M43 certification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }

TARGET="$ROOT/config/stage-g-m43-settings-functional-recovery-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-G-M43-SETTINGS-FUNCTIONAL-RECOVERY.md"
M42="$ROOT/config/stage-g-m42-users-rbac-functional-recovery-target.ts"
OUT_DIR="$ROOT/m43-certified-artifacts-upload"
BASE='Work-Management-App-v1.43.2-Stage-G-M43-Certified-Baseline'
FINAL_ZIP="$OUT_DIR/$BASE.zip"
FINAL_PASS="$OUT_DIR/$BASE-PASS.txt"
COMMIT="${M43_SOURCE_COMMIT:-${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || printf 'unbound')}}"
[[ "$COMMIT" =~ ^[a-f0-9]{40}$ ]] || { echo "FAIL: invalid M43 source commit binding: $COMMIT" >&2; exit 1; }
grep -q "activationState: 'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M43 source target must remain implementation-complete-pending-certification until the fail-closed artifact transaction succeeds.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M43 source release status must match the pending certification target.' >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'active-certified'" "$M42" || { echo 'FAIL: M42 active-certified prerequisite is not satisfied.' >&2; exit 1; }

SOURCE_BEFORE="$(node scripts/lib/stage-g-m43-certification-tree.mjs "$ROOT")"
[[ "$SOURCE_BEFORE" =~ ^[a-f0-9]{64}$ ]] || { echo 'FAIL: invalid pre-certification M43 source digest.' >&2; exit 1; }

# Fail-closed gate order: static -> deterministic -> browser/E2E -> retained
# authority regressions -> type/security/UI. No certified state exists yet.
npm run settings-recovery:check
npm run settings-recovery:test
npm run settings-recovery:browser
npm run backup-dr:check
npm run backup-dr:test
npm run typecheck
npm run security:check
npm run verify:ui

SOURCE_AFTER_PRE_GATES="$(node scripts/lib/stage-g-m43-certification-tree.mjs "$ROOT")"
[ "$SOURCE_AFTER_PRE_GATES" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M43 source tree changed during pre-certification gates.' >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M43 source target changed state during pre-certification gates.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M43 source release status changed state during pre-certification gates.' >&2; exit 1; }

STAGE_ROOT="$(mktemp -d)"
trap 'rm -rf "$STAGE_ROOT"' EXIT
STAGE_DIR="$STAGE_ROOT/$BASE"
STAGE_ZIP="$STAGE_ROOT/$BASE.zip"
STAGE_PASS="$STAGE_ROOT/$BASE-PASS.txt"
python3 - "$ROOT" "$STAGE_DIR" <<'PY'
import os,sys,shutil
src,dst=sys.argv[1:3]
excluded={'.git','node_modules','dist','coverage','test-results','playwright-report','.vite','.vitest','.wm-modern-test-toolchain','m37-evidence','m43-certified-artifacts-upload'}
def ignore(path,names):
    relbase=os.path.relpath(path,src).replace(os.sep,'/')
    out=[]
    for name in names:
        rel=(name if relbase=='.' else f'{relbase}/{name}')
        if name in excluded or rel=='supabase/.temp': out.append(name)
        elif name=='.DS_Store' or name.startswith('npm-debug.log'): out.append(name)
        elif name=='.env' or (name.startswith('.env.') and not name.endswith('.example')): out.append(name)
    return out
shutil.copytree(src,dst,ignore=ignore,copy_function=shutil.copy2)
checksum=os.path.join(dst,'CHECKSUMS.sha256')
if os.path.exists(checksum): os.remove(checksum)
PY

# Dedicated certification candidate: switch only the isolated staged payload.
python3 - "$STAGE_DIR/config/stage-g-m43-settings-functional-recovery-target.ts" "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M43-SETTINGS-FUNCTIONAL-RECOVERY.md" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
    p=Path(name); s=p.read_text()
    s=s.replace("activationState: 'implementation-complete-pending-certification'", "activationState: 'active-certified'")
    s=s.replace('**State:** implementation-complete-pending-certification', '**State:** active-certified')
    p.write_text(s)
PY
CERTIFIED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat >> "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M43-SETTINGS-FUNCTIONAL-RECOVERY.md" <<STATUS

## Final certified baseline — $CERTIFIED_AT

The fail-closed M43 certification and artifact-publication transaction passed for source commit \
\`$COMMIT\`. The packaged Settings recovery authority is **active-certified**. The source-tree digest excludes only the two certification state records so pending source authority and certified packaged authority can be compared without self-referential state mutation.
STATUS

STAGED_DIGEST="$(node "$STAGE_DIR/scripts/lib/stage-g-m43-certification-tree.mjs" "$STAGE_DIR")"
[ "$STAGED_DIGEST" = "$SOURCE_BEFORE" ] || { echo 'FAIL: staged active-certified M43 payload does not match the certified source tree.' >&2; exit 1; }
(
  cd "$STAGE_DIR"
  node verify-stage-g-m43-settings-functional-recovery.mjs
)
grep -q "activationState: 'active-certified'" "$STAGE_DIR/config/stage-g-m43-settings-functional-recovery-target.ts" || { echo 'FAIL: staged M43 target did not reach active-certified.' >&2; exit 1; }
grep -q '\*\*State:\*\* active-certified' "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M43-SETTINGS-FUNCTIONAL-RECOVERY.md" || { echo 'FAIL: staged M43 release status did not reach active-certified.' >&2; exit 1; }

# Post-certification historical regression and production-build gate. These
# gates execute against the staged active-certified candidate itself, while the
# authoritative repository source remains pending. The staged candidate borrows
# the already-governed dependency tree through a temporary node_modules symlink;
# that bridge and all generated runtime outputs are removed before packaging.
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
    "$STAGE_DIR/m43-certified-artifacts-upload" \
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
POST_STATE_DIGEST="$(node "$STAGE_DIR/scripts/lib/stage-g-m43-certification-tree.mjs" "$STAGE_DIR")"
[ "$POST_STATE_DIGEST" = "$SOURCE_BEFORE" ] || { echo 'FAIL: active-certified M43 candidate changed during post-state historical/build verification.' >&2; exit 1; }
grep -q "activationState: 'active-certified'" "$STAGE_DIR/config/stage-g-m43-settings-functional-recovery-target.ts" || { echo 'FAIL: active-certified M43 state was lost during post-state verification.' >&2; exit 1; }
grep -q '\*\*State:\*\* active-certified' "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M43-SETTINGS-FUNCTIONAL-RECOVERY.md" || { echo 'FAIL: active-certified M43 release state was lost during post-state verification.' >&2; exit 1; }
SOURCE_AFTER_HISTORY="$(node scripts/lib/stage-g-m43-certification-tree.mjs "$ROOT")"
[ "$SOURCE_AFTER_HISTORY" = "$SOURCE_BEFORE" ] || { echo 'FAIL: authoritative pending M43 source changed during active-candidate historical/build gates.' >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: authoritative M43 source target is no longer pending after active-candidate post-state gates.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: authoritative M43 source release status is no longer pending after active-candidate post-state gates.' >&2; exit 1; }

# Certified-payload hygiene and integrity.
if find "$STAGE_DIR" -type l -print -quit | grep -q .; then echo 'FAIL: symbolic link detected in M43 certified payload.' >&2; exit 1; fi
if find "$STAGE_DIR" -type d \( -name '.git' -o -name node_modules -o -name dist -o -name coverage -o -name test-results -o -name playwright-report -o -name '.vite' -o -name '.vitest' -o -name '.wm-modern-test-toolchain' -o -name m37-evidence \) -print -quit | grep -q .; then echo 'FAIL: generated/private directory detected in M43 certified payload.' >&2; exit 1; fi
if find "$STAGE_DIR" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then echo 'FAIL: concrete environment file detected in M43 certified payload.' >&2; exit 1; fi
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
[ "$(find "$VERIFY_ROOT" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')" = '1' ] || { echo 'FAIL: M43 ZIP root structure is invalid.' >&2; exit 1; }
(
  cd "$VERIFY_ROOT/$BASE"
  sha256sum -c CHECKSUMS.sha256 >/dev/null
)
VERIFY_DIGEST="$(node "$VERIFY_ROOT/$BASE/scripts/lib/stage-g-m43-certification-tree.mjs" "$VERIFY_ROOT/$BASE")"
[ "$VERIFY_DIGEST" = "$SOURCE_BEFORE" ] || { echo 'FAIL: extracted M43 certified payload source digest mismatch.' >&2; exit 1; }
ZIP_SHA="$(sha256sum "$STAGE_ZIP" | awk '{print $1}')"
cat > "$STAGE_PASS" <<PASS
Work Management App v1.43.2
Stage G — Milestone 43
Settings Functional Recovery

RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $CERTIFIED_AT
CERTIFIED ZIP SHA-256: $ZIP_SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE_BEFORE
CERTIFIED SOURCE COMMIT: $COMMIT

Required gates:
- M43 static verification: PASS
- M43 deterministic verification: PASS
- M43 browser verification: 4/4 PASS
- Theme/density reload persistence: PASS
- Compatibility/diagnostics/backend evidence reload persistence: PASS
- Storage-health/persistent-storage browser verification: PASS
- Backup export/guarded restore round trip: PASS
- M34 backup/disaster-recovery regression: PASS
- TypeScript verification: PASS
- Security verification: PASS
- UI verification: PASS
- Post-certification state: active-certified
- Historical regression verification: PASS
- Production build: PASS
- Certified-payload secret scan: PASS
- Package checksum/hygiene verification: PASS

Milestone 43 certification: PASS
PASS

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
mv "$STAGE_ZIP" "$FINAL_ZIP"
mv "$STAGE_PASS" "$FINAL_PASS"
M43_EXPECTED_SOURCE_COMMIT="$COMMIT" node scripts/verify-stage-g-m43-certified-artifact.mjs

echo '============================================================'
echo 'STAGE G M43 CERTIFICATION: PASS'
echo "Certified baseline: $FINAL_ZIP"
echo "SHA-256: $ZIP_SHA"
echo "PASS record: $FINAL_PASS"
echo 'M43 STATUS: ACTIVE-CERTIFIED / PASS'
echo '============================================================'
