# M85 — TimeTracker Visual Migration

M85 is a presentation-only successor to the certified M84 baseline and the M74 TimeTracker harmonization layer. It migrates Overview, Clock, Log, Reports, Calendar, Roles, OT, GPS/map evidence, forms/dialogs, and responsive states without changing TimeTracker domain/runtime ownership.

Protected semantics remain owned by `apps/time-tracker/domain-config.js`, `apps/time-tracker/app.js`, and `apps/time-tracker/stability-runtime.js`: TimeTracker-specific roles/capabilities, Offsite (Home) work-note policy, GPS acquisition/evidence, 08:00 late threshold, 12:00–13:00 unpaid break, 9 credited-hour requirement, launch-only automatic clock-out, approved-OT threshold extension, audit evidence, and cloud persistence.
