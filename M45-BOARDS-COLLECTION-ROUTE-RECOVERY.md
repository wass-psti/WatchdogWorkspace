# M45 — Boards Collection & Route Recovery

M45 restores the Boards collection workflow across Active, Archive, and Trash and makes lifecycle state authoritative for navigation. The React Board presentation facade remains the route presentation owner; `assets/js/boards-ui.ts` owns the collection interaction surface, while `board-data-controller.ts` and `board-repository.ts` remain the data orchestration and server-state authorities.

## Recovered behavior

- Active, Archive, and Trash views load through lifecycle-specific query keys.
- Search filters by board name and description.
- Active cards are mouse/keyboard openable; archived/trashed cards are collection-only until restored.
- Direct archived/trashed board routes are redirected back to their matching collection before workspace editing can activate.
- Create and duplicate refresh the Active collection before opening the resulting board.
- Archive, trash, restore, and permanent delete await collection refresh before UI progression completes.
- Menus expose lifecycle-appropriate actions and suppress empty inactive viewer menus.
- Detail editing/management permissions require an active board as a defense-in-depth lifecycle guard.

## Regression authority

M37-BRD-001 is resolved by the combination of M40 owner/readiness recovery and M45 lifecycle-safe collection routing. M37-BRD-002 remains open for M46 because deployed `wm_*` RPC/schema capability is a separate backend contract.

## Certification

Certification is fail-closed: static verification, deterministic execution, real browser/E2E collection workflows, post-state verification, complete historical regression, TypeScript/security/UI gates, production build, source-tree stability, checksum/package hygiene, certified baseline creation, PASS record, and independent artifact verification must all pass before M45 can be marked active-certified.


### State-aware workflow regression governance

`verify-stage-g-m45-state-aware-workflows.mjs` independently verifies that M43 and M44 active-certified pushes execute regression-only verification instead of re-entering certification, while M45 certifies only from a pending push bound to the exact GitHub SHA. This closes the CI behavior that produced a false M43 certification failure on the certified M44 commit.


### Fail-closed finalizer simulation

`scripts/verify-stage-g-m45-finalizer-fail-closed.mjs` verifies that invalid source provenance, a required pre-certification gate failure, and source drift all reject certification without creating an M45 certified ZIP/PASS record; a pre-existing certified-artifact sentinel is preserved across the simulated failure.

## Browser collection readiness corrective (2026-09-17)

- The generic M40 shell readiness boundary is not sufficient for Board collection interaction. `#boardsMain` now publishes `data-board-collection-state` (`loading`, `error`, or `ready`) and `data-board-collection-status` (`active`, `archived`, or `trashed`).
- M45 browser scenarios wait for the Board collection to reach its explicit `ready` state before interacting, preventing final list renders from racing card/menu actions.
- Collection tab locators use `data-board-status` rather than ambiguous accessible-name matching, and menu assertions bind both `aria-expanded="true"` and a non-hidden floating menu.
- This corrective changes synchronization/observability only; it does not weaken lifecycle, routing, mutation, or authorization assertions.

## Browser certification corrective — 2026-09-17

Real Playwright execution exposed two test-environment ordering defects after the collection-readiness recovery. The M45 fixture now handles cross-origin `OPTIONS` requests as CORS preflight without recording or executing Board RPC mutations, and the browser setup explicitly waits for the authoritative `boards` backend-preflight state before the final M40 shell-stability and M45 collection-readiness gates. Duplicate navigation is validated against the server-returned Board identifier shape while the suite still requires exactly one duplicate RPC, so the test does not depend on incidental fixture counter sequencing or mask duplicate submission. M45 remains pending until the corrected three-scenario browser suite and the complete retained release/certification chain pass.

## Preserved-root interaction ownership corrective

M45 explicitly owns Boards collection/detail event lifecycles because both routes share the `boards` feature owner and the shell intentionally preserves the route `#main` element across presentation patches. Attribute-only binding guards are insufficient on a preserved element: attributes are synchronized/replaced while JavaScript listeners remain attached. M45 therefore uses abortable list/detail event bindings, releases the opposite route binding before every collection/workspace presentation swap, and tears down Board-detail-only resize, drag/drop, structure-drag, column-resize, inline-edit, selection, history, and virtualization state before rendering the collection. Browser evidence must prove one mutation RPC per user action and a menu that remains open after list/detail round trips.

## Real browser and release-gate evidence — 2026-09-17

The Checkpoint 09 certification transaction on the governed macOS/Node 22.16.0 environment passed the M45 deterministic verification (14 checks), the complete three-scenario Playwright suite (3/3), retained release verification, historical project verification, and the production Vite build. The transaction then stopped fail-closed before commit/push because `git diff --cached --check` detected one trailing blank line at EOF in this M45 record and the M45 release-status record. Checkpoint 10 removes only those whitespace defects and records the proven gate evidence; no Board runtime behavior is changed. M45 remains pending until the exact 34-path commit, local exact-commit certification, hosted exact-SHA certification, and certified artifact verification complete.

## Local certification staging-parity corrective — 2026-09-17

The Checkpoint 10 Mac transaction passed the exact 34-path commit gate and created local source commit `308f4e65e97accd1a57ce5c29517b8d49da9a795`, then passed M45 deterministic/browser verification and the retained M40-M44 browser regressions before failing closed while constructing the isolated active-certified candidate. The failure exposed a certifier-design gap: staging used generic filesystem copy semantics while the certification tree binds file bytes, entry type, and permission mode, and the finalizer had no successful staging-parity simulation or path-level mismatch diagnostics. Checkpoint 11 replaces that staging copy with an explicit byte/type/mode-preserving copier, performs certification-tree parity before state promotion, emits exact manifest differences on any later mismatch, and extends the finalizer simulation with a success-path staging case that includes an executable file and symlink. No Boards runtime behavior is changed by this corrective. M45 remains pending until local exact-commit certification, push, hosted exact-SHA certification, and hosted artifact verification pass.

## Canonical Git-mode staging corrective — 2026-09-17

The Checkpoint 11 Mac preflight failed inside the newly added staging-parity regression before any clone, commit, push, or hosted certification. Its diagnostic contract exposed the platform-sensitive assumption directly: Git archives reconstruct ordinary file rw permission bits according to extraction/platform policy, while Git itself versions only the regular-file executable bit. Treating `0644` versus `0664`, or `0755` versus `0775`, as source drift therefore bound M45 certification to ambient filesystem/umask state rather than repository identity. Checkpoint 12 derives the isolated candidate from `git archive` of the exact bound source commit and normalizes certification-tree mode identity to Git-significant modes (`100644`, `100755`, and `120000` for symlinks), while continuing to bind every included path, entry type, symlink target, and file SHA-256. The finalizer regression now creates a real temporary Git commit and proves the same exact-commit staging path. No Boards runtime behavior is changed. M45 remains pending until local exact-commit certification, push, hosted exact-SHA certification, and hosted artifact verification pass.

## Certification corrective — macOS realpath-stable tree CLI (2026-09-17)

Checkpoint 13 closes the remaining Mac-only certification-harness defect discovered by the
Checkpoint 12 transaction. Node resolves an ESM entrypoint to its canonical filesystem path,
while macOS temporary directories may be addressed through `/var/folders/...` even though the
canonical path is `/private/var/folders/...`. The prior certification-tree CLI compared those
paths lexically, misclassified direct execution as an import, emitted no digest, and caused the
isolated active-certified candidate to fail after valid source/stage parity.

The certification-tree CLI now compares real paths for both the invoked script and module URL.
The fail-closed verifier includes an aliased-path regression that reproduces this canonicalization
boundary and requires the aliased CLI to emit exactly the same 64-hex digest as direct execution.
No Boards runtime behavior, route semantics, RBAC behavior, or persistence contract changed.
