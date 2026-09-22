# Work Management App v1.43.2 — Stage G M49 Boards Kanban & Drag/Drop Recovery

**State:** implementation-complete-pending-certification  
**Architecture:** 57  
**Prerequisite:** M48 active-certified  
**Semantics:** `1.43.2-m49-v1`  
**Backend boundary:** retained M46/M47 schema, RPC, RLS, and ordering semantics; no M49 migration

## Scope

M49 restores and governs Kanban rendering, status lanes, item movement, structural drag/drop, failure rollback, keyboard-accessible movement alternatives, and reliable Table/Kanban switching while preserving one canonical Board state.

## Root-cause corrections

1. **Kanban status moves changed Table order:** status-lane drops previously computed an end-of-group position and therefore changed hidden Table ordering. M49 separates `status-only` movement from positioned movement so lane changes preserve group and position.
2. **View persistence could diverge:** Table/Kanban changes were optimistic fire-and-forget mutations. M49 serializes persistence and rolls a failed latest intent back to the last confirmed server view while preventing stale completions from replacing newer intent.
3. **Inactive-status items could disappear:** Kanban previously received active labels only. M49 renders referenced inactive/unavailable lanes as read-only so every canonical visible item remains represented exactly once.
4. **Kanban lacked keyboard lane movement:** editable Kanban cards now expose a focusable status-movement handle supporting Left/Right/Home/End, focus restoration, and polite announcements.
5. **Failed undo/redo could corrupt local state:** history callbacks previously mutated local snapshots before persistence without restoring them on failure. Item and structural history now restore the prior confirmed snapshot before rethrowing.
6. **Status clearing depended on an existing no-status item:** M49 keeps a governed `No status` lane available whenever the Kanban has configured lanes/items, enabling explicit status clearing.
7. **Movement uniqueness was implicit:** item movement now fails closed if duplicate canonical item IDs are detected before mutation.
8. **Overlapping mutations could stale-rollback newer state:** item and structural persistence now expose an explicit pending transaction, mutually block one another, block view switching while ordering is unresolved, and defer realtime refresh until the transaction settles.
9. **Retained M48 finalizer self-test was pending-only:** the historical self-test now derives an isolated pending fixture from an active-certified M48 source, so M49 historical regression can exercise it without mutating predecessor authority.

## Verification authority

- Static recovery verifier: `verify-stage-g-m49-boards-kanban-drag-drop-recovery.mjs`
- Deterministic verifier: `scripts/verify-boards-kanban-drag-drop-recovery-execution.mjs`
- Browser runner: `scripts/run-boards-kanban-drag-drop-recovery-browser.mjs`
- Dependency-independent Chromium/CDP authority: `scripts/run-boards-kanban-drag-drop-recovery-cdp.mjs`
- Playwright authority: `tests/modern/e2e/boards-kanban-drag-drop-recovery.spec.mjs`
- Browser fixture: `tests/modern/e2e/helpers/m49-boards-kanban-fixture.mjs`
- Retained-backend guard: `scripts/verify-stage-g-m49-production-boundary.mjs`
- State-aware workflow verifier: `verify-stage-g-m49-state-aware-workflows.mjs`
- Candidate gate: `scripts/verify-stage-g-m49-candidate.sh`
- Release gate: `scripts/verify-stage-g-m49-release.sh`
- Fail-closed finalizer: `scripts/finalize-stage-g-m49.sh`
- Artifact verifier: `scripts/verify-stage-g-m49-certified-artifact.mjs`
- Hosted workflow: `.github/workflows/boards-kanban-drag-drop-recovery.yml`

## Certification rule

Repository source remains `implementation-complete-pending-certification` until the exact-commit fail-closed transaction passes. Only the staged certified package may be promoted to `active-certified`. No PASS record or certified ZIP may be emitted if any required static, deterministic, browser, backend, historical, type/build/security, checksum, hosted, or artifact gate fails.
## Checkpoint 02 — Playwright native-drag authority corrective

The first macOS certification attempt reached the governed M49 Playwright suite after all pre-browser authorities passed and stopped before commit/push. Two test-authority defects were identified:

1. The item-movement assertion used `toContainText` against every card in the Doing lane after Alpha correctly joined Bravo, which violates Playwright strict-locator semantics. Checkpoint 02 targets the exact Alpha card instead.
2. `locator.dragTo()` did not reliably exercise this application’s delegated native HTML5 drag listeners for structural movement. Checkpoint 02 uses an explicit browser `DataTransfer` and dispatches `dragstart` → `dragenter` → `dragover` → `drop` → `dragend`, then verifies the exact move RPC payload. This tests the native event contract the product actually consumes without weakening runtime behavior or replacing pointer drag support.

No Board production source, backend contract, migration, RPC, RLS policy, or grant is changed by this corrective.


## Checkpoint 03 — Playwright strict-locator uniqueness corrective

The second macOS certification attempt again reached the governed M49 Playwright suite after all pre-browser authorities passed and stopped before commit/push. The remaining failures were both test-authority locator cardinality defects:

1. The rollback assertion queried every card in the Doing lane even though Alpha and Bravo were both canonical members of that lane. Checkpoint 03 asserts the exact Bravo card after the forced persistence failure restores its confirmed `doing` status.
2. Column headers are rendered once per Board group table, so an unscoped `[data-column-drag="col-text-2"]` selector correctly matched both Planning and Delivery. Checkpoint 03 scopes the column drag source and target to the Planning group table, and similarly scopes the subsequent Field 1 keyboard rollback handle.

No production Board source, backend contract, migration, RPC, RLS policy, or grant is changed by this corrective.

## Checkpoint 04 — Historical Boards M8 verifier synchronization

The third macOS certification attempt validated the corrected M49 Playwright authority at 4/4 scenarios, retained M48 browser authority at 4/4, M29 Database/RLS at 96 tests, TypeScript, and Stage A security. The transaction then stopped fail-closed during `verify:ui` before commit/push because the historical Boards M8 verifier required the obsolete exact source expression `eventElement(event)?.closest<HTMLElement>('[data-item-drag]')`.

M49 retains the same M8 keyboard item-reordering contract but now resolves `eventElement(event)` once into a local `target`, which is then used for both Kanban and Table drag handles. Checkpoint 04 updates only the historical M8 verifier to accept the original inline expression or this backward-compatible local-target form. The M49 static authority now explicitly requires the synchronized historical-verifier markers so the mismatch cannot silently recur.

No production Board source, backend contract, migration, RPC, RLS policy, or grant changes in this corrective.


## Checkpoint 05 — Historical v1.27 drag no-op verifier synchronization

The Checkpoint 04 governed Mac transaction passed the M49 Playwright authority 4/4 and advanced through retained Board browser gates, database/RLS, TypeScript, security, Boards M8 synchronization, and UI verification. The first genuine stop was later in `verify-v1270-domain-browser-quality.mjs`, whose drag/drop no-op check was coupled to an obsolete exact source expression. Current M49 uses a stronger `noChange` predicate that requires unchanged group/status and also validates status-only or position equality before suppressing persistence. Checkpoint 05 updates only that historical verifier contract and the M49 governance that asserts the synchronization; production Board runtime/backend semantics are unchanged.


### Checkpoint 05 proactive v1.31 synchronization

A collect-all historical audit performed after the v1.27 correction exposed one more dependency-independent verifier drift: v1.31 still required the retired `applyLocalMove` helper name even though M49 implements stronger optimistic movement through `applyBoardItemMove`, snapshot/restore rollback state, and immediate board rendering. The v1.31 authority now accepts the historical helper or the canonical transaction while preserving the positional-feedback requirement. M49 static verification explicitly guards this synchronization. No production runtime/backend code changes are introduced.

## Checkpoint 06 — Hosted CI lint and deterministic concurrency corrective

Checkpoint 05 completed local exact-commit certification and pushed M49 commit `ddfd0cf4b47442bcad49892d1ca2754f877e5d16`, but hosted certification remained fail-closed. GitHub CI identified five `no-promise-executor-return` ESLint violations in M49-only test/verifier code. The dedicated hosted M49 workflow also exposed a Linux timing race in the pending-movement concurrency scenario: the fixture released a move after a fixed 350 ms delay, allowing a slower hosted runner to settle the move before the view-switch assertion. Checkpoint 06 removes all time-based RPC delay control from the M49 Playwright fixture and replaces it with explicit held RPCs that are released only after overlap assertions complete. Promise executors are block-bodied so they do not return timer or Array#push values. Production Board runtime/backend behavior is unchanged.

Checkpoint 06 is a corrective child of published M49 candidate `ddfd0cf4b47442bcad49892d1ca2754f877e5d16`; it must not reset GitHub main to M48 or replay the original M49 publication commit. Hosted certification now requires every push-triggered workflow observed on the published M49 candidate to conclude success before the hosted M49 artifact can close the milestone.

