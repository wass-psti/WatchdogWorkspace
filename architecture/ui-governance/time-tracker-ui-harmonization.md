# M74 TimeTracker UI Harmonization Architecture

M74 harmonizes the existing TimeTracker v2 presentation with the Stage H design system without changing attendance, GPS, OT, RBAC, persistence, module bootstrap, or Work Management identity ownership. `apps/time-tracker/app.js` remains a mixed presentation/workflow runtime, so separable domain/runtime authorities are hash-frozen while policy-critical hooks inside `app.js` are verified semantically. Shared classes are additive; existing TimeTracker selectors and event/data hooks remain authoritative for behavior.

The harmonized surfaces are navigation/status, Clock, Overview/metrics, Log/data regions, Reports/Calendar, OT/Roles, and dialogs/feedback. FuelTrack+ belongs to M75, TradeLink to M76, and final UI production certification to M77.
