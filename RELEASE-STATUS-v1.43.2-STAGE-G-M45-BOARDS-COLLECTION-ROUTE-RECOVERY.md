# Work Management App v1.43.2 — Stage G M45 Boards Collection & Route Recovery

**State:** active-certified
**Architecture Version:** 53
**Prerequisite:** M44 active-certified

## Implemented

Boards collection/route recovery now treats lifecycle status as navigation authority: Active boards can open, while archived and trashed boards remain collection-only until restored. Create/duplicate and lifecycle/delete mutations refresh the relevant collection synchronously before route/state progression. Search, menus, list actions, keyboard opening, and direct inactive-route recovery are covered by dedicated M45 verification.

## Certification requirement

M45 remains pending until the complete fail-closed certification sequence passes static verification, deterministic tests, real browser/E2E verification, post-certification-state verification, historical regression, TypeScript/security/UI checks, production build, source stability, checksum/package hygiene, certified-baseline creation, PASS recording, and independent certified-artifact verification.

## Boundaries

M46 owns deployed `wm_*` Board RPC/schema capability recovery and M37-BRD-002. M47-M51 retain table/cell/Kanban/item-workspace/realtime recovery. M26 iframe compatibility remains intentionally retained. M54 remains the final production-readiness milestone.


### State-aware workflow regression governance

`verify-stage-g-m45-state-aware-workflows.mjs` independently verifies that M43 and M44 active-certified pushes execute regression-only verification instead of re-entering certification, while M45 certifies only from a pending push bound to the exact GitHub SHA. This closes the CI behavior that produced a false M43 certification failure on the certified M44 commit.


### Fail-closed finalizer simulation

`scripts/verify-stage-g-m45-finalizer-fail-closed.mjs` verifies that invalid source provenance, a required pre-certification gate failure, and source drift all reject certification without creating an M45 certified ZIP/PASS record; a pre-existing certified-artifact sentinel is preserved across the simulated failure.

## Browser collection readiness corrective (2026-09-17)

- The generic M40 shell readiness boundary is not sufficient for Board collection interaction. `#boardsMain` now publishes `data-board-collection-state` (`loading`, `error`, or `ready`) and `data-board-collection-status` (`active`, `archived`, or `trashed`).
- M45 browser scenarios wait for the Board collection to reach its explicit `ready` state before interacting, preventing final list renders from racing card/menu actions.
- Collection tab locators use `data-board-status` rather than ambiguous accessible-name matching, and menu assertions bind both `aria-expanded="true"` and a non-hidden floating menu.
- This corrective changes synchronization/observability only; it does not weaken lifecycle, routing, mutation, or authorization assertions.

## Browser corrective status — 2026-09-17

The first real browser rerun validated the inactive-route/collection-readiness scenario and exposed remaining harness defects rather than a completed certification: Board setup did not await the existing backend-preflight authority, and the M45 RPC fixture treated CORS `OPTIONS` requests as executable RPC calls. Both are corrected. Duplicate navigation no longer assumes an incidental fixture counter value and still requires exactly one duplicate RPC. The milestone remains `implementation-complete-pending-certification` until all three corrected browser scenarios and the downstream retained/local/hosted gates pass.

## M45 preserved-root listener corrective

The pending M45 source now uses explicit abortable event ownership for Boards collection/workspace handlers and releases all Board-detail-only interaction bindings when returning to the collection. This closes the same-owner `boards` ↔ `board` lifecycle gap exposed by real Playwright certification: preserved `#main` nodes may retain DOM listeners even when patching removes binding attributes. Certification remains pending until the corrected three-scenario M45 browser gate and all retained release gates pass.

## Real certification progress — 2026-09-17

The governed Mac certification run has now proven M45 deterministic verification (14 checks), all three M45 Playwright scenarios, the complete release/historical verification chain, and the production Vite build. Publication did not begin: the fail-closed transaction stopped at the atomic commit hygiene gate because this release-status record and `M45-BOARDS-COLLECTION-ROUTE-RECOVERY.md` each contained one trailing blank line at EOF. Checkpoint 10 removes those two whitespace defects without changing Board runtime behavior. State remains `implementation-complete-pending-certification` until the exact 34-path commit, local certification, push, hosted exact-SHA run, and certified artifact binding pass.

## Local certification staging-parity corrective — 2026-09-17

The Checkpoint 10 Mac transaction passed the exact 34-path commit gate and created local source commit `308f4e65e97accd1a57ce5c29517b8d49da9a795`, then passed M45 deterministic/browser verification and the retained M40-M44 browser regressions before failing closed while constructing the isolated active-certified candidate. The failure exposed a certifier-design gap: staging used generic filesystem copy semantics while the certification tree binds file bytes, entry type, and permission mode, and the finalizer had no successful staging-parity simulation or path-level mismatch diagnostics. Checkpoint 11 replaces that staging copy with an explicit byte/type/mode-preserving copier, performs certification-tree parity before state promotion, emits exact manifest differences on any later mismatch, and extends the finalizer simulation with a success-path staging case that includes an executable file and symlink. No Boards runtime behavior is changed by this corrective. M45 remains pending until local exact-commit certification, push, hosted exact-SHA certification, and hosted artifact verification pass.

## Canonical Git-mode staging corrective — 2026-09-17

The Checkpoint 11 Mac preflight failed inside the newly added staging-parity regression before any clone, commit, push, or hosted certification. Its diagnostic contract exposed the platform-sensitive assumption directly: Git archives reconstruct ordinary file rw permission bits according to extraction/platform policy, while Git itself versions only the regular-file executable bit. Treating `0644` versus `0664`, or `0755` versus `0775`, as source drift therefore bound M45 certification to ambient filesystem/umask state rather than repository identity. Checkpoint 12 derives the isolated candidate from `git archive` of the exact bound source commit and normalizes certification-tree mode identity to Git-significant modes (`100644`, `100755`, and `120000` for symlinks), while continuing to bind every included path, entry type, symlink target, and file SHA-256. The finalizer regression now creates a real temporary Git commit and proves the same exact-commit staging path. No Boards runtime behavior is changed. M45 remains pending until local exact-commit certification, push, hosted exact-SHA certification, and hosted artifact verification pass.

## Final certified baseline — 2026-09-17T08:18:58Z

The fail-closed M45 certification and artifact-publication transaction passed for source commit `556e098c51281714a88e6f899254a01117b839c7`. The packaged Boards Collection & Route Recovery state is **active-certified**. The certification-tree digest excludes only the M45 target and release-state records so the pending repository source and promoted package can be compared without self-referential state mutation.
