# M107 — Material Tracker controlled integration

Authoritative host baseline: Work Management Stage I M106 final certified baseline `8e55b75600ed`.
Standalone integration source: Material Tracker v0.4.0 WatchdogWorkspace Integration Certified Baseline.

## Architecture
- Material Tracker remains dependency-isolated and is built as a same-origin iframe runtime.
- Work Management continues to own authentication/session lifecycle, outer routing, navigation, and Supabase backend configuration.
- Material Tracker consumes the existing Work Management Supabase session from same-origin persisted session state and consumes `WM_BACKEND_CONFIG` from the host when embedded.
- Material Tracker retains its own `ADMIN` / `USER` / `VIEWER` membership as the authoritative module RBAC boundary. `wm_auth_access_context()` projects that membership into the shell assignment payload; roles are not duplicated into `module_role_assignments`.
- Material Tracker retains its dedicated protected `material_tracker_*` Supabase RPC/table domain rather than using generic module-state persistence.
- The host root dependency graph is unchanged; Material Tracker uses its own pinned package-lock and nested build.

## Backend evidence
Connected Supabase project `jtlusodorfnyzgyuewkz` is named `WatchdogWorkspace` and contains the Material Tracker tables, RLS, memberships, and migration history through `20261003115954_material_tracker_import_payload_bounds`.

## Explicit external boundary
The live Supabase project is the authoritative owner of Material Tracker's pre-existing database domain. The supplied standalone repository contains guard/corrective migrations rather than a complete from-zero reproduction of the original base migration SQL. The integration therefore adds only a host access-context migration and does not invent replacement base-schema SQL. Fresh-project reconstruction of the historical Material Tracker base schema remains outside this checkpoint unless the authoritative original migration source is supplied or exported.


## M107 live backend alignment
- Supabase project: `jtlusodorfnyzgyuewkz` (`WatchdogWorkspace`).
- Existing Material Tracker tables/RPC domain was verified live before host mutation.
- Host access-context migration applied as `20261007083936_material_tracker_host_access_context_integration`.
- `wm_auth_access_context()` now projects the caller's existing `material_tracker_memberships` role as module `material-tracker`; no role is copied into `module_role_assignments`.
- Material Tracker remains authoritative for `ADMIN` / `USER` / `VIEWER`.
- Supabase advisors were re-run after the DDL. Existing project-wide RLS-without-policy INFO, search-path, indexing, and duplicate-index advisories remain outside this integration scope; the M107 access-context function itself fixes its search path and introduced no table/policy/index mutation.

## Provenance
- M106 canonical source ZIP SHA-256: `af01a15afa7d2289d44713860e6a774dc95a666077d8160d325fece513fc96df`.
- M106 final commit: `8e55b75600ed9153408945ff48c6a1699d1fc2a3`.
- Material Tracker supplied certified baseline ZIP SHA-256: `4b945c86ad9fb64a497116041b11522446994b660c2bf4f95bf52a79b56b9f8b`.
