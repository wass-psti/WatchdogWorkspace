# M144 — Browser acceptance checkpoint (NOT release certified)

Predecessor: source-only M143.2 2,805-file ZIP (`63ec9b827e5ea7400fd266add6206fbb11724a6f04d57eeceee8b5a51ab50c65`). Full historical-schema QA passed on the user's Mac via M143.3.2. M143 wizard SQL remains an unapplied DRAFT.

## Implemented now

- Real browser uses unchanged CSV parser, M141 planner, M143 request builder, and actual wizard UI; the isolated fixture simulates the Board service. Does **not** fake a Supabase login, impersonate a real user, or send any call to hosted Supabase.
- UI prevents Back, Classic, Close, Escape and additional wizard open while an atomic call is unresolved. An unconfirmed RPC outcome disables resubmission; operator must close, refresh authoritative Board, and begin new review. No automatic retry or item-by-item fallback.
- Eight deterministic Playwright cases: viewer denial, successful Add/new group/column, skip, update with CAS, missing match choice, pending transaction interaction lock, uncertain error, stale Board plus invalid number. These tests are in addition to historical M30 browser smoke.
- No new external package, package-lock change, hosted token, localStorage dependency, or production deployment.

## Required after this review

1. Dedicated **authenticated** login/session/RBAC E2E against an isolated Supabase Auth + PostgREST test instance, not merely the mocked service harness.
2. Real PostgREST RPC request/response parity including refresh-before-retry after uncertain failure and actual `wm_import_board_wizard_atomic` migration application in test infrastructure (never production until authorized).
3. Full integrated frontend/backend E2E and independent review of security-definer ACL/authorization and full-schema contracts.
4. Governance CI, independent review, release controls and deployment authorization. No certified release or PASS record may be issued before all mandated gates succeed.

Status: IMPLEMENTATION PARTIAL; local browser and repository gates remain to execute on Mac. This package is an authoritative **non-certified review continuation** only after its script passes.
