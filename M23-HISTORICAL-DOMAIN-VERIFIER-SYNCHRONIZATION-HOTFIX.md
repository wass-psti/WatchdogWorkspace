# M23 Historical TimeTracker Domain Verifier Synchronization Hotfix

## Scope

The v1.27 domain/browser quality verifier previously required `apps/time-tracker/app.js` to begin at byte zero with the domain destructuring statement. M23 intentionally adds `WMTimeTrackerStability` as a prelude before the existing `WMTimeTrackerDomain` destructuring.

The historical verifier now validates the actual architectural invariant instead:

- TimeTracker consumes `globalThis.WMTimeTrackerDomain`.
- The domain destructuring occurs before application-state initialization.
- The M23 stabilization prelude may appear first.

No TimeTracker production behavior, attendance policy, persistence contract, dependency, or Supabase schema is changed by this hotfix.
