# Work Management — Stage F M35 Final Legacy Deletion

M35 deletes only expired or dead compatibility code. It does not classify a live certified dependency as legacy merely because it originated during migration.

## Deleted
- M3-era `LegacyApplicationBoundary.tsx`, `legacy-runtime-adapter.ts`, and `legacy-host.ts`; replaced by neutral runtime-content authorities.
- `data-wm-legacy-runtime-host` and `__WM_REACT_COMPOSITION_HOST__` identity contracts.
- The unreachable imperative `shell(content, active)` serializer and private shell-markup helpers from `assets/js/app.ts`.
- M33's one-migration-cycle `SKIP_WAITING` service-worker activation alias. `WM_ACTIVATE_UPDATE` is the only activation message.

## Retained by evidence
- `assets/js/app.ts`: still the active typed route-content engine.
- TimeTracker, FuelTrack+, TradeLink same-origin iframe presentation: retained by M26 because native retirement gates remain unsatisfied.
- Backup v1-v4 readers/migrations: retained as disaster-recovery read compatibility under M34.
- SQL migrations, release reports, corrective runbooks, and historical verifiers: retained as audit/certification evidence.

No database migration, schema rewrite, dependency change, or embedded-module source rewrite is part of M35.
