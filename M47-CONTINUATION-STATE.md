# Stage G M47 — Boards Table / Group / Item Recovery — Certification-Ready Checkpoint 32

Status: implementation correction complete pending final recertification. GitHub `main` is on corrective M47 commit `204977748ed3c3973bfb9105ff94a9efe1208f33`; Checkpoint 31 passed local exact-commit M47 certification and the hosted M45/M46 regressions, but the dedicated hosted M47 certification run `35511713732` stopped fail-closed inside its retained M45 create/open scenario because the captured create RPC reported `p_name` as the concatenated Board name plus description. Checkpoint 32 corrects and instruments the complete create-board transaction boundary on top of `204977748…`; production migration replay remains forbidden.

Overall M47 completion at this checkpoint: 99% implementation-corrected/certification-ready. The M47 product/runtime, 34-assertion pgTAP authority, four-scenario M47 Playwright authority, production semantic migration/attestation, local exact-commit certification, standalone hosted M45, and hosted M46 are already green for the published base. Checkpoint 32 gives the create Board name/description controls explicit deterministic identities, verifies the FormData snapshot against those live controls before command dispatch, freezes one immutable text draft, and strengthens retained M45 browser authority to prove both DOM values and the raw JSON RPC body before Board navigation/readiness. Final PASS remains pending dependency-backed candidate/release gates, exact corrective publication, hosted regressions, hosted M47 recertification, artifact verification, and final remote binding.

Current dependency-free authority: **PASS — 296 static checks**, **PASS — 50 deterministic checks**, and **PASS — 62 workflow checks**. Retained M45 static authority is **PASS — 154 checks** and now protects both the committed Board-detail readiness contract and the create-board DOM/FormData/raw-JSON transport boundary. No database migration, RPC signature, RLS grant, production data mutation, or M47 semantic migration change is required by this corrective.

## Certified base

- M46 certified commit: `ae0a92ce84a7525881dfef5e2028422e15441835`
- M46 certified source tree: `d76829760cf6cec46677bba5b38d8797b62a99ddeaa34eacf20f5088047f8130`
- M46 hosted certified ZIP SHA-256: `7ec58f2e6bca03056654413cb8eb45d052d224aa62ade8fc1c18146522242f8a`
- M46 Board contract remains `1.43.2-m46-v1` with the same 40 public RPC signatures.

## Frontend/table-state recovery completed and verified

- Board preference writes snapshot Board ID + preference payload and expose `flushPending()`.
- Boards route/list transitions and feature deactivation flush pending preference state instead of discarding the debounce timer.
- Shift-range selection consumes rendered visible group/item order and excludes collapsed groups.
- Composite item creation compensates a failed enrichment update by deleting the just-created item; rollback failure is surfaced explicitly.
- Cross-group item edits move first and compensate the move if the subsequent field update fails.
- Partial bulk mutation failures clear stale selection and reload authoritative Board state.
- Read-only cells remain keyboard-focusable with `aria-disabled` rather than native disabled controls.
- Archived/custom-sorted table rows suppress invalid reorder affordances; mouse drag also rejects archived items.
- “Show archived items” is additive: active rows remain visible while archived rows are revealed; hiding archived items returns to active-only display.

## Backend/data-integrity corrective completed in source

- Added `supabase/migrations/v1.43.2-stage-g-m47-boards-table-group-item-recovery.sql` and synchronized the authoritative schema snapshot.
- One-time normalization compacts group positions and active item positions to contiguous zero-based order.
- Board-scoped transaction advisory locking serializes ordering-sensitive group/item mutations.
- Group creation, movement, and deletion maintain contiguous positions.
- Group deletion fails closed when item file metadata remains, preventing SQL cascade from orphaning private Storage objects.
- Item creation uses a valid active configured Status default (or first active label) instead of blindly falling back to `not_started` when a custom status scheme exists.
- Same-group/cross-group movement compacts source order and inserts at a clamped target position.
- Archived items cannot be moved until restored.
- Active item duplication inserts after the source; archived item duplication creates an active copy at the active-group tail.
- Active item deletion compacts active order; archived deletion leaves active order unchanged.
- Archive compacts the active group; restore appends at the current active-group tail.
- Existing M46 public RPC signatures and contract attestation remain unchanged.

## Database verification completed at this checkpoint

A rollback-only transaction was executed on the actual production Supabase Postgres engine. The transaction temporarily installed the M47 function definitions, created synthetic rollback-only Board data, exercised the recovery semantics, checked M46 contract compatibility, and executed `ROLLBACK`.

Verified in that transaction:

- group create ordering;
- same-group and cross-group item movement;
- active-position continuity;
- custom Status default selection;
- archive compaction and restore append;
- archived-move rejection;
- archived-source duplication into active order;
- attachment-bearing group-delete rejection;
- group deletion + position compaction after attachment metadata removal;
- `wm_board_contract_attestation()->compatible = true`.

No M47 DDL, migration ledger record, or synthetic test data was persisted by that dry run.

Production read-only invariant inspection before migration found two groups with malformed active positions (`[1,2,3,3]` and `[1,1]`), proving the normalization work is required rather than theoretical. At inspection time there were zero archived items and zero attachment-bearing groups in production.

## Verification evidence

- M47 static verifier: **PASS — 275 checks; architecture 55 synchronized; 34 governed DB assertions and 4 governed browser scenarios declared**.
- M47 dependency-free deterministic verifier: **PASS — 50 checks**.
- Retained M17 TanStack Table evaluation: **PASS**.
- Retained M18 virtualization: **PASS**.
- Retained M46 deterministic Board backend contract: **PASS — 26 checks**.
- M47 database runner JavaScript syntax gate: **PASS**.
- Production-engine rollback-only semantic transaction: **PASS**.

## Added M47 database test authority

- `supabase/tests/m47/boards_table_group_item_recovery.test.sql`
- governed pgTAP plan: **34 assertions**
- `scripts/run-stage-g-m47-database-tests.mjs`

The first governed disposable Supabase/pgTAP execution reached this suite only after all four official Playwright scenarios passed, then failed before assertion #1 because the test remained in `authenticated` while directly reading private Board tables. Checkpoint 23 corrected that harness-only role mismatch without changing production grants: mutation RPC calls remain under `authenticated`; direct postcondition inspection runs only after `RESET ROLE` in the disposable owner context. Checkpoints 23 and 24 subsequently proved the complete governed database authority: **34/34 pgTAP assertions PASS**, with the M46 contract remaining compatible.


## Browser/E2E candidate completed in source

- Added dedicated M47 Playwright fixture, four-scenario browser suite, and governed browser runner.
- Added `boards-table-recovery:browser` to the milestone command surface.
- Static authority binds the runner/spec/fixture and the four required scenarios.
- JavaScript syntax/parse gates pass for all three browser files.
- The governed dependency-backed Mac execution now passes all four M47 browser scenarios. Browser work is complete; the remaining fail-closed blocker is downstream database certification.


## Architecture 55 synchronization

- `config/application-manifest.ts` now advances the global architecture version from 54 to 55.
- M47 table/group/item recovery authorities are registered in the application manifest.
- `src/types/manifest.ts` and `src/runtime-schemas/manifest.ts` expose and validate the same M47 architecture contract.
- Runtime manifest refinement fails closed for architecture 55 when any M47 authority is missing or mismatched.
- Dependency-free M47 static verification binds this synchronization.


## Production semantic attestation preflight — rollback-only

- Added `scripts/verify-stage-g-m47-production-invariants.mjs` and package command `boards-table-recovery:production`.
- Extended the existing M46 `wm_board_contract_attestation()` signature in place; no new public Board RPC was added.
- M47 attestation fields cover semantic version, group-order continuity, active-item-order continuity, eight mutation RPC security/grants, required ordering indexes, and aggregate M47 compatibility.
- The first rollback-only production execution exposed an inherited PL/pgSQL identifier collision because the new query reused catalog alias `p`; PostgreSQL raised `42702` against the M46 row variable `p`.
- Migration and schema snapshot were corrected to collision-safe aliases `m47_proc` / `m47_ns`, with a static regression guard.
- The corrected attestation extension then passed all rollback-only production assertions while preserving M46 contract version/digest, `compatible=true`, and RPC count 40.
- Post-rollback verification proves: M47 semantics were not persisted, no M47 migration-ledger row exists, and the two known malformed active-item groups remain unchanged pending governed deployment.
- Supabase advisors were captured. Board `RLS enabled / no policy` findings are expected under the certified M46 RPC-only access model; unrelated project-wide advisory findings remain outside M47 functional scope.

## Historical verifier synchronization

- Retained M46 static verification was corrected to require application architecture `>= 54` while preserving all exact M46 contract authorities, instead of incorrectly freezing the whole application at architecture 54.
- Retained M46 static: **PASS — 103 checks**.
- Retained M46 deterministic: **PASS — 26 checks**.
- Retained M17 and M18 verification: **PASS** under architecture 55.


## Fail-closed certification authority completed in source

- Added state-aware hosted M47 workflow with in-progress/PR candidate validation, pending exact-SHA certification, and active-certified regression-only behavior.
- Added candidate and release verification scripts. The release gate requires production semantic attestation and timestamped deployment provenance after all candidate gates.
- Added M47 certification-tree digest authority, certified-artifact verifier, package wrapper, and status reporter.
- Added M47 finalizer. State promotion occurs only in a staged artifact after complete release verification; the authoritative source remains pending until certification output is proven.
- Added deterministic finalizer fail-closed tests covering invalid commit binding, required-gate failure, prior-artifact preservation, source drift, staged parity, and macOS realpath handling.
- Added guarded production deployment helper that requires explicit opt-in, binds Supabase project/URL, creates the production ledger filename through Supabase CLI, dry-runs before apply, and preserves byte-identical source provenance.
- Added deployment-guard and deployment-provenance verifiers.
- Package command surface now includes workflow, candidate/release, deployment, certification, packaging, and status authorities.
- Dependency-free evidence: state-aware workflow **62 checks PASS**; finalizer fail-closed **PASS**; deployment guard **PASS**.

## Checkpoint 08 publication-contract corrective

- The first governed Checkpoint 07 Mac execution passed wrapper integrity, M47/M46 static and deterministic preflight, finalizer/deployment-guard checks, the exact M47 certification tree, and the remote M46 source-commit guard.
- It then failed closed before dependency materialization or any production write because the outer publication authority expected 41 predeployment paths while the clean M46 source commit correctly differed from the certified M46 artifact in two promoted M46 state records.
- The M47 candidate inherits `config/stage-g-m46-boards-backend-data-contract-recovery-target.ts` and `RELEASE-STATUS-v1.43.2-STAGE-G-M46-BOARDS-BACKEND-DATA-CONTRACT-RECOVERY.md` as `active-certified`; GitHub M46 source commit `ae0a92ce84a7525881dfef5e2028422e15441835` retains their pre-promotion pending state. Those two state records must therefore be published with M47 rather than discarded.
- The outer transaction now requires exactly 43 predeployment paths and 44 postdeployment paths after the single Supabase-generated M47 deployment-provenance file is added.
- Static M47 authority explicitly verifies that both carried-forward M46 state records are `active-certified`.
- No browser, pgTAP, production migration, commit, push, or hosted certification gate ran during the failed Checkpoint 07 transaction.

## Checkpoint 09 pre-execution audit correctives

- The M47 disposable database runner evidence marker was synchronized from stale `pgTAP=28` wording to the governed `pgTAP=34` suite. Static verification binds the runner marker to the 34-assertion SQL authority and rejects the old value.
- Archived table visibility was corrected from an exclusive archived-only switch to additive `Show archived items` semantics. Deterministic verification now proves active-only default visibility and active+archived visibility when enabled. This matches the UI wording and the restore lifecycle browser scenario.
- A stale narrative line in the M47 release record that still said `implementation-in-progress` was synchronized to `implementation-complete-pending-certification`.
- These changes do not alter the M46 40-RPC backend contract or the M47 43/44 publication-set boundary.

## Remaining M47 work

There is no intentionally unfinished M47 product-code workstream in this checkpoint. Remaining work is certification execution and provenance binding only.

Required final transaction:

1. Execute `RUN-M47-CERTIFICATION.sh` from the outer certification-ready checkpoint on the governed Mac environment.
2. The wrapper must verify the exact certified M46 remote base before materialization.
3. The clean clone must pass the complete M47 candidate gate before any production write: 4/4 browser scenarios, 34/34 pgTAP, TypeScript, security/UI, historical regressions, production build, and all M47/M46 deterministic/static authorities.
4. Only after candidate PASS may the guarded M47 production migration run. It must generate exactly one timestamped deployment-provenance copy, preserve byte identity with the governed migration, normalize the two known malformed active-item position groups, and return `m47_compatible=true`.
5. The transaction must rebuild checksums, enforce the exact publication set, commit once, locally certify the exact commit, perform a remote race guard, push once, and wait for exact-SHA hosted M43/M44/M45/M46/M47 success.
6. The hosted certified M47 ZIP/PASS artifact must independently verify against the exact source commit/tree before the milestone can be reported `ACTIVE-CERTIFIED / PASS`.

Current execution-environment blockers are external to the product source: this container cannot resolve npm registry packages, does not provide Docker/Supabase CLI, and the connected GitHub integration cannot create refs. These are why the final environment-dependent gates are not marked PASS here.

## Compatibility / architectural boundary

M47 preserves M46 as the backend contract authority. M47 repairs table/group/item semantics using existing RPC signatures rather than adding shadow public RPCs. Storage-object deletion remains a Storage API responsibility; group deletion is intentionally fail-closed while attachment metadata exists.

No M47 certified ZIP/PASS record exists at this checkpoint.

## Checkpoint 10 browser-fixture DTO corrective

- The governed Checkpoint 09 Mac transaction advanced through exact wrapper/project integrity, M47 143-check static verification, 21-check deterministic verification, 62-check state-aware workflow verification, finalizer/deployment-guard verification, retained M46/M17/M18 gates, exact M46 remote-base binding, exact 43-path predeployment materialization, and governed dependency/toolchain bootstrap.
- The candidate gate then stopped fail-closed at the first environment-backed gate: all four M47 Playwright scenarios failed in their shared setup because `Board main table` never rendered.
- Root cause is proven at the DTO boundary: `tests/modern/e2e/helpers/m47-boards-table-fixture.mjs` created strict Status labels without the required `description` string. `assertBoardEnvelope()` rejects that payload with `Status configuration contains an invalid label`.
- The fixture now includes `description: ''` on all Status labels. Deterministic coverage runs the real `assertBoardEnvelope()` contract, proving the corrected fixture payload passes and the prior missing-description shape fails.
- M47 deterministic authority is now 23 checks; static authority is now 145 checks.
- The failed Checkpoint 09 transaction did not reach pgTAP, production migration, commit, push, or hosted certification.
- Remaining work is to rerun the governed Mac transaction from Checkpoint 10 and continue the fail-closed sequence from the browser gate onward.

## Checkpoint 11 browser-fixture lifecycle hardening

- Added a deterministic fake-transport harness around the real `installM47BoardsTableFixture()` and executed its handled RPCs through production `mapBoardList`, `mapBoardPreferences`, `assertBoardEnvelope`, and `assertWorkspaceEnvelope` boundaries.
- The audit exposed and corrected stale-position re-sorting in fixture `wm_move_board_group`; explicit keyboard/group moves now remain at the requested array position before contiguous positions are reassigned.
- The full fixture lifecycle now passes deterministic parsing and state assertions across 23 routed RPC calls.
- `waitForBoard()` now surfaces the Board load error text from `.boards-state.error p` if the main table never renders, improving fail-closed browser evidence.
- M47 product/backend semantics remain unchanged; the corrective is isolated to browser fixture fidelity and certification diagnostics.

## Checkpoint 12 browser-contract and rapid-keyboard corrective

- The governed Checkpoint 11 Mac transaction passed wrapper/project integrity, exact M46 remote binding, exact 43-path predeployment materialization, dependency/toolchain bootstrap, M47 static/deterministic/workflow/finalizer/deployment-guard gates, then advanced into all four Playwright scenarios.
- The run stopped fail-closed at Playwright before pgTAP or any production write. The Board DTO/fixture load boundary was no longer failing.
- CRUD/menu failure was a test-authority race against optimistic inline item creation: the temporary `temp:` row rendered before the authoritative `wm_add_board_item` completion, and the late authoritative render closed the just-opened menu. The browser gate now waits for the fixture-assigned persistent `item-new-*` identity before opening the item menu.
- Selection failure was a text-concatenation assumption only: the UI correctly rendered numeric count and plural label as separate elements. The browser gate now asserts `.selection-count span` and `.selection-count strong` independently.
- Preference reload failure was a locator ambiguity only: `data-column-id="col-status"` legitimately appears on the header, data cell, and cell button. The browser gate now targets `th[data-column-id="col-status"]` for `aria-sort`.
- Virtualized keyboard failure exposed a real runtime defect: `focusLogicalGridCell()` always deferred focus through `requestAnimationFrame`, allowing rapid repeated ArrowDown events to reuse stale focus and collapse many logical moves into a few. Grid focus now performs an immediate focus handoff when the target is already rendered, with a requestAnimationFrame fallback only when necessary. The original 48-ArrowDown browser stress remains unchanged so the next Mac run proves the product correction rather than a weakened test.
- M47 static authority is now 155 checks; deterministic authority remains 38 checks. Retained M46/M17/M18 regressions remain PASS.
- Publication boundary remains 43 exact predeployment paths and 44 exact postdeployment paths; all Checkpoint 12 changes are within already-governed M47 publication paths.

## Checkpoint 13 certification-evidence governance synchronization

- A pre-run audit found the top-level continuation summary and release-status verification section still foregrounded older Checkpoint 01/08 verifier counts even though the executable Checkpoint 12 authority had advanced to 155 static checks and 38 deterministic checks.
- The current handoff/release summaries are synchronized to the current authority and are now guarded by the M47 static verifier.
- M47 static authority is now **160 checks**; deterministic authority remains **38 checks**. No product, browser-fixture, backend, RPC, migration, or publication-path semantic changed in this governance-only corrective; this statement describes Checkpoint 13 and is superseded for publication-path count by Checkpoint 14.
- The container still cannot resolve `registry.npmjs.org` (`EAI_AGAIN`), so the four-scenario Playwright gate remains unexecuted here and must run in the governed Mac environment.


## Checkpoint 14 browser-lifecycle and virtual-column corrective — 2026-09-18

- The governed Checkpoint 13 Mac run passed package integrity, M47/M46 static and deterministic authorities, workflow/finalizer/deployment guards, retained M17/M18 checks, exact M46 remote binding, publication materialization, and dependency/toolchain bootstrap, then stopped fail-closed at the M47 Playwright gate with 2/4 scenarios passing.
- CRUD failure root cause: a browser/Playwright scroll used to expose the far-right item action trigger can emit deferred duplicate `scroll` events after the trigger click. The menu controller previously interpreted every workspace scroll as post-open user movement, immediately closed the newly opened floating menu, and reset `aria-expanded` to `false`. The controller now captures the trigger's activation scroll host/position and ignores only scroll events that still report that exact position; the first real movement after opening retains the historical close-on-scroll behavior. A real Chromium regression harness proves open → duplicate deferred activation scrolls remain open → genuine later scroll closes.
- Virtualized keyboard failure root cause: `End` correctly moved the logical column window to column 21 and rendered the target, but `renderBoardViewOnly()` had already scheduled restoration of the pre-navigation horizontal geometry. That stale animation-frame restoration rolled the scroller back to its old `scrollLeft`, rematerialized the earlier virtual-column window, and moved focus to the table scroller, leaving `document.activeElement` without `data-grid-column-index`. Logical navigation now passes the intentional target `scrollLeft` into the view render so asynchronous geometry restoration preserves the newly materialized column window instead of reverting it. The exact 21-column M47 virtualization-controller vector proves the final logical column is materialized at `scrollLeft=3200`; retained M18 and historical board-popover verification remain PASS.
- Dependency-free M47 authorities remain **PASS — 160 static checks, 62 workflow checks, 38 deterministic checks**, plus finalizer fail-closed and production-deployment-guard PASS.
- The project ZIP deliberately excludes `node_modules`. This execution container cannot resolve `registry.npmjs.org`, so the complete Vite/Playwright suite cannot be rerun here without fabricating dependency evidence. Full M47 certification therefore remains fail-closed and must resume on the governed Mac environment.
- Because `assets/js/features/boards/controllers/board-menu-controller.ts` is now a genuine M47 source modification, the exact publication contract advances from **43/44** to **44 predeployment / 45 postdeployment paths**. The outer atomic wrapper is synchronized accordingly. Project checksum-entry counts remain 1220 predeployment / 1221 postdeployment because this is an already-existing tracked file, not a new project file.
- No production migration, M47 commit, GitHub push, hosted certification, certified ZIP, or PASS record is claimed by this checkpoint.


## Checkpoint 15 browser-corrective authority binding and live predeployment preflight — 2026-09-18

- Checkpoint 14's two browser root-cause corrections are now bound into the dependency-free certification authority rather than relying only on targeted Chromium evidence. Static verification explicitly requires activation-scroll discrimination in the Board menu controller and intentional `tableScrollLeft` propagation through Board rerender/focus restoration.
- Deterministic verification now executes the exact 21-dynamic-column `End` vector: virtualization starts with the final column outside the rendered window, `ensureColumnVisible(20)` publishes the intentional horizontal coordinate, and the restored window ends at logical column 21 while still containing the target column. The governed Playwright assertions remain unchanged.
- Current dependency-free M47 authorities are **PASS — 166 static checks, 62 workflow checks, 45 deterministic checks**, plus finalizer fail-closed and production-deployment-guard PASS.
- Connected production Supabase preflight remains at the healthy certified M46 boundary: M46 contract attestation is compatible (40 RPCs / 9 RLS tables), the M47 migration ledger entry and semantic attestation are absent, group ordering has zero drift, and four active-item ordering rows across two groups remain for the governed M47 normalization. No production mutation was performed by this preflight.
- The full lockfile-backed Vite/Playwright, disposable pgTAP, type/security/UI/build, guarded production migration, post-deployment verification, exact-commit commit/push, hosted certification, and certified-artifact transaction remain mandatory before `active-certified`. This container has no outbound npm registry path, no usable local proxy, and the GitHub connector cannot create a temporary branch (403), so those gates are not represented as PASS here.


## Checkpoint 16 governed-browser root-cause corrective — 2026-09-18

The governed Checkpoint 15 Mac run fully materialized dependencies/tooling and reached the official four-scenario Playwright gate. Two scenarios passed and two failed before pgTAP or any production write. The action-menu failure was traced beyond the Checkpoint 14 scroll guard: the pre-click horizontal exposure scroll also scheduled a separate Board virtualization rerender; after the click opened the menu, that already-queued rerender replaced the trigger and closed the menu. Board virtualization now defers a queued rerender while the action menu is active and flushes it through an explicit menu-close lifecycle callback.

The virtualized keyboard scenario progressed past the previously fixed 21-column `End` assertion but lost DOM focus while crossing the vertical virtual-row window during the unchanged 48-`ArrowDown` stress. Keyboard navigation now carries an explicit logical focus target (item/group/row/column and horizontal restoration coordinate) across viewport-driven rerenders, reasserts row/column materialization while that navigation is settling, and restores the same logical cell after the rerender instead of allowing the transient viewport update to move focus to the table scroller. User-driven scrolling outside that short keyboard-settling window retains the existing scroller-focus safety behavior.

The original four-scenario Playwright specification remains unchanged. Dependency-free authority is strengthened to **176 static / 50 deterministic / 62 workflow checks**, including the exact 180-row / 48-ArrowDown controller vector. Full governed Playwright, pgTAP, historical, production-deployment, commit/push, hosted certification, and final artifact gates still must pass before M47 may become `active-certified`.


## Checkpoint 17 teardown-lifecycle hardening — 2026-09-18

A post-package source audit of Checkpoint 16 found that the newly introduced pending-grid-focus/deferred-menu-render teardown reset had been duplicated on the Boards-list transition while feature deactivation still lacked the reset. This was corrected before governed certification: the duplicate block was removed, and deactivation now cancels the pending focus-clear frame and clears pending logical focus plus deferred menu-render state before closing overlays/controllers. Static authority now requires exactly two teardown reset boundaries. Current dependency-free authority is **176 static / 50 deterministic / 62 workflow checks PASS**. Checkpoint 16 is superseded and must not be used for certification.


## Checkpoint 18 viewport-measured keyboard-focus settling — 2026-09-18

Checkpoint 17's pending logical-grid focus was still released after a fixed two-animation-frame window. That duration is not a reliable lifecycle boundary under slower rendering or delayed viewport callbacks. The focus authority is now released only after an actual Board virtualization viewport measurement reports stable row/column windows and `document.activeElement` resolves to the requested logical item/row/column. Changed windows rerender first and retain the target; the subsequent stable measurement releases it. Explicit pointer, wheel, and touch intent can release stale keyboard focus authority, and the existing two route teardown boundaries still clear all pending state. The unchanged governed Playwright scenario remains authoritative. Current dependency-free authority is **183 static / 50 deterministic / 62 workflow checks PASS**.


## Checkpoint 19 certification-handoff governance synchronization — 2026-09-18

- A final Checkpoint 18 source audit found no additional product-code defect that can be justified without the official governed browser/database transaction. The action-menu virtualization deferral and viewport-measured logical keyboard-focus authority remain the current implementation.
- The Checkpoint 18 continuation header and completion figure were stale (`Checkpoint 17` / `96%`) despite the package already carrying the Checkpoint 18 implementation and 183/50/62 dependency-free authorities. Checkpoint 19 synchronizes the handoff metadata so a new conversation cannot resume from an incorrect checkpoint identity or completion state.
- Static authority now includes explicit handoff-governance assertions for the Checkpoint 19 identity and 99% implementation-complete/certification-ready state. Current dependency-free authorities are **PASS — 185 static checks, 50 deterministic checks, 62 workflow checks**, plus finalizer fail-closed and production-deployment-guard PASS.
- No product runtime, Playwright assertion, backend RPC, migration semantic, M46 contract, publication path, or database behavior changed in this governance-only checkpoint. The remaining work is terminal-executed fail-closed certification.


## Checkpoint 20 interaction-transaction corrective — 2026-09-18

- Governed Checkpoint 19 Playwright evidence proved two residual runtime ownership gaps: the item action menu could still be detached by full Board data/realtime renders outside the virtualization scheduler, and stable virtual windows could retain a pending logical focus target without actively restoring DOM focus after a replacement.
- Board rendering now treats an active action menu as an interaction transaction: both full `renderBoardData()` and view-only `renderBoardViewOnly()` defer before replacing Board DOM, and menu close flushes the full render first when both full and virtualization-only work are pending.
- Grid focus convergence now actively re-focuses the pending logical cell when row/column windows are stable but DOM focus disagrees; if the target cell is unexpectedly absent, one governed virtual materialization pass is requested.
- Rapid Arrow/Home/End sequences are preserved across transient cell detachment by a capture-phase document keydown fallback that advances from the pending logical coordinate only while no live Board grid cell owns focus. Generic full/view Board rerenders also capture and restore an active logical grid coordinate.
- The unchanged four-scenario Playwright specification remains the authoritative browser gate. M47 remains `implementation-complete-pending-certification` until the complete governed transaction passes.


## Checkpoint 21 synchronized-peer-scroll menu corrective — 2026-09-18

The governed Checkpoint 20 Playwright run materially narrowed M47 to one remaining browser failure: selection, preference flush, and virtualized keyboard navigation all passed, while the CRUD scenario opened the `Echo` item-menu trigger successfully but `Edit item` disappeared before Playwright could locate it. The remaining root cause is the Board's synchronized horizontal scrolling across group tables. When Playwright scrolls the originating table to expose the far-right item action trigger, the Board scroll synchronizer applies the same `scrollLeft` to peer group tables. Those delayed peer `scroll` events can arrive after the menu is open; the floating-menu controller previously treated any peer scroller as unrelated movement and closed the menu.

The menu controller now recognizes only same-position `.board-table-scroll` peer synchronization as part of the original activation scroll transaction. Duplicate activation-host events and synchronized peer-table events keep the menu open and request repositioning; the first genuinely different scroll position still closes the menu. This is scoped to Board table scrollers and does not weaken close-on-real-scroll semantics. A real Chromium harness using the exact transpiled production menu controller proves: menu open + `Edit item` present -> peer table synchronized to the activation `scrollLeft` leaves the menu active -> later different peer scroll closes the menu.

The official four-scenario Playwright specification remains unchanged. Current dependency-free authority is **202 static / 50 deterministic / 62 workflow checks PASS**, with finalizer/deployment guards, retained M17/M18, retained M46 static/deterministic, and high-confidence secret scan PASS. No backend RPC, migration semantic, publication-path count, or production state changed. The complete governed Mac transaction remains required before M47 may transition from `implementation-complete-pending-certification` to `active-certified`.

## Checkpoint 22 exact CRUD item-title locator corrective — 2026-09-18

The governed Checkpoint 21 Playwright run confirmed that all previously identified product-runtime defects are resolved: item menu open/activation progressed through Edit item, save, and cross-group move; selection and preference-flush scenarios passed; and virtualized keyboard navigation passed. The sole remaining failure was a Playwright strict-mode ambiguity after the successful move because `getByRole('button', { name:'Echo Updated', exact:false })` matched the item title plus seven other controls whose accessible names contain the item name. Checkpoint 22 changes only that validation locator to `exact:true`, which is stricter and uniquely targets the intended item-title button. The static authority explicitly requires the exact locator and forbids the ambiguous substring form. No product runtime, backend RPC, migration, or fixture semantic changed. Current dependency-free authority is **PASS — 204 checks**, with **PASS — 50 checks** deterministic and **62 workflow checks PASS**. M47 remains `implementation-complete-pending-certification` until the complete governed transaction passes.


## Checkpoint 25 historical browser integration fixture synchronization — 2026-09-19

The governed Checkpoint 24 candidate again passes the official M47 browser authority (**4/4**) and the M47 database authority (**34/34 pgTAP**). It also proves the Checkpoint 24 v1.23 lifecycle synchronization works: `verify-v1230-architecture-phase2.mjs` and the remainder of the static historical verifier chain pass. The first new fail-closed stop occurs only when the legacy generic browser integration suite executes its Board keyboard-reorder fixture.

Root cause is fixture drift rather than a product regression. `tests/browser/run-cdp.mjs` modeled item reorder handles as orphan `<span data-item-drag>` nodes with no containing `[data-item-id]` row. M47 intentionally requires keyboard reordering to originate from a real Board item row whose `draggable` attribute is `true`, because archived/custom-sort/non-reorderable rows must not accept manual reorder commands. The production drag/drop controller therefore correctly ignored the legacy fixture's ArrowDown event.

Checkpoint 25 updates the historical browser fixture to mirror the production DOM contract: each item drag handle is inside a `.board-item-row[data-item-id]` with `draggable="true"`. The existing ArrowDown reorder assertion remains intact. A second negative assertion then flips the first row to `draggable="false"`, sends ArrowUp, and requires both local order and command count to remain unchanged. This verifies the M47 suppression contract rather than weakening it.

A targeted real-Chromium execution using the exact production `drag-drop-controller.ts` passes both vectors: the valid draggable row moves from position 0 to 1 and emits exactly one `moveItem` command; the same row marked non-draggable ignores the subsequent keyboard reorder attempt. No product runtime, backend RPC, migration, RLS/grant, official M47 Playwright scenario, or pgTAP semantic changed.

Because `tests/browser/run-cdp.mjs` is now an intentional M47 corrective source file, the exact publication contract advances to **46 predeployment / 47 postdeployment paths**. Current dependency-free authority is **226 static / 50 deterministic / 62 workflow checks PASS**. The complete governed Mac transaction must be rerun before M47 can transition to `active-certified`.


## Checkpoint 26 production migration ledger synchronization — 2026-09-19

The governed Checkpoint 25 run passes the complete M47 candidate gate, including official Playwright, 34/34 pgTAP, type/security/UI, full historical verification, generic browser integration, and production build. Supabase CLI authentication succeeds, but the guarded production dry-run stops because production correctly records M46 migration version `20260917142647` while the M47 isolated deployment workdir contained only the newly generated M47 migration. Supabase compares timestamped local migration files against the remote migration ledger, so this incomplete local history is rejected before any production write.

Checkpoint 26 corrects the deployment harness at its source. `deploy-stage-g-m47-production-recovery.sh` now binds the exact certified M46 provenance file `supabase/deployments/m46/20260917142647_stage_g_m46_boards_backend_data_contract_recovery.sql`, proves it is byte-identical to the authoritative M46 semantic migration, copies that timestamped file into the isolated migration workdir before staging M47, and fails closed unless the isolated workdir contains exactly the M46 baseline plus one M47 migration. The harness does not use `supabase migration repair`; the production migration history is already correct and must not be mutated to hide a local packaging omission. The deterministic deployment-guard fixture now proves missing/drifted M46 provenance fails and that both dry-run/apply see the certified baseline. No Board runtime, M47 SQL semantics, RPC signatures, RLS/grants, official Playwright scenario, pgTAP assertion, or production database state changed. Current dependency-free authority is **231 static / 50 deterministic / 62 workflow checks PASS**.


## Checkpoint 27 M44 hosted browser runtime-boundary synchronization — 2026-09-19

- The governed Checkpoint 26 Mac run passed M47 4/4 Playwright, M47 34/34 pgTAP, M46 production contract, M45, M38, and M40 retained gates, then failed closed in the first M44 browser scenario at `management-authority-consolidation.spec.mjs:44` because a host readiness check and host-token dereference were split across separate browser evaluations. The second M44 Users-authorization scenario passed.
- The shared M39 browser helper already documents and regression-tests this exact hosted failure mode: a main-document/runtime replacement can occur between a readiness probe and later value consumption. `retryM39RuntimeBoundary()` retries only replacement/unavailable-authority conditions and requires the authoritative value to be validated within the same evaluation.
- M44 now uses that certified boundary for management-route readiness, feature-owner capture, persistent-host token assignment/verification, presentation-readiness inspection, and Users authorization. It no longer uses `page.waitForFunction()` followed by a second value read.
- The persistent-host contract is not weakened: the token is assigned only after lifecycle owner/route and host/main visibility are coherent, and every repeated Account/Settings/Users cycle requires the same token inside the atomic route probe. A genuine remount fails with `management-host-token-mismatch`.
- M44 static authority is **PASS — 108 checks**. The M39 hosted runtime-boundary regression is **PASS — 6 vectors** with `splitReadinessConsumption=false` and `documentReplacementRetry=true`. M47 static authority is **PASS — 241 checks**; deterministic authority is **PASS — 50 checks**; workflow authority is **PASS — 62 checks**; finalizer fail-closed and production-deployment guard are PASS.
- `tests/modern/e2e/management-authority-consolidation.spec.mjs` and `verify-stage-g-m44-management-authority-consolidation.mjs` are now governed M47 corrective sources. The exact publication contract advances to **48 predeployment / 49 postdeployment paths**. No Board runtime, M47 migration semantic, RPC signature, RLS/grant, official M47 Playwright scenario, or pgTAP assertion changed.
- This container could not complete `npm ci` and therefore does not claim the dependency-backed M44 Playwright gate as PASS. The next governed Mac transaction must execute that exact browser gate and all remaining fail-closed certification stages.

## Checkpoint 28 post-deployment publication resume hardening — 2026-09-20

- The governed Checkpoint 27 transaction passed the corrected M44 browser authority (2/2), the complete M47 candidate gate, the guarded production dry-run, the production apply, semantic attestation, deployment-provenance verification, and the complete post-deployment release gate.
- Production now records exact migration `20260919165239_stage_g_m47_boards_table_group_item_recovery.sql`; GitHub `main` remains on certified M46 commit `ae0a92ce84a7525881dfef5e2028422e15441835` because publication stopped before commit.
- The first post-deployment failure was `git diff --check` on three Markdown hard-break lines in the M47 release-status file. Those trailing spaces are removed and static authority now rejects any trailing horizontal whitespace in that release-status authority.
- Current dependency-free M47 authorities are **PASS — 250 static checks / 50 deterministic checks / 62 workflow checks**; M44 static/deterministic and the M39 runtime-boundary authority remain retained regression gates.
- The exact applied M47 timestamped provenance file is now part of the continuation source. The production helper is resume-only: it requires byte-identical M46 and M47 provenance, live M47 semantic attestation, and exactly one governed M47 provenance file; compatible production skips replay. If live semantics drift, the helper fails closed and explicitly forbids migration replay, `migration repair`, or destructive reset.
- Checkpoint 28 originally expected the next governed transaction to start from certified M46 GitHub source. That assumption was superseded when GitHub `main` advanced to the published M47 commit; Checkpoint 29 now binds the corrective transaction to that exact published M47 base instead of replaying the original publication.


## Checkpoint 29 hosted historical-regression synchronization — 2026-09-20

The first governed Checkpoint 28 terminal attempt stopped before candidate execution because its outer remote-base guard still expected certified M46, while GitHub `main` had already advanced to direct M47 descendant `8daeb2679d19fd4c41dc9cd13b625542c5f854ee` (`Implement M47 Boards table group item recovery`). Independent remote inspection proves that commit already contains the Checkpoint 28 post-deployment resume implementation. Its dedicated M47 workflow succeeded and produced the SHA-bound certified artifact, while M43/M44/M45 hosted regressions also succeeded.

The same push exposed three historical synchronization defects that must be corrected before final M47 binding. First, the retained M45 and M46 finalizer fail-closed self-tests copied the live `active-certified` target/release records into their isolated fixtures, causing the actual pending-only finalizers to exit before the simulated failure vectors could run. Checkpoint 29 now converts only those isolated fixtures back to `implementation-complete-pending-certification` and strips the historical final-certified marker; the real M45/M46 finalizers remain unchanged and pending-only. Second, the global M29 Database/RLS structural suite still assumed every public SECURITY DEFINER used `search_path=public` and that anon could execute none. The certified M46 Board contract intentionally hardens `work_board_realtime_topic_access(text)`, `work_board_realtime_broadcast_change()`, and `wm_board_contract_attestation()` with `search_path=""`, and intentionally grants only the safe aggregate attestation to anon/authenticated runtime roles. The structural test now encodes those exact three exceptions without broadening any other SECURITY DEFINER privilege or search-path allowance.

The M47 candidate gate now explicitly runs the retained M45 state-aware workflow/finalizer self-test, the retained M46 finalizer self-test, and the disposable global Database/RLS suite. The corrective publication contract is a small delta on top of already-published M47 rather than a replay of the original M47 publication. Production M47 migration replay, migration repair, rollback, and reset remain forbidden.


## Checkpoint 30 Board-detail data-commit readiness corrective — 2026-09-20

The exact corrective commit `522a32e01639fe6a385a9e5ffe84cd3fda0fd996` passed local M47 certification, global CI, dedicated M45 hosted regression, and dedicated hosted M47 certification/artifact publication. The atomic transaction still stopped because hosted M46 run `35504341378` invokes retained M45 browser coverage and one create/open scenario reached the Board workspace shell before the newly created Board payload/title had committed. The dedicated M45 workflow passing on the same commit proves this was a synchronization race rather than an M46 contract failure.

Checkpoint 30 fixes the runtime boundary rather than extending timeouts or rerunning blindly. `renderBoardData()` now publishes `data-board-detail-state` across loading/error/not-found/ready states, clears stale identity outside ready state, and publishes `data-board-detail-id` only after header, controls, view, selection, item-panel, accessibility, geometry, virtualization scheduling, and history-control rendering have committed. The retained M45 Playwright helper waits for `ready`, the exact routed Board ID, and a visible workspace shell before using spinner absence as a secondary guard. M45 and M47 static authorities fail closed if this contract regresses.

No production migration replay, schema change, RPC change, RLS/grant change, fixture mutation semantics, or M47 database behavior changes in Checkpoint 30. Remaining work is dependency-backed browser/release verification of this exact corrective source, exact corrective commit/push on top of `522a32e…`, hosted M46 historical regression success, hosted M47 recertification/artifact verification, and final active-certified binding.


## Checkpoint 31 committed Board-payload readiness corrective — 2026-09-20

Checkpoint 30 proved that a synchronous `data-board-detail-state="ready"` marker was still insufficient under the retained M46 hosted sequence: hosted run `35506818269` reached the exact `board-created-1` workspace and returned from the Checkpoint 30 readiness helper, yet the expected `M45 Created Board` heading was absent. The same source continued to pass dedicated/local M45 and M47 browser authority, isolating a timing-sensitive presentation-commit ordering defect rather than an M46 backend/data-contract regression.

Checkpoint 31 moves the readiness publication behind an animation-frame commit verifier in `assets/js/boards-ui.ts`. Before `ready` can be emitted, the verifier proves that the current connected `#boardMain` belongs to the React Board presentation host in `workspace` mode, the route Board ID equals the authoritative envelope Board ID, the envelope Board name equals the expected committed name, the workspace is visible, the header host carries the same id/name/revision commit metadata, and `#board-workspace-title` contains the exact expected Board name. A stale or incomplete render remains `committing`; recovery is bounded to two source-level rerender attempts rather than arbitrary sleeps, timeout inflation, or unbounded polling.

The retained M45 browser helper now waits for exact `data-board-detail-id`, `data-board-detail-name`, committed header id/name metadata, and the rendered title before returning readiness. It also proves the create RPC payload carried `M45 Created Board` before the detail assertion, so a future failure can distinguish transport/input corruption from presentation-commit ordering. No SQL, migration, RPC, RLS/grant, production data, or Board contract semantic changes are introduced.

## Checkpoint 32 create-board transaction-boundary corrective — 2026-09-20

Hosted M47 run `35511713732` proved that the Checkpoint 31 committed-readiness fix advanced the certification chain: the standalone M45 workflow and hosted M46 workflow both passed, and the dedicated M47 browser suite passed 4/4 before the retained M45 scenario failed. The new failure occurred earlier than Board-detail readiness: the fixture observed `p_name = "M45 Created BoardCreated through M45 collection recovery"` instead of the expected separate name and description fields. This is a create-transaction observability/determinism defect, not a database, migration, RLS, or Board-detail readiness failure.

Checkpoint 32 hardens the complete create transaction without timeout inflation or blind retries. The Create Board dialog now publishes explicit `data-board-create-name` and `data-board-create-description` controls with stable IDs/labels. On submit, the UI compares FormData text values against those live controls and fails closed if they diverge, then freezes one immutable `{ name, description }` draft before command dispatch. The retained M45 browser scenario targets those exact controls, proves their accessible names and exact values immediately before submission, then proves the intercepted request is `application/json`, parses the raw request body, and verifies `p_name`, `p_description`, and `p_columns` independently before any Board-detail readiness assertion. The M45 fixture now parses raw request JSON directly and retains both `rawBody` and `contentType` for diagnostics.

This correction preserves the existing Board command/repository/Supabase JSON serialization contract and does not infer or rewrite user content. No M47 production migration replay, SQL semantic change, RPC signature change, RLS/grant change, or database contract change is introduced.
