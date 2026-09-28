# M77 Hosted M49 CDP Portability Corrective — 2026-09-28

## Origin

The published Stage H M77 certified source commit `2fac5a85dc7f4a668a8073fadfa995218134eae4` completed 21 of 23 GitHub Actions workflows successfully. `Boards Kanban Drag Drop Recovery` failed directly and `Rich Item Workspace File Recovery` failed transitively when its inherited M49 release verification reached the same M49 CDP smoke gate.

## Failure condition

The M49 CDP runner constructed an `about:blank` page with `Page.setDocumentContent()` and embedded its assembled fixture as `<script type="module">`. In the hosted Chromium execution path, the injected module script remained inert, so the fixture output stayed `data-state="running"` until the 20-second CDP timeout.

After making the injected program executable as a classic async wrapper, the latent dependency gap became observable: `kanban-view.ts` imports `buttonClass` and `iconButtonClass` from the shared UI primitives module, but the CDP assembler stripped runtime imports without supplying those symbols. That produced `ReferenceError: buttonClass is not defined`.

## Corrective delta

`run-boards-kanban-drag-drop-recovery-cdp.mjs` now:

1. Includes the real `assets/js/platform/ui/primitives.ts` implementation in the assembled browser fixture.
2. Injects `buttonClass` and `iconButtonClass` into the Kanban module prelude after TypeScript import stripping.
3. Wraps the assembled program in an async classic-script execution boundary so fixture-level `await` remains valid when injected through `Page.setDocumentContent()`.
4. Converts an unexpected wrapper-level rejection into the existing fail-closed `data-state="fail"` result instead of allowing a silent timeout.
5. Preserves the existing semantic assertions and result tokens for lanes, keyboard movement, rollback, structure movement, view switching, and concurrency.

The M49 static verifier now guards these portability requirements and rejects restoration of the inert dynamically injected module-script form.

## Scope boundary

No application domain logic, database schema, migration, RLS policy, Supabase integration, Board persistence contract, production deployment definition, or M77 UI implementation is changed by this corrective. The change is restricted to the historical M49 CDP verification harness and its regression guard.

## Continuation state

This corrective source must pass the applicable local M49/M50 regression gates, repository-wide historical verification, checksum/package validation, and then the hosted workflows on the resulting source commit. Until the hosted failures are re-executed successfully, the corrective loop remains open and the corrected repository must not be represented as a newly certified M77 baseline.
