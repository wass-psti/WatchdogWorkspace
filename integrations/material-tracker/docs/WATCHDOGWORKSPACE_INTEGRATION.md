# Material Tracker → WatchdogWorkspace Integration Contract

## Ownership
WatchdogWorkspace owns authentication, Supabase session lifecycle, user/profile identity, active workspace, outer routing, global navigation, global appearance, and final module registration.

Material Tracker owns its material-sourcing domain, app-scoped roles (`ADMIN`, `USER`, `VIEWER`), material/task/comment workflows, calculations, exports, and module-specific presentation.

## Embedded entry
Import `src/MaterialTrackerApp.jsx`. The host supplies an authenticated Supabase session and active workspace, or exposes them through `globalThis.__WATCHDOG_WORKSPACE__`.

## Database contract
The module consumes the existing `material_tracker_*` domain and protected `material_tracker_*` RPCs in the shared WatchdogWorkspace Supabase project. The module repository does not own unrelated host migrations.

## Compatibility adapter
`src/api/BoardSDK.js` remains the stable generated-UI facade. `src/api/http.js` maps its REST-shaped compatibility calls to protected Supabase RPCs.

## Retired legacy runtime
The prior Node/JSON standalone backend and all bundled demo/seed/test records have been removed. They are not part of the production repository or runtime. The shared Supabase Material Tracker domain is the sole persistence boundary.

## v0.3.1 completion boundary
The standalone preparation repository is implementation-complete for later host mounting. Actual WatchdogWorkspace route/navigation registration is intentionally outside this repository and belongs to the future host-merge checkpoint.

### RBAC
- `ADMIN`: full Material Tracker domain writes plus forex and role administration.
- `USER`: normal Material Tracker domain writes.
- `VIEWER`: read-only domain access; personal workspace/user UI-state persistence remains permitted.
- UI, compatibility transport, and protected RPC/database boundaries all enforce this model.

### Host lifecycle bridge
Successful module mutations dispatch namespaced browser events:
- `watchdog:material-tracker:changed`
- `watchdog:material-tracker:invalidate`
- `watchdog:module-notification-created` when applicable

The host may consume those events to invalidate shared caches, refresh realtime surfaces, or surface notifications. The module does not instantiate a competing host-global router, query client, theme provider, or identity store.

### Export/security boundary
XLSX and PDF exports are produced by module-local deterministic writer code. Retired vulnerable export packages are prohibited by package-hygiene and deterministic guards. Runtime dependency audit is part of fail-closed certification.


## Atomic file import / export contract

The embedded module exposes no new host-global state. Import preflight and commit use host-authenticated Supabase RPCs (`material_tracker_import_preflight`, `material_tracker_import_commit`) and therefore inherit Workspace identity plus Material Tracker app-scoped RBAC. Preview is mutation-free; commit is transactional and fingerprint-protected. CSV/XLSX export uses the same canonical import schema.
