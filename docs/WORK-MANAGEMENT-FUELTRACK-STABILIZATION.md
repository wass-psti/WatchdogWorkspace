# Stage E M24 — FuelTrack+ stabilization

M24 stabilizes the existing FuelTrack+ v3.17.0 compatibility island before any later iframe retirement. The production authority remains `apps/fueltrack-plus/app.v3.17.0-wm6.js` and Work Management authentication/module authorization remain authoritative.

## Stabilization boundaries

- App refresh now awaits `WMModuleStore.refresh()` before hydration, with generation guards and interaction deferral retained.
- Preferences and Activity Workspace use confirmed serial writes, reject conflict-merge divergence, and do not drop rapid successive UI changes.
- Request creation, lifecycle transitions, approval decisions, refueling completion, and request deletion use duplicate-mutation gates.
- Failed critical request writes reload authoritative request/activity state instead of restoring stale local snapshots.
- Approval decisions keep the dialog open until persistence is confirmed.
- FuelTrack+ consumes both native `storage` and `wm:module-store-change` synchronization events.
- Request/activity atomic commits verify the exact committed request payload.
- Analytics loads Apache ECharts 6.1.0 only from the Analytics route and keeps the existing chart as a non-fatal accessible fallback.

## Preserved business rules

M24 does not change FuelTrack+ role enforcement, request state transitions, approval semantics, refueling completion validation, or LightFuels inventory behavior. The current request model does not carry a fuel type/requested quantity suitable for automatic inventory deduction, so M24 does not invent one.

## Compatibility boundary

The same-origin FuelTrack+ iframe, `WMModuleStore`, module identity bridge, Activity bridge, normalized M22 module-state mapping, and existing authorized Supabase RPCs remain active. Their retirement is outside M24.

## Database

No M24 Supabase migration is required.
