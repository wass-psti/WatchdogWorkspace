# Material Tracker Runtime Lifecycle

Material Tracker uses the Work Management session/workspace as authority and keeps its refresh coordinator module-local.

## Refresh model
- Existing silent polling remains a compatibility fallback for standalone execution.
- Hidden tabs pause intervals.
- Refreshes are staggered and mutually coordinated inside the module.
- The host may dispatch `watchdog:material-tracker:invalidate` after Supabase Realtime or other shared-query invalidation events. Every active Material Tracker refresh hook will then revalidate through the existing protected RPC layer.

This bridge prevents the standalone module from requiring a second global query client while allowing Work Management to become the realtime/invalidation authority after final host registration.

## Presence
Presence remains backed by the protected Material Tracker heartbeat RPC. It is workspace-scoped and does not use a global browser storage blob.
