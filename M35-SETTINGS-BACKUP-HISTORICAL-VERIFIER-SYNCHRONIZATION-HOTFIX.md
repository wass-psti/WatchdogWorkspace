# M35 Settings/Backup Historical Verifier Synchronization Hotfix

## Problem

The Architecture 43 full historical verification chain still executed `verify-settings.mjs`, whose Settings UI wiring assertions were frozen at the pre-M34 direct restore implementation. It required the M13 management runtime to call `parseBackupFile(file, modules)` followed by `restoreWorkspaceBackup(payload)`.

M34 intentionally hardened restore orchestration. Architecture 42+ now performs `inspectBackupFile(file, modules)` first, surfaces integrity/preflight warnings and the mandatory pre-restore checkpoint disclosure, then executes `restoreWorkspaceBackupGuarded(payload, modules)`. The lower-level legacy parse/migration helpers remain available in `assets/js/core/backup.ts` for backwards-compatible backup ingestion; only the UI orchestration path changed.

## Correction

`verify-settings.mjs` is now architecture-aware:

- Architecture 41 and earlier preserve the historical direct parse/restore assertions.
- Architecture 42 and later require the M34 guarded restore path: inspection, preflight integrity authority, checkpoint disclosure, and guarded restore.
- Architecture 42+ explicitly rejects a regression back to the old direct UI restore path.
- Existing backup migration tests remain unchanged and continue proving v1-v4 legacy backup parsing/migration behavior.

M35's own verifier now certifies this synchronization so future Architecture 43 certification cannot silently reintroduce the stale historical assertion.

## Scope boundary

This is verifier synchronization only. It does not modify production Settings behavior, backup data format, database schema, migrations, package dependencies, embedded applications, service-worker behavior, or the M35 deletion inventory.

## CI regression prevention

The M35-specific workflow now runs `verify-settings.mjs`, `npm run fueltrack-stabilization:check`, and `npm run verify:ui` before the M35 deletion authority. This makes the synchronized historical contracts an early CI gate instead of allowing them to fail only in the final repository sweep.
