# Material Tracker — WatchdogWorkspace Integration Preparation v0.4.0

This repository is the standalone, integration-ready Material Tracker module. It preserves the Material Tracker product while adapting its platform boundary for clean later mounting inside WatchdogWorkspace.

## Active architecture
- `src/MaterialTrackerApp.jsx` is the embedded module entry.
- WatchdogWorkspace/Supabase authentication, user identity and active workspace are authoritative.
- Material Tracker app roles are `ADMIN`, `USER`, and `VIEWER`.
- `ADMIN`/`USER` may perform domain mutations; `VIEWER` is read-only for domain mutation surfaces.
- `src/api/BoardSDK.js` remains the generated UI compatibility facade.
- Protected Supabase `material_tracker_*` RPCs are the production persistence/authorization boundary.
- The retired Node/JSON demo backend and all seeded/test data have been removed from the repository. Production persistence is exclusively the shared Supabase Material Tracker domain.
- Material Tracker CSS/theme behavior is scoped to the module and does not own the embedded host document.
- Module mutation events are exposed through namespaced Watchdog host events for cache/realtime/notification integration.

## Security and dependency posture
The prior `xlsx`, `jspdf`, and `jspdf-autotable` dependency families were removed. XLSX and PDF exports now use internal deterministic writer modules, with `fflate` used for OOXML ZIP creation. `npm run check:security` is a required runtime dependency-audit gate in local certification.

## Local certification
Run:

```bash
bash scripts/local-certify-workspace-auth.sh
```

The script is fail-closed and creates a certified baseline only after all required repository, dependency-security, static, deterministic, export-format, build, migration, authenticated browser/E2E, certification, regression, package-hygiene, checksum and final-validation gates pass.

See:
- `docs/WATCHDOGWORKSPACE_INTEGRATION.md`
- `docs/RBAC_MATRIX.md`
- `docs/DESIGN_SYSTEM_COMPATIBILITY.md`
- `docs/RUNTIME_LIFECYCLE.md`
- `docs/SECURITY_DEPENDENCIES.md`
- `CHECKPOINT_STATUS.md`


## CSV / Excel interchange

Material Tracker v0.4.0 includes a validated `.csv`, `.xls`, and `.xlsx` import workflow with mapping, preview, duplicate/conflict classification and atomic commit. Canonical schema: `docs/MATERIAL_IMPORT_SPECIFICATION.md`. Reusable templates: `templates/material-tracker-import-template.csv` and `templates/material-tracker-import-template.xlsx`. CSV/XLSX exports use the same canonical columns and preserve Material IDs and supported relationship references for safe edit/re-import workflows.
