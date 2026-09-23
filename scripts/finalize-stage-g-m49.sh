#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo "FAIL: M49 certification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
TARGET="$ROOT/config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-G-M49-BOARDS-KANBAN-DRAG-DROP-RECOVERY.md"
M48="$ROOT/config/stage-g-m48-boards-columns-cells-status-recovery-target.ts"
OUT_DIR="$ROOT/m49-certified-artifacts-upload"
BASE='Work-Management-App-v1.43.2-Stage-G-M49-Certified-Baseline'
FINAL_ZIP="$OUT_DIR/$BASE.zip"
FINAL_PASS="$OUT_DIR/$BASE-PASS.txt"
COMMIT="${M49_SOURCE_COMMIT:-${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || printf 'unbound')}}"
[[ "$COMMIT" =~ ^[a-f0-9]{40}$ ]] || { echo "FAIL: invalid M49 source commit binding: $COMMIT" >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M49 source target must remain implementation-complete-pending-certification until certification succeeds.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M49 source release status must match the pending certification target.' >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'active-certified'" "$M48" || { echo 'FAIL: M48 active-certified prerequisite is not satisfied.' >&2; exit 1; }
SOURCE_BEFORE="$(node scripts/lib/stage-g-m49-certification-tree.mjs "$ROOT")"
[[ "$SOURCE_BEFORE" =~ ^[a-f0-9]{64}$ ]] || { echo 'FAIL: invalid pre-certification M49 source digest.' >&2; exit 1; }
TARGET_SHA_BEFORE="$(sha256sum "$TARGET" | awk '{print $1}')"
STATUS_SHA_BEFORE="$(sha256sum "$STATUS" | awk '{print $1}')"
CONTRACT_VERSION="$(node --experimental-strip-types --disable-warning=ExperimentalWarning --input-type=module -e "import {M46_BOARD_CONTRACT_VERSION as v} from './config/stage-g-m46-board-backend-contract.ts'; process.stdout.write(v)")"
CONTRACT_DIGEST="$(node --experimental-strip-types --disable-warning=ExperimentalWarning --input-type=module -e "import {M46_BOARD_CONTRACT_DIGEST as d} from './config/stage-g-m46-board-backend-contract.ts'; process.stdout.write(d)")"
SEMANTICS_VERSION='1.43.2-m49-v1'
[[ "$CONTRACT_DIGEST" =~ ^[a-f0-9]{64}$ ]] || { echo 'FAIL: invalid retained M46 contract digest authority.' >&2; exit 1; }

npm run boards-kanban-drag-drop:verify:release
SOURCE_AFTER_PRE_GATES="$(node scripts/lib/stage-g-m49-certification-tree.mjs "$ROOT")"
[ "$SOURCE_AFTER_PRE_GATES" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M49 source tree changed during pre-certification gates.' >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M49 source target changed state during pre-certification gates.' >&2; exit 1; }
grep -q '\*\*State:\*\* implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M49 source release status changed state during pre-certification gates.' >&2; exit 1; }
[ "$(sha256sum "$TARGET" | awk '{print $1}')" = "$TARGET_SHA_BEFORE" ] || { echo 'FAIL: M49 target record changed during pre-certification gates.' >&2; exit 1; }
[ "$(sha256sum "$STATUS" | awk '{print $1}')" = "$STATUS_SHA_BEFORE" ] || { echo 'FAIL: M49 release-status record changed during pre-certification gates.' >&2; exit 1; }

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo 'FAIL: M49 certification requires a Git worktree.' >&2; exit 1; }
BOUND_HEAD="$(git rev-parse HEAD)"
[ "$BOUND_HEAD" = "$COMMIT" ] || { echo "FAIL: M49 source commit binding does not match HEAD: bound=$COMMIT head=$BOUND_HEAD" >&2; exit 1; }
git cat-file -e "$COMMIT^{commit}" 2>/dev/null || { echo "FAIL: M49 source commit is not resolvable in local Git objects: $COMMIT" >&2; exit 1; }

STAGE_ROOT="$(mktemp -d)"
trap 'rm -rf "$STAGE_ROOT"' EXIT
STAGE_DIR="$STAGE_ROOT/$BASE"
STAGE_ZIP="$STAGE_ROOT/$BASE.zip"
STAGE_PASS="$STAGE_ROOT/$BASE-PASS.txt"
mkdir -p "$STAGE_DIR"
git archive --format=tar "$COMMIT" | tar -xf - -C "$STAGE_DIR"
rm -f "$STAGE_DIR/CHECKSUMS.sha256"
node scripts/lib/stage-g-m49-certification-tree.mjs "$ROOT" --compare "$STAGE_DIR" || { echo 'FAIL: initial staged M49 payload does not match source tree.' >&2; exit 1; }

python3 - "$STAGE_DIR/config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts" "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M49-BOARDS-KANBAN-DRAG-DROP-RECOVERY.md" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
    p=Path(name); s=p.read_text()
    s=s.replace("activationState: 'implementation-complete-pending-certification'", "activationState: 'active-certified'")
    s=s.replace('**State:** implementation-complete-pending-certification', '**State:** active-certified')
    p.write_text(s)
PY
CERTIFIED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
cat >> "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M49-BOARDS-KANBAN-DRAG-DROP-RECOVERY.md" <<STATUS

## Final certified baseline — $CERTIFIED_AT

The fail-closed M49 certification passed for source commit \`$COMMIT\`. The packaged Boards Kanban & Drag/Drop Recovery state is **active-certified**. The retained Board backend contract is \`$CONTRACT_VERSION\` / \`$CONTRACT_DIGEST\`; M49 semantic authority is \`$SEMANTICS_VERSION\`. Kanban rendering, status lanes, item and structural movement, rollback, keyboard alternatives, serialized view switching, retained M48/M47/M46 regressions, historical verification, build, and package hygiene passed before promotion.
STATUS
STAGED_DIGEST="$(node "$STAGE_DIR/scripts/lib/stage-g-m49-certification-tree.mjs" "$STAGE_DIR")"
[ "$STAGED_DIGEST" = "$SOURCE_BEFORE" ] || { node scripts/lib/stage-g-m49-certification-tree.mjs "$ROOT" --compare "$STAGE_DIR" || true; echo 'FAIL: staged active-certified M49 payload does not match certified source tree.' >&2; exit 1; }
(
  cd "$STAGE_DIR"
  node --experimental-strip-types --disable-warning=ExperimentalWarning verify-stage-g-m49-boards-kanban-drag-drop-recovery.mjs
)
grep -q "activationState: 'active-certified'" "$STAGE_DIR/config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts" || { echo 'FAIL: staged M49 target did not reach active-certified.' >&2; exit 1; }
grep -q '\*\*State:\*\* active-certified' "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M49-BOARDS-KANBAN-DRAG-DROP-RECOVERY.md" || { echo 'FAIL: staged M49 release status did not reach active-certified.' >&2; exit 1; }

[ -d "$ROOT/node_modules" ] || { echo 'FAIL: governed dependency tree is unavailable for active-certified post-state verification.' >&2; exit 1; }
[ ! -e "$STAGE_DIR/node_modules" ] || { echo 'FAIL: staged candidate unexpectedly contains node_modules.' >&2; exit 1; }
ln -s "$ROOT/node_modules" "$STAGE_DIR/node_modules"
cleanup_stage_runtime(){
  rm -rf "$STAGE_DIR/node_modules" "$STAGE_DIR/dist" "$STAGE_DIR/coverage" "$STAGE_DIR/test-results" "$STAGE_DIR/playwright-report" "$STAGE_DIR/.vite" "$STAGE_DIR/.vitest" "$STAGE_DIR/.wm-modern-test-toolchain" "$STAGE_DIR/m37-evidence" "$STAGE_DIR/m49-certified-artifacts-upload" "$STAGE_DIR/supabase/.temp"
}
trap 'cleanup_stage_runtime; rm -rf "$STAGE_ROOT"' EXIT
(
  cd "$STAGE_DIR"
  export PATH="$ROOT/node_modules/.bin:$PATH"
  node scripts/verify-stage-g-m49-production-boundary.mjs
  node --experimental-strip-types --disable-warning=ExperimentalWarning verify-stage-g-m48-boards-columns-cells-status-system-recovery.mjs
  NODE_OPTIONS='--experimental-strip-types --disable-warning=ExperimentalWarning' node scripts/verify-stage-g-m47-production-invariants.mjs
  NODE_OPTIONS='--experimental-strip-types --disable-warning=ExperimentalWarning' node scripts/verify-stage-g-m46-production-contract.mjs
  WM_M50_PROVENANCE_CONTEXT='m49-certified-artifact' NODE_OPTIONS='--experimental-strip-types --disable-warning=ExperimentalWarning' bash verify-project.sh
  "$ROOT/node_modules/.bin/vite" build
)
cleanup_stage_runtime
POST_STATE_DIGEST="$(node "$STAGE_DIR/scripts/lib/stage-g-m49-certification-tree.mjs" "$STAGE_DIR")"
[ "$POST_STATE_DIGEST" = "$SOURCE_BEFORE" ] || { node scripts/lib/stage-g-m49-certification-tree.mjs "$ROOT" --compare "$STAGE_DIR" || true; echo 'FAIL: active-certified M49 candidate changed during post-state historical/build verification.' >&2; exit 1; }
SOURCE_AFTER_HISTORY="$(node scripts/lib/stage-g-m49-certification-tree.mjs "$ROOT")"
[ "$SOURCE_AFTER_HISTORY" = "$SOURCE_BEFORE" ] || { echo 'FAIL: authoritative pending M49 source changed during post-state gates.' >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: authoritative M49 source target lost pending state.' >&2; exit 1; }

if find "$STAGE_DIR" -type l -print -quit | grep -q .; then echo 'FAIL: symbolic link detected in M49 certified payload.' >&2; exit 1; fi
if find "$STAGE_DIR" -type d \( -name '.git' -o -name node_modules -o -name dist -o -name coverage -o -name test-results -o -name playwright-report -o -name '.vite' -o -name '.vitest' -o -name '.wm-modern-test-toolchain' -o -name m37-evidence \) -print -quit | grep -q .; then echo 'FAIL: generated/private directory detected in M49 certified payload.' >&2; exit 1; fi
if find "$STAGE_DIR" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then echo 'FAIL: concrete environment file detected in M49 certified payload.' >&2; exit 1; fi
node "$STAGE_DIR/scripts/scan-secrets.mjs"
(
  cd "$STAGE_DIR"
  find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256
  sha256sum -c CHECKSUMS.sha256 >/dev/null
)
(cd "$STAGE_ROOT" && zip -qry "$STAGE_ZIP" "$BASE")
unzip -t "$STAGE_ZIP" >/dev/null
VERIFY_ROOT="$STAGE_ROOT/verify"; mkdir -p "$VERIFY_ROOT"; unzip -q "$STAGE_ZIP" -d "$VERIFY_ROOT"
[ "$(find "$VERIFY_ROOT" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')" = '1' ] || { echo 'FAIL: M49 ZIP root structure is invalid.' >&2; exit 1; }
(cd "$VERIFY_ROOT/$BASE" && sha256sum -c CHECKSUMS.sha256 >/dev/null)
VERIFY_DIGEST="$(node "$VERIFY_ROOT/$BASE/scripts/lib/stage-g-m49-certification-tree.mjs" "$VERIFY_ROOT/$BASE")"
[ "$VERIFY_DIGEST" = "$SOURCE_BEFORE" ] || { echo 'FAIL: extracted M49 certified payload source digest mismatch.' >&2; exit 1; }
ZIP_SHA="$(sha256sum "$STAGE_ZIP" | awk '{print $1}')"
cat > "$STAGE_PASS" <<PASS
Work Management App v1.43.2
Stage G — Milestone 49
Boards Kanban & Drag/Drop Recovery

RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $CERTIFIED_AT
CERTIFIED ZIP SHA-256: $ZIP_SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE_BEFORE
CERTIFIED SOURCE COMMIT: $COMMIT
BOARD CONTRACT VERSION: $CONTRACT_VERSION
BOARD CONTRACT DIGEST: $CONTRACT_DIGEST
M49 SEMANTICS VERSION: $SEMANTICS_VERSION
BACKEND BOUNDARY: retained-m46-m47-no-schema-change-v1

Required gates:
- M49 static recovery verification: PASS
- M49 state-aware workflow verification: PASS
- M49 deterministic recovery verification: PASS
- M49 browser recovery verification: PASS
- M49 retained-backend/no-migration boundary: PASS
- M48 typed column/cell/status regression: PASS
- M47 table/group/item regression: PASS
- M47 disposable database regression: PASS
- M47 production semantic attestation: PASS
- M46 backend contract regression: PASS
- M46 disposable database regression: PASS
- M46 production contract attestation: PASS
- M45 Boards collection/route regression: PASS
- M17 table regression: PASS
- M18 virtualization regression: PASS
- Database/RLS historical regression: PASS
- TypeScript verification: PASS
- Security verification: PASS
- UI verification: PASS
- Historical regression verification: PASS
- Production build: PASS
- Post-certification retained production re-attestation: PASS
- Certified-payload secret scan: PASS
- Package checksum/hygiene verification: PASS

Milestone 49 certification: PASS
PASS
rm -rf "$OUT_DIR"; mkdir -p "$OUT_DIR"
mv "$STAGE_ZIP" "$FINAL_ZIP"; mv "$STAGE_PASS" "$FINAL_PASS"
M49_EXPECTED_SOURCE_COMMIT="$COMMIT" node scripts/verify-stage-g-m49-certified-artifact.mjs

echo '============================================================'
echo 'STAGE G M49 CERTIFICATION: PASS'
echo "Certified baseline: $FINAL_ZIP"
echo "SHA-256: $ZIP_SHA"
echo "PASS record: $FINAL_PASS"
echo "M49 SEMANTICS: $SEMANTICS_VERSION"
echo 'M49 STATUS: ACTIVE-CERTIFIED / PASS'
echo '============================================================'
