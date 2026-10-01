# TimeTracker Visual Migration Governance

M85 owns presentation only. M23 remains runtime stabilization authority and M74 remains the predecessor TimeTracker design-system harmonization authority. M85 must not mutate `domain-config.js`, `app.js`, or `stability-runtime.js`; the M85→M84 source guard enforces that boundary.
