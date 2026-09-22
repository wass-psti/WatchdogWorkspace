# M49 Continuation State — Boards Kanban & Drag/Drop Recovery

**Milestone:** 49  
**Checkpoint:** M49 Certification-Ready Checkpoint 05  
**Stage:** G  
**Current source state:** implementation-complete-pending-certification  
**Prerequisite:** M48 active-certified  
**M48 certified commit:** `c094bd3cc645e604ba6490a87831709cb9fac84b`  
**M48 certified source tree:** `63171a59fd51a7f7791be329f32ae2d2c9a46aee6d76d8d4a78f1840754d0b02`  
**M49 architecture:** 57  
**M49 semantics:** `1.43.2-m49-v1`

## Implemented recovery

1. Kanban status-only moves preserve canonical group and Table position.
2. Referenced inactive/unavailable statuses retain read-only lanes so canonical items never disappear from Kanban.
3. A persistent `No status` lane remains available as a valid status-clearing target.
4. Kanban cards expose keyboard lane movement using Left/Right/Home/End with focus restoration and live announcements.
5. Item and structural undo/redo callbacks restore their rollback snapshot if persistence fails.
6. Table/Kanban switching is governed by a serialized controller with last-confirmed rollback and stale-request protection.
7. Realtime Board refresh is deferred while a view persistence transaction is pending.
8. Duplicate canonical Board item identifiers fail closed during movement rather than silently corrupting local ordering.
9. Item and structural persistence transactions mutually block, view switching is blocked while movement is unresolved, and realtime refresh defers until movement/view transactions settle.
10. The retained M48 finalizer self-test now synthesizes a pending fixture from active-certified M48 source so predecessor governance remains executable after certification.

## Backend / compatibility boundary

- No M49 migration, RPC, RLS, or grant change is required or introduced.
- Existing `wm_move_board_item`, `wm_move_board_group`, `wm_move_board_column`, and `wm_set_board_view` remain the persistence authority.
- M19's product-owned/native drag architecture is retained; M49 hardens semantics and accessibility rather than replacing the drag library boundary.

## Verification state

Dependency-independent static/deterministic/workflow/production-boundary gates are authoritative in the continuation checkpoint. Checkpoint 01 reached the real Playwright authority on macOS after governed dependency/toolchain materialization; two browser-authority defects were isolated before any commit or push: (1) a strict-mode assertion targeted the entire Doing lane after it correctly contained both Alpha and Bravo, and (2) Playwright `locator.dragTo()` did not reliably exercise the delegated native HTML5 drag contract for structural movement. Checkpoint 02 reached the corrected Playwright authority but exposed two remaining strict-locator defects before any commit or push: (1) the rollback assertion still addressed every card in the Doing lane after Alpha and Bravo were both legitimately present, and (2) the column drag handle selector addressed the duplicated per-group column header in both Planning and Delivery tables. Checkpoint 03 resolves only those authority defects by asserting the exact Bravo card and scoping column drag source/target handles to the Planning group table. Production Board runtime/backend behavior remains unchanged. Dependency-backed TypeScript, build, the corrected Playwright authority, exact-commit certification, post-certification regression, hosted workflows, and artifact verification remain fail-closed until executed in the governed environment. Checkpoint 03 subsequently passed the corrected M49 Playwright authority 4/4, retained M48 browser authority 4/4, M29 Database/RLS 96 tests, TypeScript, and Stage A security, then stopped fail-closed in `verify:ui` at the historical Boards M8 verifier because it required the obsolete exact inline expression `eventElement(event)?.closest<HTMLElement>('[data-item-drag]')`. Current M49 preserves the M8 keyboard item-reorder semantics but resolves `eventElement(event)` into a local `target` first so the same delegated keydown listener can also handle Kanban movement. Checkpoint 04 synchronizes that historical verifier to accept either the original inline form or the backward-compatible local-target form and binds the synchronization into the M49 static authority. No production Board runtime/backend behavior changes in Checkpoint 04.


## Checkpoint 05 — Historical v1.27 drag no-op verifier synchronization

Checkpoint 04 passed the corrected M49 Playwright authority 4/4, retained M48/M47 browser authorities, M29 Database/RLS 96 tests, TypeScript, security, the synchronized Boards M8 verifier, and the `verify:ui` chain. It then stopped fail-closed later in the collect-all historical verifier pass at `verify-v1270-domain-browser-quality.mjs`. That verifier required the obsolete exact source pair `String(groupId) === String(item.group_id)` plus `String(status) === String(item.status)`. M49 preserves and strengthens the same no-op contract with a single `noChange` predicate that also accounts for status-only mode and position equality. Checkpoint 05 synchronizes the v1.27 verifier to accept either the historical pair or the stronger transactional predicate and binds that compatibility authority into the M49 static verifier. No production runtime/backend behavior changes in this checkpoint.


The Checkpoint 05 collect-all historical audit was intentionally run after the v1.27 correction. It identified one additional dependency-independent source-contract drift that would otherwise become the next Mac failure: `verify-v1310-board-interaction-engine.mjs` still required the retired helper name `applyLocalMove`. M49 preserves the original optimistic drag/reorder behavior through the canonical `applyBoardItemMove` + snapshot/restore transaction with immediate `renderBoard()` feedback. Checkpoint 05 therefore synchronizes v1.31 to accept either the historical helper or the canonical transactional implementation and binds that authority into M49 static verification. All other collect-all failures in the container were missing-dependency failures (`zod`, `@tanstack/react-query`, or `zustand`), not source-contract assertions; the governed Mac certification materializes those dependencies before historical verification.

## Checkpoint 06 — Hosted CI lint and deterministic concurrency corrective

Checkpoint 05 completed local exact-commit certification and pushed M49 commit `ddfd0cf4b47442bcad49892d1ca2754f877e5d16`, but hosted certification remained fail-closed. GitHub CI identified five `no-promise-executor-return` ESLint violations in M49-only test/verifier code. The dedicated hosted M49 workflow also exposed a Linux timing race in the pending-movement concurrency scenario: the fixture released a move after a fixed 350 ms delay, allowing a slower hosted runner to settle the move before the view-switch assertion. Checkpoint 06 removes all time-based RPC delay control from the M49 Playwright fixture and replaces it with explicit held RPCs that are released only after overlap assertions complete. Promise executors are block-bodied so they do not return timer or Array#push values. Production Board runtime/backend behavior is unchanged.

Checkpoint 06 is a corrective child of published M49 candidate `ddfd0cf4b47442bcad49892d1ca2754f877e5d16`; it must not reset GitHub main to M48 or replay the original M49 publication commit. Hosted certification now requires every push-triggered workflow observed on the published M49 candidate to conclude success before the hosted M49 artifact can close the milestone.

## Checkpoint 07 — Hosted M40 lint escape prevention corrective

Checkpoint 06 completed the full local M49 candidate and exact-commit certification gates and published commit `ece7eec19928d7994fbdf2d1e7c2f6df8eaf88f0`. The subsequent hosted M40 Route Lifecycle Recovery workflow failed only at repository-wide ESLint because one remaining M49 deterministic verifier timer promise still used an expression-bodied executor (`new Promise(resolve=>setTimeout(resolve,0))`). Route lifecycle static verification, deterministic tests, browser validation, and TypeScript had already passed in that hosted workflow.

Checkpoint 07 corrects the remaining executor to a block body and, critically, moves `npm run lint:eslint` into the M49 candidate gate before browser/E2E work. The M49 static verifier now requires that lint gate and requires it to precede the expensive M49 browser authority, preventing this class of defect from escaping local candidate verification and surfacing only after push. No production Board runtime, backend contract, migration, RPC, RLS policy, grant, or application architecture behavior changes in this checkpoint.

After this corrective implementation is locally verified, M49 implementation is complete. The remaining work is certification execution against a direct-child corrective commit of `ece7eec19928d7994fbdf2d1e7c2f6df8eaf88f0`, including the complete hosted workflow set and hosted artifact verification.

