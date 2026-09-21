# M48 Continuation State — Boards Columns, Cells & Status System Recovery

**Checkpoint:** M48 Certification-Ready Checkpoint 9
**Prerequisite baseline:** M47 active-certified commit `076233918b885e71834dd2b5814c26397bdaaed5`
**Current source state:** implementation-complete-pending-certification
**Overall M48 completion at this checkpoint:** 99% — implementation complete; M48 browser authority now PASS; downstream governed certification pending

## Completed implementation

- Exact Status/Dropdown filter equality.
- Deterministic null-last sorting in ascending and descending directions.
- Rollback-safe pointer-cancel column resizing.
- Stable keyboard focus restoration after inline cancel.
- Dropdown configuration validation and deterministic defaults.
- At-least-one-active Status lifecycle guard.
- Dedicated M48 deterministic fixture covering retained column/cell/status RPCs.
- Dedicated M48 Playwright workflows for all six required typed editors with explicit cancellation/no-write checks, typed filter/sort reload persistence, add/rename/reorder/resize/duplicate/type-change/delete column lifecycle, and atomic status lifecycle/reference clearing.
- Architecture 56 manifest/type/runtime-schema authority.
- No-migration retained M46/M47 production boundary.
- Fail-closed candidate/release/finalizer/artifact/workflow governance.
- Retained M47 static/finalizer authorities synchronized for architecture-56 descendants without altering M47 runtime semantics or certified target state.
- Checkpoint 07 Mac authority proves the official M48 Playwright suite PASS at 4/4 scenarios, retained M47 Playwright PASS at 4/4, M29 local Database/RLS pgTAP PASS at 96 tests, TypeScript PASS, and Stage A security PASS before the historical M6 verifier drift stopped the transaction.
- Checkpoint 08 Mac authority passed the M48 release gate and exact certification-tree parity before exposing the post-promotion verifier lifecycle mismatch inside the finalizer.
- Checkpoint 09 verifies both pending-source and active-certified staged verifier states, adds a real active-certified static-verifier regression case to the fail-closed finalizer self-test, and passes the complete historical `verify:ui` chain.

## Remaining work classification

Checkpoint 08 completed the corrected historical UI chain, candidate/release verification, and exact certification-tree parity. It then stopped inside the finalizer because the staged artifact had correctly reached `active-certified` while the M48 static verifier was still pending-only. Checkpoint 09 synchronizes that verifier lifecycle contract and independently proves both pending-source and promoted staged states. Remaining work is the complete governed rerun through exact-commit certification, post-certification regression/build/package checks, push, hosted workflows, artifact verification, and final remote binding.

## Backend / compatibility boundaries

- M46 remains the Board backend contract authority.
- M47 remains the table/group/item database semantics authority.
- M48 adds no migration, RPC, RLS, or grant change.
- The typed Board grid remains the TypeScript `assets/js/boards-ui.ts` runtime behind the React Board presentation facade; no React grid rewrite is part of M48.

## Known blockers / risks

- No known M48 product/runtime blocker remains. The only outstanding risk is an as-yet-unexecuted downstream certification gate after the Checkpoint 09 post-promotion verifier correction.
- M49–M53 remain intentionally out of scope (later Kanban, item workspace, collaboration, relationships/formulas, and subsequent Board recovery layers).


## Checkpoint 03 browser-root-cause corrective — 2026-09-21

- Checkpoint 02 passed package integrity, exact 33-path staging, clean `npm ci`, modern-test-toolchain bootstrap, M48 static/workflow/deterministic gates, then reached the official M48 Playwright suite.
- The typed-cell scenario exposed a real Date cancel defect: `input.showPicker()` force-opened the native date picker, allowing the browser picker to consume the first Escape before the inline editor's cancel handler. M48 no longer force-opens the native picker; the date input is focused normally, preserving first-Escape cancel semantics.
- The column-lifecycle scenario exposed stale test authority rather than a product defect. The governed production naming helper intentionally creates `New Text`; the browser test now binds the created ID to the RPC's exact `p_name` and asserts `New Text` instead of searching for obsolete `Text`.
- The status-lifecycle scenario exposed a real nested-overlay defect. A destructive status-label confirmation previously opened as a root modal, causing the overlay manager to close the status manager and lose its in-memory draft. Board dialogs now support an optional parent overlay, and status-label deletion opens its confirmation as a child of `inline-editor`, preserving the status draft and manager lifecycle through confirmation.
- No M48 migration, RPC, RLS, grant, or retained M46/M47 backend semantic changes are introduced.


## Checkpoint 04 editor/resize/confirmation lifecycle corrective — 2026-09-21

- Checkpoint 03 passed package/checksum integrity, exact publication reconstruction, clean dependency/toolchain materialization, and M48 static/workflow/deterministic gates. The official M48 Playwright suite again stopped fail-closed at 1/4, before exact commit/push/hosted certification.
- The Date first-Escape failure from Checkpoint 02 did not recur, validating that correction.
- The Person editor failure is a Board virtualization ownership race: a render frame queued by the preceding committed cell can execute after the next popover opens, and the old `requestVirtualizedBoardRender()` path unconditionally dismissed popovers before rendering. Virtualization now refuses to start or complete a passive render while an inline editor transaction is active; synchronized peer-scroll events also return before editor dismissal.
- The resize scenario exposed incomplete render-time accessibility state. The controller could stamp `aria-valuenow` after binding, but freshly committed header markup omitted it. Dynamic column and item-name resize handles now render `aria-valuenow` and `aria-valuetext` from the same persisted width authority used by the table layout, so the DOM is correct immediately at render commit.
- The Status manager failure revealed that `confirmBoardAction` still accepted only the message string and silently dropped the `parentOverlayId` option added in Checkpoint 03. The adapter and dialog-controller public signature now forward `ConfirmActionOptions` end-to-end, preserving the status-manager parent during destructive confirmation.
- The official Playwright assertions remain unchanged. No timeout inflation, blind retry, backend migration, RPC, RLS, grant, or production-data change is introduced.


## Checkpoint 05 editor-scroll/destructive-confirmation corrective — 2026-09-21

- Checkpoint 04 passed package/checksum integrity, dependency/toolchain materialization, and M48 static/workflow/deterministic gates. The official M48 Playwright suite progressed to 2/4 passing, proving the Checkpoint 04 resize semantics and nested Status confirmation corrections. It stopped fail-closed before commit/push/hosted certification.
- The remaining Person failure was caused by the table scroll handler, not the virtualization render function. Browser/Playwright scrolling of the Person cell's table viewport could occur after the editor opened, and the handler unconditionally dismissed any active popover. Table-scroll synchronization now preserves an active editor, repositions its popover, defers virtualization measurement while the editor owns the transaction, and flushes that deferred measurement when the editor closes.
- The remaining column-delete failure was a browser-authority mismatch with the production destructive-confirmation UI. `QA Notes` contained a persisted value, so the dialog correctly rendered a required `confirm_delete` acknowledgement checkbox. Native form validation prevented the test's unacknowledged submit. The E2E authority now asserts the checkbox is visible and required, checks it, and then submits; the production safety requirement remains intact.
- No M48 database schema, RPC, RLS, grant, migration, timeout inflation, blind retry, or production-data change is introduced.


## Checkpoint 06 Playwright required-attribute matcher corrective — 2026-09-21

- Checkpoint 05 passed environment restoration, archive/checksum integrity, clean dependency/toolchain materialization, M48 static/deterministic/type/lint/build gates, and then reached the official four-scenario Playwright authority.
- The suite advanced to **3/4 passing**. Typed-cell (including Person), filter/sort, and Status lifecycle scenarios passed, validating the previous runtime corrections.
- The sole failure occurred before the destructive delete was submitted: `expect(deleteAcknowledgement).toBeRequired()` raised `TypeError` because Playwright does not expose a `toBeRequired()` matcher. This is a test-authority API defect, not a runtime or environment defect.
- The assertion is replaced with `toHaveAttribute('required', '')`, which verifies the same native HTML required contract using a supported Playwright matcher. The checkbox remains required and is still checked before submission; no production safety behavior is weakened.
- No runtime source, database schema, RPC, RLS, grant, migration, timeout, retry, or production-data behavior is changed by this corrective.


## Checkpoint 08 M6 historical verifier synchronization — 2026-09-21

- Checkpoint 07 passed the official M48 Playwright authority **4/4**, proving typed cells, filter/sort, column lifecycle, and Status lifecycle behavior on the governed Mac environment.
- Retained M47 Playwright also passed **4/4**; Stage F M29 local Database/RLS pgTAP passed **96 tests**; TypeScript and Stage A security passed.
- The transaction stopped only in the historical Boards M6 UI verifier. That verifier required the exact legacy signature `confirm(message: string): Promise<boolean>` and exact legacy adapter text even though M48 preserves the same message-first asynchronous contract and adds only an optional `ConfirmActionOptions` parameter for nested-overlay ownership.
- The M6 verifier now accepts either the original signature or the backward-compatible optional extension, requires the message-first `Promise<boolean>` contract, requires custom dialog wiring, and continues to reject native `confirm()`.
- No Board runtime, browser scenario, Supabase schema, RPC, RLS, grant, migration, timeout, retry, or production-data behavior is changed by Checkpoint 08.


## Checkpoint 09 post-promotion verifier lifecycle synchronization — 2026-09-21

- Checkpoint 08 passed the M48 release gate and certification-tree parity, then stopped inside the fail-closed finalizer after the staged target/release records were correctly promoted to `active-certified`.
- Root cause: the M48 static verifier was pending-only even though the finalizer intentionally invokes it against the promoted staged certified baseline before post-state regression/build/package checks.
- The M48 static verifier is now lifecycle-aware: the authoritative repository source accepts only `implementation-complete-pending-certification`, while a staged certified baseline may be `active-certified`; in either state the release record must match the target lifecycle state. Pending source still cannot claim certification, and active-certified staged state must contain final certification provenance.
- The finalizer itself remains fail-closed and still requires the authoritative Git source to remain pending before and after all certification gates. No Board runtime, test scenario, Supabase schema, RPC, RLS, grant, migration, timeout, retry, or production-data behavior changes in Checkpoint 09.
