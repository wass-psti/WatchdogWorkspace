# M37 Functional Regression Inventory

## Milestone disposition

Stage G M37 establishes the evidence baseline for the reported loss of functionality in **Boards, Users, Settings, and Account**. It does not silently classify those modules as repaired. Source characterization is complete; browser certification must be run in an environment with the governed npm dependencies/browser toolchain before M37 can be promoted to `active-certified`.

## Inventory

| ID | Area | Severity | Baseline finding | Next owner |
|---|---|---:|---|---|
| M37-XMOD-001 | Cross-module | Critical | Bare source/local run has intentionally empty public Supabase configuration; protected routes enter setup-required/login. | M38 |
| M37-BRD-001 | Boards | Critical | React Board facade publication is immediately followed by imperative host resolution; missing-host timing is an explicit route failure signature. | M40/M45 |
| M37-BRD-002 | Boards | Critical | Board functionality depends on deployed `wm_*` RPC/schema authority; stale/missing RPCs produce PGRST202/backend-outdated failures. | M46 |
| M37-USR-001 | Users | Critical | Directory requires authenticated admin context and `list_user_directory`; errors surface as `User directory unavailable`. | M39/M42 |
| M37-USR-002 | Users | High | Protected RPC authority remains intentional until the M28 Edge Function is actually deployed/cut over. | M42/M54 |
| M37-SET-001 | Settings | Critical | Route/DOM ownership and storage/diagnostics/backup actions require authenticated integrated browser characterization. | M40/M43 |
| M37-ACC-001 | Account | Critical | Profile/security/session operations require hydrated cloud identity and real backend responses; prior Playwright never covered them. | M39/M41 |
| M37-CERT-001 | Cross-module | Critical | Previous Playwright smoke proved login composition only; M13 execution vectors proved state transitions, not authenticated workflows. | M52 |
| M37-TECHDEBT-001 | Account/Users/Settings | Medium | Legacy management feature authorities remain exported/listed despite React management route ownership. | M44 |

The machine-readable authority is `regression-baseline/m37-functional-regression-inventory.json`.

## Functionality already implemented and retained

The underlying implementations remain present: React authenticated management views; Account profile/password/session actions; protected Users directory/role RPC calls; Settings preferences/diagnostics/backup operations; Board repository/services/controllers/table/Kanban/item-workspace/realtime code; M29 database/RLS test infrastructure; M30 test tooling; M31–M36 performance/observability/service-worker/DR/cutover infrastructure.

M37 does not delete or replace these implementations. It establishes which integrated paths must be repaired or re-certified.

## Work that remains incomplete after M37

- M38 backend/environment capability preflight.
- M39 authentication/session/access-context stabilization.
- M40 React/runtime route ownership and lifecycle recovery.
- M41 Account functional recovery.
- M42 Users/RBAC functional recovery.
- M43 Settings functional recovery.
- M44 management-authority consolidation.
- M45–M51 Boards collection/backend/table/cells/Kanban/item-workspace/realtime recovery.
- M52 authenticated role-matrix E2E certification.
- M53 recovery/update/accessibility/quality hardening.
- M54 final functional production-readiness certification.

## Temporary compatibility and architectural boundaries

1. React owns the Board facade host while the imperative Board engine owns its descendants.
2. Users retain protected `list_user_directory` / `admin_set_user_access` RPC authority until the M28 Edge Function is deployed with server-only secrets and independently certified.
3. TimeTracker, FuelTrack+, and TradeLink remain M26 same-origin iframe compatibility islands.
4. Public Supabase URL/publishable key are environment-provided browser configuration; privileged credentials remain forbidden.
5. Bounded CDP remains a release parity backstop alongside Playwright until later authenticated coverage supersedes it.

## Blockers and risks

- Browser characterization requires exact npm dependencies plus a Chromium-family executable; the source package intentionally does not vendor `node_modules`.
- The actual production Supabase migration/RPC/storage/realtime state must be verified later against the deployed project; repository migration presence is not deployment evidence.
- Service-worker caching can mask runtime changes if an old build remains active; update-path validation remains required downstream.
- Duplicate management authorities increase maintenance/confusion risk until M44.
- M37 evidence is characterization evidence, not proof of repaired functionality.

## M37 certification interpretation

A PASS for M37 means **every reported module is represented by a reproducible browser characterization and/or explicit source/backend failure signature, with requested evidence captured in a redacted form**. It does not mean the four modules are functionally restored. That is the responsibility of M38+.
