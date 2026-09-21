# Release Status — Work Management App v1.43.2 — Stage G M47

**Milestone:** M47 — Boards Table / Group / Item Recovery
**State:** active-certified
**Architecture:** 55
**Prerequisite:** M46 active-certified

## Implementation complete — certification pending

- Board preference writes snapshot Board identity/state and flush on route exit or feature deactivation.
- Shift-range selection follows visible rendered group/item ordering and excludes collapsed groups.
- Composite item creation compensates a failed enrichment update; rollback failure is surfaced explicitly.
- Cross-group edit+move compensates movement if the subsequent item update fails.
- Partial bulk item mutations clear stale selection and force authoritative Board reload reconciliation.
- Read-only cells remain keyboard-focusable with `aria-disabled`; archived/custom-sorted rows suppress invalid reorder affordances.
- Board drag/drop rejects archived items independently of presentation affordances.
- M47 backend recovery migration normalizes existing group/active-item order and serializes group/item ordering mutations with Board-scoped advisory locks.
- Archive/restore, move, duplicate, and delete semantics preserve contiguous active positions; archived rows never participate in active ordering.
- Group deletion compacts remaining groups and fails closed while attachment metadata exists, preventing SQL-cascade orphaning of private Storage objects.
- Existing M46 40-RPC signatures and live contract attestation remain unchanged.

## Verification state

- Current M47 static verifier: **PASS (296 checks)** with architecture 55, 34 governed pgTAP assertions, and four governed browser scenarios bound.
- Current dependency-free M47 deterministic verifier: **PASS (50 checks)**, including strict DTO fixture validation and full routed browser-fixture lifecycle execution through production mappers.
- M47 backend SQL: transactionally dry-run against the production Supabase engine with full rollback; semantic sequence PASS and M46 attestation remained compatible.
- Dedicated M47 pgTAP behavioral suite: **PASS — 34/34 assertions** in the governed disposable local Supabase stack.
- Retained M17 table evaluation, M18 virtualization, and M46 static/deterministic regressions remain PASS under architecture 55.
- Official four-scenario M47 Playwright authority: **PASS — 4/4 scenarios** in the governed Mac candidate runs.

The Checkpoint 32 corrective source is not yet certified. Published commit `204977748ed3c3973bfb9105ff94a9efe1208f33` has a valid local exact-commit M47 PASS; standalone hosted M45 and hosted M46 are green. Dedicated hosted M47 run `35511713732` reached its retained M45 create/open regression after the M47 browser/database authorities passed, then stopped fail-closed because the intercepted create RPC reported a concatenated `p_name`. Checkpoint 32 must complete exact publication, all hosted regressions, hosted M47 recertification, artifact verification, and final remote binding before it becomes the authoritative certified baseline.

## Browser validation candidate — 2026-09-18

- Dedicated M47 browser/E2E suite is implemented with four governed scenarios: full group/item lifecycle, rendered-order range selection plus bulk movement, immediate preference flush/reload persistence, and row/column virtualization keyboard navigation.
- The browser runner is registered as `boards-table-recovery:browser` and bound into the M47 static authority.
- This source remains `implementation-complete-pending-certification` until the dependency-backed browser/database/type/build and production certification transaction executes successfully in a governed environment.

## Architecture governance corrective — 2026-09-18

- Global architecture manifest synchronized to architecture 55.
- Manifest type/runtime-schema authorities now bind the M47 table/group/item recovery contract and fail closed when its target, migration, database test, browser suite, or route-safe preference persistence authority drifts.

## Production semantic-attestation corrective — 2026-09-18

- M47 extends the existing M46 attestation in place with semantic ordering/security/index fields while preserving the M46 contract version, digest, and 40-RPC surface.
- First rollback-only production execution correctly failed closed on PostgreSQL `42702` because catalog alias `p` collided with the inherited M46 PL/pgSQL variable `p`. The M47 query now uses `m47_proc` / `m47_ns`, and static verification rejects recurrence.
- Corrected rollback-only production attestation passed; post-rollback state proves no M47 semantic field or migration-ledger record persisted and the two pre-existing malformed active-item groups remain unchanged until governed deployment.
- M47 pgTAP authority now declares 34 assertions, including semantic-attestation coverage.
- Retained M46 verification is synchronized for later architecture versions and passes without weakening M46 contract checks.

## Certification transaction authority — 2026-09-18

- Added state-aware hosted workflow, candidate/release gates, deployment provenance, certification-tree digest, exact-commit artifact verification, staged state promotion, packaging, and fail-closed finalizer tests.
- Finalizer and deployment guard deterministic harnesses pass. No final certified artifact has been created because dependency-backed browser/database/type/build and governed production deployment remain required.

## Outer certification publication-set corrective — 2026-09-18

- The first Checkpoint 07 governed Mac transaction passed integrity/static/deterministic/fail-closed preflight and the remote M46 source-commit guard, then stopped at the exact publication-set check before dependency/browser/database execution and before any production write.
- Root cause: the 41-path authority compared M47 against the pre-promotion M46 source commit but omitted the two M46 state records promoted only inside the certified M46 artifact. The M47 package correctly carries those records forward as `active-certified`.
- The transaction now governs 43 exact predeployment paths and 44 exact postdeployment paths, explicitly including the M46 target and release-status promotion records.
- Static M47 verification binds both M46 carried-forward state records to `active-certified`, preventing regression of the certified prerequisite during M47 publication.

## Certification evidence count synchronization corrective — 2026-09-18

Checkpoint 08 pre-execution audit found that the M47 disposable database runner still printed the historical `pgTAP=28` PASS marker even though the authoritative M47 suite declares and executes 34 assertions. The runner now reports `pgTAP=34`, and static verification binds the runner evidence marker to `select plan(34)` while rejecting recurrence of the stale 28-assertion marker. This corrective changes certification evidence only; database behavior, RPC signatures, migration semantics, and the 43/44 publication contract are unchanged. M47 remains implementation-complete-pending-certification until the governed transaction completes.

## Archived visibility semantics corrective — 2026-09-18

Checkpoint 08 pre-execution browser audit found a mismatch between the UI contract and selector behavior: the command is labeled `Show archived items` / `Hide archived items`, but the selector previously used an exclusive archived-state comparison that hid all active items when archived visibility was enabled. The selector now keeps active items visible and additively includes archived rows only when `showArchived=true`. Deterministic coverage proves the default active-only state and the additive active+archived state, matching the restore lifecycle browser scenario. Reordering remains disabled while archived rows are shown, preserving active ordering safety.

## Browser fixture strict-status-schema corrective — 2026-09-18

The first governed Checkpoint 09 candidate execution reached the dedicated M47 Playwright gate after integrity, dependency/toolchain, static/deterministic, workflow, finalizer, deployment-guard, M46, M17, M18, remote-base, and exact 43-path materialization gates passed. All four M47 browser scenarios then failed at the common `waitForBoard()` setup because the fixture Status labels omitted the required string `description` field. Production `assertBoardEnvelope()` therefore rejected the fixture payload with the strict status-schema error `Status configuration contains an invalid label`, leaving the Board workspace shell present but preventing `Board main table` from rendering. The fixture now supplies `description: ''` for every governed Status label. Deterministic verification executes the real DTO boundary and proves the corrected payload passes while the historical missing-description payload fails closed. No production migration, commit, push, or hosted certification occurred during the failed Checkpoint 09 run.

## Browser fixture group-order and lifecycle-contract corrective — 2026-09-18

Checkpoint 10 post-corrective audit executed the real M47 browser RPC fixture through the production Board DTO mappers across list/load/preferences, group CRUD/reorder, item create/update/move/duplicate/archive/restore/delete, item-workspace, and cell persistence. This exposed a second fixture-only defect before rerunning Playwright: `wm_move_board_group` spliced the group into the requested array position, then `groupNormalize()` sorted by the stale numeric positions and silently restored the old order. Group normalization now preserves the already-authoritative array order and only rewrites contiguous position values. Deterministic verification permanently exercises the complete fixture lifecycle, and browser setup now reports the actual `.boards-state.error` message when table rendering fails instead of four opaque missing-region errors. No production behavior, M46 RPC signature, or M47 migration semantic changed.

## Checkpoint 12 browser-contract and rapid-keyboard corrective — 2026-09-18

- The governed Checkpoint 11 Mac run reached all four M47 Playwright scenarios after exact package integrity, dependency/toolchain bootstrap, M47/M46 static and deterministic gates, workflow/finalizer/deployment guards, and remote-base/materialization checks passed. It stopped fail-closed at Playwright before pgTAP or any production write.
- CRUD menu failure was traced to the optimistic `temp:` item row being rendered before the fixture-assigned persistent item identity. The browser authority now waits for the authoritative `item-new-*` identity before opening the item menu.
- Selection failure was a DOM text-concatenation assumption only; count and plural label are now asserted independently.
- Preference reload failure was locator ambiguity only; the sort assertion now targets the Status `<th>` specifically.
- Virtualized keyboard failure exposed a real runtime defect: every logical grid focus transfer was deferred to `requestAnimationFrame`, so rapid repeated ArrowDown inputs reused stale focus and collapsed many logical moves. `focusLogicalGridCell()` now focuses an already-rendered target synchronously and uses animation-frame fallback only when the target is not yet rendered. The original 48-ArrowDown browser stress remains unchanged.
- M47 static authority is now 160 checks and deterministic authority is 38 checks. That 43/44 publication boundary was the Checkpoint 12 authority and is superseded by Checkpoint 14 because the menu-controller corrective adds one governed source path.

## Checkpoint 13 certification-evidence governance synchronization — 2026-09-18

The certification-ready handoff summaries are synchronized to the executable current authority: M47 static verification is **160 checks** and dependency-free deterministic verification is **38 checks**. The static verifier now fails if either the continuation handoff or release-status summary regresses to stale counts. This corrective is governance/documentation only and does not alter product behavior, backend semantics, or the M46 40-RPC contract. Its 43/44 publication-boundary statement is superseded by Checkpoint 14.


## Checkpoint 14 browser-lifecycle and virtual-column corrective — 2026-09-18

Checkpoint 13 governed Playwright execution passed two scenarios and failed two before pgTAP or any production write. The item-menu failure was caused by deferred duplicate scroll events generated while the browser exposed the action trigger: the floating-menu controller closed a just-opened menu even though the scroll position had not changed since activation. The controller now ignores only activation-position scroll events and still closes on the first genuine subsequent movement; a real Chromium regression harness passes this exact sequence.

The virtualized `End` failure was caused by stale geometry restoration, not by the logical-column calculation. Column 21 was correctly materialized, but the prior `scrollLeft` captured before re-render was restored on the next animation frame, reverting the column window and focus. `renderBoardViewOnly()` now accepts the intentional logical-navigation horizontal position and restores that value, so the target virtual column remains materialized and focusable. The exact 21-column controller vector passes, and retained M18 plus historical Board popover verification remain PASS.

M47 remains **implementation-complete-pending-certification**. Current dependency-free authorities remain **160 static / 38 deterministic / 62 workflow checks PASS** with fail-closed finalizer and production-deployment guard PASS. The complete governed Vite/Playwright rerun remains required on the Mac because this container cannot resolve npm registry dependencies and the source checkpoint intentionally contains no `node_modules`. The publication contract is now **44 predeployment / 45 postdeployment paths**, adding the modified `assets/js/features/boards/controllers/board-menu-controller.ts` path. No production migration, source commit, push, hosted certification, certified baseline, or PASS record is claimed here.


## Checkpoint 15 browser-corrective authority binding and production preflight — 2026-09-18

The Checkpoint 14 runtime corrections are now enforced by the dependency-free M47 certification authority. Static verification binds the action-menu activation-scroll guard and the virtualized horizontal-restoration propagation, while deterministic verification executes the exact 21-column `End` navigation vector and requires the final logical column to remain materialized after restoration. The original Playwright scenario and assertions are unchanged. Current authorities are **166 static / 45 deterministic / 62 workflow checks PASS**, with finalizer and deployment-guard regressions PASS.

A read-only connected Supabase predeployment inspection confirms production is still cleanly at the certified M46 boundary: the M46 contract attestation is compatible with 40 RPCs and 9 RLS tables, no M47 migration or M47 semantic-attestation field is present, group order has zero drift, and four active-item position drifts across two groups remain for M47's governed normalization. No production schema/data mutation was performed. Full fail-closed candidate execution, guarded M47 deployment, post-deployment release verification, source publication, hosted certification, and certified baseline generation remain required before this milestone may transition from `implementation-complete-pending-certification` to `active-certified`.


## Checkpoint 16 governed-browser root-cause corrective — 2026-09-18

Checkpoint 15 executed the official dependency-backed M47 Playwright suite: selection and preference-flush scenarios passed; item-menu and vertical virtual-row keyboard scenarios failed closed before pgTAP or any production write. The item-menu defect was caused by an already-queued Board virtualization rerender from the trigger-exposure scroll, independent of the floating-menu controller's deferred-scroll guard. Virtualization rendering is now deferred while the Board menu is active and flushed from the menu's explicit active-close callback.

The keyboard scenario now reaches the vertical row-window transition. A viewport-driven rerender could previously unmount the just-focused logical row during the same keyboard navigation settling cycle and move focus to the scroller. M47 now tracks the in-flight logical grid target across that short cycle, keeps its row/column materialized, rerenders, and restores the exact logical cell. The unchanged Playwright stress still requires 48 sequential `ArrowDown` moves and visible logical row 48. Static/deterministic authority is **183 / 50 checks** respectively; workflow authority remains **62 checks**. M47 remains `implementation-complete-pending-certification` until the complete governed transaction passes.


## Checkpoint 17 teardown-lifecycle hardening — 2026-09-18

Checkpoint 16 was superseded after a final lifecycle audit found duplicate pending-focus/deferred-render cleanup on the Boards-list transition and missing cleanup in `deactivate()`. M47 now has exactly two governed teardown reset boundaries: Boards-list transition and feature deactivation. Both cancel the pending focus-clear frame and clear pending logical focus plus deferred menu-render state before controller disposal. Static authority is **183 checks**; deterministic/workflow authorities remain **50 / 62 checks**. No Playwright assertion or backend semantic was changed.


## Checkpoint 18 viewport-measured keyboard-focus settling — 2026-09-18

The pending logical keyboard target no longer expires after an arbitrary two-frame delay. `armPendingGridFocus()` now schedules an explicit viewport synchronization; M47 retains the target across any row/column-window change, rerenders and restores the exact cell, and clears the target only when a subsequent stable measurement confirms that the active DOM cell matches the requested item, group, logical row, and logical column. Pointer/wheel/touch intent releases stale keyboard authority so user-driven navigation is not snapped back. This hardening does not modify the four-scenario Playwright specification or backend semantics. Current dependency-free authority is **183 static / 50 deterministic / 62 workflow checks PASS**.


## Checkpoint 19 certification-handoff governance synchronization — 2026-09-18

The Checkpoint 18 product implementation remains unchanged after a final source audit. Checkpoint 19 corrects stale handoff identity/completion metadata and binds those values into static authority so continuation cannot regress to an older checkpoint description. Current dependency-free authority is **185 static / 50 deterministic / 62 workflow checks PASS**. No runtime behavior, Playwright assertion, backend RPC, migration semantic, M46 contract, database state, or publication-path count changed. M47 remains `implementation-complete-pending-certification`; the remaining work is the complete governed terminal certification transaction.


## Checkpoint 20 interaction-transaction corrective — 2026-09-18

The Checkpoint 19 governed browser run exposed two remaining interaction-ownership defects rather than test or dependency failures. Full Board data/realtime renders could replace the Board trigger while an action menu was open even though virtualization renders were already deferred; and stable virtualization state could leave `pendingGridFocus` armed without actively restoring a detached logical cell. Checkpoint 20 makes active-menu rendering transactional across both full and view-only render entry points, prioritizes the deferred full render on menu close, actively converges stable logical focus, preserves rapid grid keys across transient DOM replacement, and restores active logical grid focus across generic Board rerenders. The four governed Playwright assertions are unchanged. Current dependency-free authority is provisionally bound at **199 static / 50 deterministic / 62 workflow checks PASS** pending full checkpoint verification.


## Checkpoint 21 synchronized-peer-scroll menu corrective — 2026-09-18

The Checkpoint 20 governed browser run now passes three of four M47 scenarios, including the previously failing 48-ArrowDown virtualization case. The sole remaining CRUD-menu failure was traced to delayed programmatic horizontal-scroll synchronization between peer group tables after the originating item action trigger opens. The menu controller now treats same-position peer `.board-table-scroll` events as part of the activation scroll transaction while preserving closure on any genuinely changed scroll position. Real Chromium verification against the exact production controller passes this sequence. The governed Playwright spec is unchanged. Current dependency-free authority is **202 static / 50 deterministic / 62 workflow checks PASS** pending the complete Mac rerun.

## Checkpoint 22 exact CRUD item-title locator corrective — 2026-09-18

The governed Checkpoint 21 browser run reached the post-edit validation after successfully opening the item menu, activating Edit item, renaming `Echo` to `Echo Updated`, moving it to Delivery, saving, and closing the dialog. The only failure was Playwright strict-mode ambiguity because the validation used `exact:false` and therefore matched eight Delivery buttons containing `Echo Updated`. Checkpoint 22 changes that assertion to an exact accessible-name match, which is stricter and targets only the intended `.item-inline-title` control. Product runtime code, the Board menu controller, virtualization code, backend contracts, fixture semantics, and migration semantics are unchanged. Current dependency-free authority is **204 static / 50 deterministic / 62 workflow checks PASS** pending the complete governed rerun.


## Checkpoint 23 pgTAP privilege-boundary corrective — 2026-09-19

The Checkpoint 22 governed run passes all four official M47 Playwright scenarios and then advances into the disposable Supabase pgTAP gate. That database suite failed before assertion #1 because the test itself stayed under `authenticated` while performing direct reads from private `work_board_groups` / `work_board_items` tables. Those direct grants are intentionally revoked by the certified M46 RPC-only security model, so granting table access would weaken the production contract. Checkpoint 23 instead separates roles inside the test transaction: all governed mutation RPCs execute as `authenticated` with the synthetic user JWT claim, while direct white-box postcondition inspection executes only after `RESET ROLE` as the disposable local database owner. No production grant, RLS policy, RPC signature, migration semantic, application runtime, browser fixture, or Playwright assertion changed. Static authority now enforces the boundary and rejects direct private-table reads or grant weakening under `authenticated`. Current dependency-free authority is **214 static / 50 deterministic / 62 workflow checks PASS**; all four governed browser scenarios are already PASS. The complete 34-assertion disposable database rerun remains the next fail-closed gate.


## Checkpoint 24 historical lifecycle verifier synchronization — 2026-09-19

The governed Checkpoint 23 candidate passes the entire M47 browser authority (**4/4**) and the corrected disposable M47 database authority (**34/34 pgTAP**), then stops fail-closed during `verify:historical-all` at `verify-v1230-architecture-phase2.mjs` with `Boards lifecycle cleanup incomplete`. The failing historical assertion still required `preferencePersistence.cancel()` in Boards `deactivate()`, but M47 intentionally replaced cancellation with `flushPending()` so a debounced, board-bound preference write survives immediate route/deactivation. Checkpoint 24 updates the historical verifier rather than regressing runtime semantics: Architecture 55+ now requires flush-on-deactivate, older architecture snapshots retain the legacy cancel expectation, and all cleanup checks are scoped to the actual `deactivate()` body. The synchronization verifier is included in the exact publication contract. Runtime Board code, official Playwright coverage, M47 pgTAP assertions, production SQL, M46 RPC signatures, RLS/grants, and semantic attestation remain unchanged. Current dependency-free authority is **220 static / 50 deterministic / 62 workflow checks PASS**.


## Checkpoint 25 historical browser integration fixture synchronization — 2026-09-19

The governed Checkpoint 24 candidate passes the official M47 Playwright authority (**4/4**), the M47 disposable database authority (**34/34 pgTAP**), the synchronized v1.23 historical lifecycle verifier, and all later static historical verifiers. The next fail-closed boundary is the generic historical browser integration suite, where its legacy item-keyboard fixture reports `ArrowDown reorders a focused Board item within its group`.

This is a stale fixture contract, not a production drag/drop regression. The M47 drag/drop controller intentionally accepts keyboard reorder only from a `[data-item-drag]` handle contained by an actual `[data-item-id]` row with `draggable="true"`. That condition is required to suppress invalid manual reorder for archived/custom-sort/non-reorderable rows. The historical fixture used two orphan drag-handle spans, so the controller correctly ignored them.

Checkpoint 25 synchronizes `tests/browser/run-cdp.mjs` with the production Board row contract while preserving the original ArrowDown reorder assertion. It additionally marks the same row non-draggable and proves a subsequent ArrowUp is ignored without emitting another move command. Targeted real Chromium using the exact production controller passes both the positive reorder and negative suppression vectors. No runtime Board implementation, official M47 Playwright scenario, backend RPC, migration semantic, RLS/grant, or pgTAP assertion changed.

The generic browser fixture is now a governed M47 publication source, advancing the exact publication contract to **46 predeployment / 47 postdeployment paths**. Current dependency-free authority is **226 static / 50 deterministic / 62 workflow checks PASS**. M47 remains `implementation-complete-pending-certification` until the complete governed transaction passes production deployment, exact commit/push, hosted exact-SHA certification, and certified-artifact verification.


## Checkpoint 26 production migration ledger synchronization

Checkpoint 25 proved the full pre-production candidate gate PASS, then the isolated Supabase production dry-run rejected the local migration history because the workdir omitted the already-applied certified M46 ledger migration `20260917142647`. Checkpoint 26 fixes the deployment harness rather than touching production history: it validates M46 semantic/provenance byte identity, seeds the exact timestamped M46 migration into the isolated workdir, requires exactly M46 + M47 before `db push`, and statically/deterministically rejects any `migration repair` workaround. No product runtime or M47 database semantics changed. Current M47 static verifier: **PASS (231 checks)**; deterministic verifier remains **PASS (50 checks)**; workflow authority remains **PASS (62 checks)**.


## Checkpoint 27 M44 hosted browser runtime-boundary synchronization

The governed Checkpoint 26 run kept the M47 4/4 browser and 34/34 pgTAP authorities green and progressed through retained M46/M45/M38/M40 gates before failing closed in M44 browser scenario `@m44-single-authority`. The failure occurred because M44 waited for management readiness in one browser evaluation and dereferenced the management host in a later evaluation; the shared M39 fixture explicitly identifies that split readiness/value pattern as a hosted main-document TOCTOU race. Checkpoint 27 synchronizes the M44 browser authority with `retryM39RuntimeBoundary()` so lifecycle state, runtime identity, host visibility, ownership, host-token continuity, presentation readiness, and Users authorization are consumed atomically. A genuine management-host replacement remains a failure through the persistent token mismatch guard. M44 static verification is **PASS (108 checks)** and the M39 runtime-boundary regression is **PASS (6 vectors)**. Current M47 authority is **PASS (241 static / 50 deterministic / 62 workflow checks)**. The M44 browser test and its static verifier join the exact M47 publication set, advancing it to **48 predeployment / 49 postdeployment paths**. Product Board runtime, M47 SQL/RPC/RLS semantics, official M47 Playwright assertions, and pgTAP semantics are unchanged.

## Checkpoint 28 post-deployment publication resume hardening

The governed Checkpoint 27 transaction passes the corrected M44 browser authority (**2/2**), the complete M47 candidate gate, production migration dry-run/apply, live M47 semantic attestation, timestamped deployment-provenance verification, and the complete post-deployment release gate. Production now carries migration `20260919165239_stage_g_m47_boards_table_group_item_recovery.sql`, while GitHub `main` remains on certified M46 because the next atomic publication gate stopped on three trailing-space Markdown hard breaks in this release-status file before commit or push.

Checkpoint 28 removes that publication-hygiene defect and treats the current state as a post-deployment resume, not a fresh migration attempt. The exact applied timestamped M47 provenance is now packaged as a governed source file and must remain byte-identical to the semantic migration. The production helper is resume-only: when live M47 invariants pass it records an explicit replay skip; if live semantics do not attest, it fails closed and cannot call `db push`, create a second migration, run `migration repair`, or reset production. Static authority also rejects trailing whitespace in this release-status file so the atomic commit gate cannot regress for the same reason.

Current M47 static verifier: **PASS (269 checks)**; deterministic authority remains **PASS (50 checks)** and workflow authority remains **PASS (62 checks)**. The official M47 browser authority remains **PASS — 4/4**, the M47 pgTAP authority remains **PASS — 34/34**, and the retained M44 browser authority is **PASS — 2/2** from the governed Checkpoint 27 transaction. The remaining work is exact publication commit, local exact-commit certification, push, hosted exact-SHA regressions/certification, certified-artifact verification, and final `ACTIVE-CERTIFIED / PASS` binding.


## Checkpoint 29 hosted historical-regression synchronization

GitHub `main` is already on M47 commit `8daeb2679d19fd4c41dc9cd13b625542c5f854ee`; production is already on exact M47 migration `20260919165239_stage_g_m47_boards_table_group_item_recovery.sql`; the dedicated M47 hosted workflow for that SHA succeeded and produced its SHA-bound certified artifact. The remaining hosted failures are retained historical-test synchronization defects rather than Board runtime or production migration defects.

Checkpoint 29 corrects the M45/M46 finalizer self-tests so each isolated fixture explicitly models the pending source state required by its unchanged pending-only finalizer, instead of copying the live active-certified historical target into the fixture. It also synchronizes the global M29 Database/RLS structural suite to the certified M46 security contract: only `wm_board_contract_attestation()` is exempted from the anon SECURITY DEFINER prohibition, and only the two governed Board Realtime functions plus the Board attestation may use the exact empty `search_path`; every other public SECURITY DEFINER must continue pinning `search_path=public`.

The M47 candidate now runs these retained finalizer and global Database/RLS regressions locally before any corrective publication. Current M47 static authority is **269 checks**; deterministic authority remains **50 checks** and workflow authority remains **62 checks**. No Board runtime, M47 RPC, M47 migration semantic, RLS grant, official M47 Playwright scenario, or M47 pgTAP assertion changes in this corrective.


## Checkpoint 30 Board-detail data-commit readiness corrective

The corrective publication at `522a32e01639fe6a385a9e5ffe84cd3fda0fd996` passed local exact-commit M47 certification, global CI, dedicated M45 hosted verification, and dedicated hosted M47 certification/artifact upload. The remaining fail-closed stop came from hosted M46 run `35504341378`, whose retained M45 create/open browser scenario observed the new Board route and workspace shell before the created Board payload/title had committed. The same M45 suite passed in its dedicated workflow on the same SHA, isolating the problem to readiness synchronization rather than backend contract semantics.

Checkpoint 30 adds an explicit Board-detail data-commit runtime contract in `assets/js/boards-ui.ts`: loading, error, not-found, and ready states are published on `#boardMain`; stale Board identity is cleared outside ready state; and `data-board-detail-id` plus `ready` are written only after the complete Board workspace render has committed. The retained M45 Playwright helper now waits for that exact ready identity and visible workspace shell before asserting Board content, eliminating spinner disappearance as the primary readiness boundary. M45 static authority and M47 corrective authority both lock this behavior against regression.

No production migration, M47 SQL semantic, Board RPC signature, RLS/grant, or production contract change is introduced. Current M47 static authority is **275 checks**; deterministic authority remains **50 checks** and workflow authority remains **62 checks**. The new corrective source remains `implementation-complete-pending-certification` until the full fail-closed publication and hosted regression/certification transaction passes.


## Checkpoint 31 committed Board-payload readiness corrective

Hosted M46 run `35506818269` demonstrated that the Checkpoint 30 synchronous readiness marker could still be observed before the expected Board title existed, even though the route host, exact Board ID, workspace shell, and `ready` state were present. This proves the remaining defect is a presentation-commit ordering race, not an M46 database contract failure.

Checkpoint 31 introduces a bounded animation-frame commit verifier. The Board detail remains in `committing` until the current connected React Board presentation host owns the expected route ID, the authoritative Board envelope has the expected ID/name, the workspace is visible, the header commit metadata carries the same ID/name/revision, and `#board-workspace-title` renders the exact Board name. Only then are `data-board-detail-id`, `data-board-detail-name`, `data-board-detail-commit-revision`, and `data-board-detail-state="ready"` published. If the route/render boundary changes before that proof, the source performs at most two controlled rerender recovery attempts; no arbitrary delays or timeout extensions are used.

The retained M45 Playwright helper now waits for the committed Board name and header identity in addition to the route ID, and validates the rendered title before returning readiness. The create scenario also asserts that `wm_create_board_configured` received the intended Board name before navigation. No production migration replay, SQL semantic change, RPC signature change, RLS/grant change, or M47 database contract change is part of this corrective. Current static authority is **285 M47 checks** and **144 M45 checks**; deterministic/workflow authority remains **50 / 62** respectively.


## Checkpoint 32 create-board transaction-boundary corrective

The Checkpoint 31 commit `204977748ed3c3973bfb9105ff94a9efe1208f33` resolved the previous hosted M46 Board-detail readiness blocker: standalone hosted M45 and hosted M46 both passed. Dedicated hosted M47 run `35511713732` then exposed a narrower retained-M45 create-transaction anomaly after the primary M47 browser suite had already passed 4/4. The captured `wm_create_board_configured` request reported `p_name` as the Board name concatenated with the description, so the certification correctly stopped before hosted artifact publication.

Checkpoint 32 hardens the create transaction at every observable boundary. The create dialog uses deterministic name/description control identities and explicit label associations. Submit handling compares the FormData snapshot with the live controls, fails closed on any divergence, and freezes a single immutable name/description draft before dispatch. Retained M45 Playwright authority now proves exact DOM values before submit, verifies JSON content type, parses the raw intercepted request body, and independently verifies `p_name`, `p_description`, and empty configured columns. The fixture parses raw JSON directly and retains raw body/content type for failure diagnostics. This removes ambiguity between browser interaction, FormData serialization, command dispatch, and request decoding without weakening the functional assertion or adding timing sleeps.

No production migration replay, M47 SQL semantic, public Board RPC signature, RLS/grant, or production data change is introduced. Current static authority is **296 M47 checks** and **154 M45 checks**; deterministic/workflow authority remains **50 / 62** respectively.

## Final certified baseline — 2026-09-20T14:33:04Z

The fail-closed M47 certification passed for source commit `076233918b885e71834dd2b5814c26397bdaaed5`. The packaged Boards Table / Group / Item Recovery state is **active-certified**. The retained backend contract is `1.43.2-m46-v1` / `2e5db3073f702cad96be3eb1d4a18b33ea039252ad4d0532dc9b6e1b3ca0da1c`; M47 semantic attestation is `1.43.2-m47-v1`. Browser, disposable pgTAP, production ordering/security/index attestation, historical regressions, build, and package hygiene passed before promotion.
