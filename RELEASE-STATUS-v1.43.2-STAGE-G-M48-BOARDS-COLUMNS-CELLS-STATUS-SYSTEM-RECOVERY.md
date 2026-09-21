# Work Management App v1.43.2 — Stage G M48 Boards Columns, Cells & Status System Recovery

**State:** implementation-complete-pending-certification
**Architecture:** 56
**Prerequisite:** M47 active-certified
**Backend boundary:** retained M46/M47 schema, RPC, RLS, and production semantics; no M48 migration

## Scope

M48 restores and governs the complete typed Board column/cell/status interaction layer on top of the certified M47 table/group/item and M46 backend contract. The milestone covers column add/configure/rename/reorder/resize/duplicate/type-change/delete lifecycle, Text/Status/Person/Date/Dropdown/Numeric cell editing, typed filtering and deterministic sorting, status-label lifecycle management, preference cleanup, and consistent save/cancel behavior.

## Root-cause corrections

1. **Typed filter identity:** Status and Dropdown filters previously reused generic substring matching. This could match adjacent values such as `Low` and `Low priority`. M48 uses exact persisted-value identity for typed choices while retaining case-insensitive substring matching for free-text filters.
2. **Descending null placement:** The previous comparator applied descending inversion after the null-order branch, moving empty values to the top for descending sorts. M48 handles null placement before direction inversion so empty values stay last in both directions.
3. **Pointer-cancel resize semantics:** Pointer cancellation previously shared the commit path with pointer-up, so an interrupted drag could persist a width the user never committed. M48 splits commit/cancel paths and restores the starting width on cancellation.
4. **Inline cancel focus restoration:** Inline editing replaces the original cell/column control node. Focusing that detached node after cancel was unreliable. M48 captures a stable control identity and focuses the newly rendered replacement after restoring markup.
5. **Dropdown lifecycle validation:** Dropdown options are now normalized and validated client-side against the retained server contract: 1–50 options, non-empty, case-insensitively unique, at most 80 characters each, with deterministic defaults for new Dropdown columns/type changes.
6. **Status lifecycle validity:** The draft editor now prevents deactivating or deleting the final active status label instead of deferring the invalid state until server/config serialization.
7. **Historical M47 verifier synchronization:** M47 runtime authority remains architecture 55, but its retained static and isolated finalizer self-test now accept later architecture descendants and synthesize a pending test fixture from the active-certified M47 source. This preserves the M47 gate under architecture 56 without changing M47 product behavior.

## Verification authority

- Static recovery verifier: `verify-stage-g-m48-boards-columns-cells-status-system-recovery.mjs`
- Deterministic verifier: `scripts/verify-boards-columns-cells-status-recovery-execution.mjs`
- Browser runner: `scripts/run-boards-columns-cells-status-recovery-browser.mjs`
- Playwright authority: `tests/modern/e2e/boards-columns-cells-status-recovery.spec.mjs`
- Deterministic/browser fixture: `tests/modern/e2e/helpers/m48-boards-columns-fixture.mjs`
- Retained-backend guard: `scripts/verify-stage-g-m48-production-boundary.mjs`
- State-aware workflow verifier: `verify-stage-g-m48-state-aware-workflows.mjs`
- Candidate gate: `scripts/verify-stage-g-m48-candidate.sh`
- Release gate: `scripts/verify-stage-g-m48-release.sh`
- Fail-closed finalizer: `scripts/finalize-stage-g-m48.sh`
- Artifact verifier: `scripts/verify-stage-g-m48-certified-artifact.mjs`
- Hosted workflow: `.github/workflows/boards-columns-cells-status-system-recovery.yml`

## Current certification-ready verification

- M48 static recovery authority: **PASS (336 checks)**.
- M48 deterministic recovery authority: **PASS (71 checks)**.
- M48 state-aware workflow authority: **PASS (35 checks)**.
- M48 retained M46/M47 backend/no-migration boundary: **PASS**.
- M48 fail-closed finalizer self-test: **PASS**.
- Browser specification now covers explicit cancel/no-write semantics for Text, Numeric, Date, Dropdown, Person, and Status; exact Dropdown and Status filter persistence across reload; null-last descending sorting across reload; and add/rename/reorder/resize-cancel/resize-commit/duplicate-with-values/type-change-with-clear/delete persistence.
- Dependency-backed browser/type/build execution remains part of the exact-commit certification transaction; it was not substituted with assistant-container results after the container `npm ci` transport timed out.

## Backend boundary

M48 intentionally adds no Supabase migration, RPC, grant, or RLS policy. Existing M46/M47 Board contracts already expose the required column/cell/status mutations. Certification therefore fails closed against both retained production attestations instead of modifying production schema.

## Certification rule

The source remains `implementation-complete-pending-certification` until the full fail-closed exact-commit transaction passes. Only the certified package is promoted to `active-certified`. No PASS record or certified ZIP may be published if static, deterministic, browser, retained database/production, historical regression, type/build/security, checksum, artifact, or hosted gates fail.


## Checkpoint 03 governed Playwright root-cause corrective — 2026-09-21

Checkpoint 02 successfully passed archive/checksum validation, exact 33-path publication reconstruction, locked dependency materialization, isolated modern-test-toolchain bootstrap, and the M48 static/workflow/deterministic gates. The official four-scenario Playwright authority then stopped fail-closed with one passing scenario and three failures before any exact M48 commit, push, hosted run, or certified artifact was produced.

The failures were classified independently rather than retried:

1. **Date Escape cancellation — runtime defect.** The explicit date editor force-called `showPicker()` after focus. Chromium's native date picker could consume the first Escape, leaving the inline editor open. The editor now focuses the date input without forcibly opening the native picker, so the first Escape reaches the governed cancel handler and restores the original cell without a persistence call.
2. **Quick-add Text column name — stale browser authority.** `defaultColumnName('text', ...)` intentionally returns `New Text`; the Playwright assertion incorrectly searched fixture state for `Text`. The test now asserts the exact create RPC name `New Text`, resolves the created ID using that server-bound request value, and uses the same value for the rename accessible name.
3. **Status destructive confirmation — runtime overlay defect.** Opening the confirmation modal as a root overlay closed the status manager because the shared overlay manager enforces one active root branch. Board dialog options and `ConfirmAction` now support an optional parent overlay ID. Status-label deletion passes `parentOverlayId: 'inline-editor'`, making the confirmation a child overlay so the existing draft editor remains connected while the modal is active.

Static authority binds the absence of forced date-picker opening, nested status confirmation contract, child-overlay dialog plumbing, exact `New Text` browser authority, and post-confirm manager continuity. Deterministic authority additionally locks the production default column naming helper. Current dependency-free authority is **327 static / 71 deterministic / 35 workflow checks PASS**. No database schema, RPC, RLS, grant, migration, or production data change is part of this corrective. The complete governed Playwright/database/historical/type/build/exact-commit/hosted transaction must still pass before M48 may become `active-certified`.


## Checkpoint 04 editor/resize/confirmation lifecycle corrective — 2026-09-21

The Checkpoint 03 governed Mac run passed archive/checksum integrity, exact publication reconstruction, locked dependency materialization, isolated modern-test-toolchain bootstrap, and M48 static/workflow/deterministic gates. The Date first-Escape defect from Checkpoint 02 did not recur. The suite then stopped fail-closed with one passing scenario and three new failure boundaries before commit or push.

1. **Person popover ownership — runtime virtualization race.** A passive Board virtualization render could already be queued by the preceding cell commit. If the next Person editor opened before that frame executed, `requestVirtualizedBoardRender()` dismissed the newly active popover before rerendering. M48 now blocks both scheduling and execution of passive virtualization rendering while an inline editor transaction is active. Synchronized peer-scroll events return before popover dismissal, preventing a programmatic synchronization event from cancelling a draft.
2. **Resize semantic state — render-time accessibility defect.** Resize handles were initially rendered with only min/max semantics; `aria-valuenow` and `aria-valuetext` were added later by controller binding. This created a transient but observable invalid state immediately after Board rerender. Dynamic column and item-name resize handles now render the authoritative current width at DOM commit while the controller continues to update those values during interaction.
3. **Nested Status confirmation — adapter contract defect.** Checkpoint 03 correctly added parent-overlay support to the dialog controller and passed `parentOverlayId: 'inline-editor'` from Status deletion, but the `boards-ui.ts` adapter accepted only `message` and discarded the options object. The adapter now accepts `ConfirmActionOptions` and forwards them to `dialogs.confirm()`, and the dialog-controller public interface exposes the same optional argument.

The official four-scenario Playwright authority is unchanged. No timing relaxation, retry loop, database schema/RPC/RLS/grant change, migration, or production-data mutation is introduced. Dependency-free Checkpoint 04 authority was **327 static / 71 deterministic / 35 workflow checks PASS**, with retained M47/M46/M45 governance, M17/M18, retained-backend boundary, finalizer self-test, and secret scan PASS. M48 remains `implementation-complete-pending-certification` until the unchanged official Playwright authority and downstream exact-commit/hosted certification transaction pass.


## Checkpoint 05 editor-scroll/destructive-confirmation corrective — 2026-09-21

The Checkpoint 04 governed Mac run reached the official four-scenario Playwright authority and advanced from one passing scenario to two. The prior resize accessibility failure and Status-manager destruction failure no longer appeared, validating those Checkpoint 04 corrections. The run then stopped fail-closed at two remaining boundaries before exact commit, push, hosted workflows, or certified artifact publication.

1. **Person editor table-scroll ownership — runtime defect.** The earlier Checkpoint 04 change guarded queued virtualization rendering, but a separate table-scroll event path still called `inlineEdit.dismissPopover()` unconditionally. Browser/Playwright scrolling used to bring the Person cell into view could therefore dismiss the newly opened editor even though no virtualization render was allowed. M48 now treats an active editor as the owner of the grid interaction transaction: table scroll synchronization preserves and repositions the editor, defers virtualization measurement while it is active, and flushes the deferred measurement after editor close.
2. **Populated-column delete acknowledgement — stale browser interaction contract.** The production delete dialog intentionally renders a required `confirm_delete` checkbox whenever a column contains persisted values. `QA Notes` contains `QA alpha`, so native HTML form validation correctly blocked the Playwright test from submitting until the acknowledgement was checked. The E2E authority now explicitly verifies that acknowledgement is visible and required, checks it, and only then submits the deletion. The safety control is preserved; production behavior is not weakened to satisfy the test.

Static authority now binds editor-preserving scroll ownership, deferred virtualization flush, the retained required delete acknowledgement, and the browser interaction that satisfies it. Current Checkpoint 05 dependency-free authority is **336 static / 71 deterministic / 35 workflow checks PASS**; retained M45/M46/M47 static/finalizer authorities, M17/M18 evaluation vectors, and the high-confidence secret scan also pass. The dependency-backed retained deterministic/browser/type/build gates remain inside the governed Mac transaction. No database schema, RPC, RLS, grant, migration, timeout relaxation, retry loop, or production-data mutation is introduced. M48 remains `implementation-complete-pending-certification` until the governed Playwright rerun and downstream exact-commit/hosted transaction pass.


## Checkpoint 06 Playwright required-attribute matcher corrective — 2026-09-21

The Checkpoint 05 fresh-Mac run successfully restored the required development environment and reached the official four-scenario M48 Playwright authority after static, deterministic, TypeScript, ESLint, and production build gates had passed. The browser suite advanced to **3/4 passing**, proving that the prior Person editor and Status/resize lifecycle corrections no longer reproduced.

The sole remaining failure was a browser-authority API error, not an application defect: the test called `expect(deleteAcknowledgement).toBeRequired()`, but Playwright's matcher set does not define `toBeRequired()`. The test therefore threw `TypeError` before it could check the acknowledgement and submit the destructive delete. Checkpoint 06 replaces the unsupported matcher with `toHaveAttribute('required', '')`, preserving the exact native required-checkbox safety contract and the subsequent explicit `check()` before deletion. Static authority is updated to bind the supported assertion. No production runtime behavior, timeout, retry, database schema, RPC, RLS, grant, migration, or production data is changed.


## Checkpoint 08 historical M6 verifier synchronization — 2026-09-21

Checkpoint 07 passed the official M48 Playwright authority at **4/4 scenarios**, retained M47 browser authority at **4/4 scenarios**, Stage F M29 local Database/RLS pgTAP at **96 tests**, TypeScript, and Stage A security. The fail-closed transaction then stopped in `verify:ui` because the historical Boards M6 verifier required the obsolete exact confirmation signature `confirm(message: string): Promise<boolean>` and exact legacy adapter text. M48 preserves that original message-first asynchronous contract but extends it with an optional `ConfirmActionOptions` argument for nested-overlay ownership. Checkpoint 08 synchronizes the historical verifier to accept the original or backward-compatible optional-extension signature while retaining the custom-dialog, Promise<boolean>, and native-confirm prohibition requirements. No production runtime, browser behavior, backend contract, migration, RPC, RLS, grant, timeout, retry, or production-data behavior changes in this corrective.


## Checkpoint 09 post-promotion verifier lifecycle synchronization — 2026-09-21

Checkpoint 08 passed the M48 release verification and certification-tree parity, then stopped during finalization because the staged certified baseline had correctly promoted the M48 target/release state to `active-certified` while the M48 static verifier still accepted only the pre-certification pending state. Checkpoint 09 makes that verifier lifecycle-aware without changing the fail-closed source requirement: authoritative Git source must still remain `implementation-complete-pending-certification` until certification succeeds, while the staged certified artifact may be verified as `active-certified` with matching release provenance. The finalizer self-test now also promotes a complete isolated project copy and runs the real M48 static verifier in `active-certified` state, preventing recurrence of this mismatch. No runtime, browser, backend, schema, RPC, RLS, grant, migration, timeout, retry, or production-data behavior changes.
