#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ "$(node --version)" = 'v22.16.0' ] || { echo "FAIL: M50 certification requires Node v22.16.0; current $(node --version)." >&2; exit 1; }
TARGET="$ROOT/config/stage-g-m50-rich-item-workspace-file-recovery-target.ts"
STATUS="$ROOT/RELEASE-STATUS-v1.43.2-STAGE-G-M50-RICH-ITEM-WORKSPACE-FILE-RECOVERY.md"
M49="$ROOT/config/stage-g-m49-boards-kanban-drag-drop-recovery-target.ts"
OUT_DIR="$ROOT/m50-certified-artifacts-upload"
BASE='Work-Management-App-v1.43.2-Stage-G-M50-Certified-Baseline'
FINAL_ZIP="$OUT_DIR/$BASE.zip"
FINAL_PASS="$OUT_DIR/$BASE-PASS.txt"
COMMIT="${M50_SOURCE_COMMIT:-${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || printf 'unbound')}}"
[[ "$COMMIT" =~ ^[a-f0-9]{40}$ ]] || { echo "FAIL: invalid M50 source commit binding: $COMMIT" >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'implementation-complete-pending-certification'" "$TARGET" || { echo 'FAIL: M50 source target must remain pending until certification succeeds.' >&2; exit 1; }
grep -q 'State: implementation-complete-pending-certification' "$STATUS" || { echo 'FAIL: M50 source release status must remain pending until certification succeeds.' >&2; exit 1; }
grep -Eq "activationState:[[:space:]]*'implementation-complete-pending-certification'" "$M49" || { echo 'FAIL: M49 repository source state no longer matches the certified predecessor commit.' >&2; exit 1; }
grep -q "certifiedCommit: '63ab65080b7b6fb33ba276fa169ca2a55b19d06c'" "$TARGET" || { echo 'FAIL: M50 target is not bound to the certified M49 commit.' >&2; exit 1; }
grep -q "certifiedSourceTree: 'd26f3a136f02ff48cd6113ff605f5132cf903ad4c74beefbe29e1b642c5260f4'" "$TARGET" || { echo 'FAIL: M50 target is not bound to the certified M49 source tree.' >&2; exit 1; }
SOURCE_BEFORE="$(node scripts/lib/stage-g-m50-certification-tree.mjs "$ROOT")"
TARGET_SHA_BEFORE="$(sha256sum "$TARGET" | awk '{print $1}')"
STATUS_SHA_BEFORE="$(sha256sum "$STATUS" | awk '{print $1}')"
npm run rich-item-workspace-recovery:verify:release
[ "$(node scripts/lib/stage-g-m50-certification-tree.mjs "$ROOT")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: M50 source tree changed during certification gates.' >&2; exit 1; }
[ "$(sha256sum "$TARGET" | awk '{print $1}')" = "$TARGET_SHA_BEFORE" ] || { echo 'FAIL: M50 target mutated during gates.' >&2; exit 1; }
[ "$(sha256sum "$STATUS" | awk '{print $1}')" = "$STATUS_SHA_BEFORE" ] || { echo 'FAIL: M50 release status mutated during gates.' >&2; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo 'FAIL: M50 certification requires a Git worktree.' >&2; exit 1; }
[ "$(git rev-parse HEAD)" = "$COMMIT" ] || { echo 'FAIL: M50 source commit binding does not match HEAD.' >&2; exit 1; }
STAGE_ROOT="$(mktemp -d)"; trap 'rm -rf "$STAGE_ROOT"' EXIT
STAGE_DIR="$STAGE_ROOT/$BASE"; STAGE_ZIP="$STAGE_ROOT/$BASE.zip"; STAGE_PASS="$STAGE_ROOT/$BASE-PASS.txt"
mkdir -p "$STAGE_DIR"
git archive --format=tar "$COMMIT" | tar -xf - -C "$STAGE_DIR"
rm -f "$STAGE_DIR/CHECKSUMS.sha256"
node scripts/lib/stage-g-m50-certification-tree.mjs "$ROOT" --compare "$STAGE_DIR"
python3 - "$STAGE_DIR/config/stage-g-m50-rich-item-workspace-file-recovery-target.ts" "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M50-RICH-ITEM-WORKSPACE-FILE-RECOVERY.md" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
    p=Path(name)
    s=p.read_text().replace("activationState: 'implementation-complete-pending-certification'", "activationState: 'active-certified'").replace('State: implementation-complete-pending-certification','State: active-certified')
    p.write_text(s)
PY
CERTIFIED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
printf '\n## Final certified baseline — %s\n\nM50 fail-closed certification passed for source commit `%s`. The packaged Rich Item Workspace & File Recovery state is **active-certified** with semantic authority `1.43.2-m50-v1`.\n' "$CERTIFIED_AT" "$COMMIT" >> "$STAGE_DIR/RELEASE-STATUS-v1.43.2-STAGE-G-M50-RICH-ITEM-WORKSPACE-FILE-RECOVERY.md"
[ "$(node "$STAGE_DIR/scripts/lib/stage-g-m50-certification-tree.mjs" "$STAGE_DIR")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: staged active-certified M50 payload does not match source tree.' >&2; exit 1; }
(cd "$STAGE_DIR" && node --experimental-strip-types --disable-warning=ExperimentalWarning verify-stage-g-m50-rich-item-workspace-file-recovery.mjs)
[ -d "$ROOT/node_modules" ] || { echo 'FAIL: governed dependencies unavailable for post-state verification.' >&2; exit 1; }
ln -s "$ROOT/node_modules" "$STAGE_DIR/node_modules"
cleanup_stage(){ rm -rf "$STAGE_DIR/node_modules" "$STAGE_DIR/dist" "$STAGE_DIR/coverage" "$STAGE_DIR/test-results" "$STAGE_DIR/playwright-report" "$STAGE_DIR/.vite" "$STAGE_DIR/.vitest" "$STAGE_DIR/.wm-modern-test-toolchain" "$STAGE_DIR/m37-evidence" "$STAGE_DIR/m50-certified-artifacts-upload" "$STAGE_DIR/supabase/.temp"; }
trap 'cleanup_stage; rm -rf "$STAGE_ROOT"' EXIT
(cd "$STAGE_DIR" && export PATH="$ROOT/node_modules/.bin:$PATH" && node scripts/verify-stage-g-m50-production-invariants.mjs && node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-stage-g-m46-production-contract.mjs && NODE_OPTIONS='--experimental-strip-types --disable-warning=ExperimentalWarning' bash verify-project.sh && "$ROOT/node_modules/.bin/vite" build)
cleanup_stage
[ "$(node "$STAGE_DIR/scripts/lib/stage-g-m50-certification-tree.mjs" "$STAGE_DIR")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: staged M50 payload drifted during post-state verification.' >&2; exit 1; }
if find "$STAGE_DIR" -type l -print -quit | grep -q .; then echo 'FAIL: symbolic link detected in certified payload.' >&2; exit 1; fi
if find "$STAGE_DIR" -type f -name '.env*' ! -name '*.example' -print -quit | grep -q .; then echo 'FAIL: concrete environment file detected in certified payload.' >&2; exit 1; fi
node "$STAGE_DIR/scripts/scan-secrets.mjs"
(cd "$STAGE_DIR" && find . -type f ! -name CHECKSUMS.sha256 -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS.sha256 && sha256sum -c CHECKSUMS.sha256 >/dev/null)
(cd "$STAGE_ROOT" && zip -qry "$STAGE_ZIP" "$BASE")
unzip -t "$STAGE_ZIP" >/dev/null
VERIFY_ROOT="$STAGE_ROOT/verify"; mkdir -p "$VERIFY_ROOT"; unzip -q "$STAGE_ZIP" -d "$VERIFY_ROOT"
(cd "$VERIFY_ROOT/$BASE" && sha256sum -c CHECKSUMS.sha256 >/dev/null)
[ "$(node "$VERIFY_ROOT/$BASE/scripts/lib/stage-g-m50-certification-tree.mjs" "$VERIFY_ROOT/$BASE")" = "$SOURCE_BEFORE" ] || { echo 'FAIL: extracted certified M50 source digest mismatch.' >&2; exit 1; }
ZIP_SHA="$(sha256sum "$STAGE_ZIP" | awk '{print $1}')"
cat > "$STAGE_PASS" <<PASS
Work Management App v1.43.2
Stage G — Milestone 50
Rich Item Workspace & File Recovery

RESULT: PASS
CERTIFICATION STATE: active-certified
CERTIFIED AT: $CERTIFIED_AT
CERTIFIED ZIP SHA-256: $ZIP_SHA
CERTIFIED SOURCE TREE SHA-256: $SOURCE_BEFORE
CERTIFIED SOURCE COMMIT: $COMMIT
M50 SEMANTICS VERSION: 1.43.2-m50-v1
STORAGE LIFECYCLE: storage-first-retryable-metadata-finalize-v1
AUTHORIZATION: edit-mutates-view-reads-v1

Milestone 50 certification: PASS
PASS
rm -rf "$OUT_DIR"; mkdir -p "$OUT_DIR"; mv "$STAGE_ZIP" "$FINAL_ZIP"; mv "$STAGE_PASS" "$FINAL_PASS"
M50_EXPECTED_SOURCE_COMMIT="$COMMIT" node scripts/verify-stage-g-m50-certified-artifact.mjs
echo '============================================================'
echo 'STAGE G M50 CERTIFICATION: PASS'
echo "Certified baseline: $FINAL_ZIP"
echo "SHA-256: $ZIP_SHA"
echo "PASS record: $FINAL_PASS"
echo 'M50 SEMANTICS: 1.43.2-m50-v1'
echo 'M50 STATUS: ACTIVE-CERTIFIED / PASS'
echo '============================================================'
