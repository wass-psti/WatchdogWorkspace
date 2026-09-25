# M54 M50 System-Column Fixture Authority Corrective — 2026-09-25

## Origin
Candidate 03 reached the M50 browser gate after M46–M49 passed, but the Item Workspace title remained `Alpha` after saving `Alpha recovered`.

## Root cause
The M50 browser fixture inherits the M49 board snapshot. That historical M49 snapshot contains a Status system column and custom text columns, but no Title, Assignee, Due Date, or Notes system columns. The current Item Workspace controller resolves a core-property form to its system column before it calls `commands.setCell(...)`; therefore the Candidate 03 CAS route handler could never be reached for Title because `system_key='title'` was absent.

## Corrective
The M50 fixture now backfills any missing current system columns: Title, Status, Assignee, Due Date, and Notes. Existing inherited system columns are preserved rather than duplicated. Static M50 governance now requires this complete system-column authority as well as the current CAS handler.

## Boundary
No production runtime, database schema, migration, RLS, deployment, or frozen M54 release semantics are changed. This is historical browser-fixture synchronization only.
