# Stage E M23 — TimeTracker stabilization

M23 stabilizes the existing authenticated TimeTracker compatibility island before any later Stage E presentation/runtime replacement.

## Certified boundaries

- Clock Location and Department are user-scoped UI preferences and no longer write the shared attendance ledger.
- Administrative attendance edits and completed-record deletion wait for confirmed cloud persistence; failed or conflict-merged writes reload authoritative attendance state before the UI continues.
- OT create/edit/submit/withdraw/approve/reject transitions wait for confirmed cloud persistence; failed or conflict-merged writes reload authoritative OT state before the UI continues.
- TimeTracker consumes both native `storage` events and the `wm:module-store-change` fallback emitted by the embedded cloud store, while preserving synchronization across BFCache restores.
- Critical shared writes verify that the committed compatibility-store value exactly matches the intended mutation so JSON conflict recovery cannot be mistaken for successful persistence.
- Launch-time automatic Clock Out and automatic GPS evidence refresh authoritative attendance after obtaining their distributed locks, preventing stale cross-device state from being committed.
- Existing attendance policy remains unchanged: 08:00 standard start, 12:00–13:00 unpaid break, nine credited working hours, approved OT extension, GPS evidence and launch-only automatic enforcement.
- M22 normalized module-data canonical keys remain the Stage E data foundation.

## Compatibility boundary

TimeTracker remains a same-origin iframe using `WMModuleStore`, `WMModuleAttendance`, `WMModuleLocks`, Work Management identity, and the existing authorized Supabase RPCs. M23 is stabilization, not iframe replacement.

No new external package and no Supabase migration are required.
