# M144.7 — GitHub Release Gate & Staging Identity Boundary

**Release state:** NOT RELEASE CERTIFIED. **Continuation:** CONTINUE — IMPLEMENTATION REQUIRED.

This successor adds only `scripts/m1447_deployment_gate.py` and this governance document. It makes no modification to the existing application, M143 draft, migrations, authentication, CI, or live services. Its separate source manifest verifies the entire predecessor chain before local acceptance.

## Observed deployment controls (read-only verification, October 13, 2026)

- GitHub repository: `wass-psti/WatchdogWorkspace` (default `main`, public, currently connected).
- At the time of inspection, `main` was `ed390940b56be6c4495347aae37593e9a34b4446` (merged M123 PR #19). This reference **must be refreshed** before Git operations. A ZIP derived from M144.2.5 must not replace or roll back intervening `main` changes.
- `.github/workflows/deploy-pages.yml` auto-runs on `push` to `main` and deploys GitHub Pages. It validates `wm_deployment_contract_attestation` and older RPC `wm_import_board_items_atomic`, **not** the pending M143 `wm_import_board_wizard_atomic`.
- Latest successor frontend references `wm_import_board_wizard_atomic`, while `supabase/m143/board_import_wizard_atomic_DRAFT.sql` is not in `supabase/migrations`.

## Staging target identification

Connected Supabase project inventory included `WatchdogWorkspace` and `Tool-Traceability-Acceptance-Lab`; **neither was designated by the operator as the approved WatchdogWorkspace staging target**. Do not infer production/staging from project names. No SQL or migration action was run by this checkpoint. Do not submit user/customer data to an unknown lab.

## Safe sequence

1. Confirm a dedicated, accessible, explicitly designated nonproduction staging project; authenticate its identity before any read-only query.
2. Collect approved database migration ledger/catalog with M144.6 read-only template; compare against required relations and actual RLS/roles/functions.
3. Prepare an M143 migration and rollback plan separately. Migration must not be placed in active migrations or executed until staging compatibility and explicit write authorization.
4. Perform staged Auth, Board importer editor/viewer/outsider, cross-workspace, concurrency, HTTP 409, atomicity, audit and browser acceptance.
5. Compare repository `main` HEAD against candidate; use a controlled PR and preserve all upstream changes. Branch pushes may run CI, but do not merge to `main` until hosted behavior is certified.
6. Run full historical release gates and separately approve production migration/deployment. A staging catalog snapshot alone is insufficient to declare release readiness.

## Interpret the readiness states

- **M144.7 offline governance:** static source readiness and safe GitHub gate only.
- **GitHub test-branch preparation:** possible after lineage/diff verification; does not test production application.
- **Push/merge to main to test live Board Import:** **NO**, currently blocked by missing M143 hosted migration and acceptance.

Never paste admin/service-role database credentials into a public repository or generated frontend code. All tools in this checkpoint run offline with Python stdlib.
