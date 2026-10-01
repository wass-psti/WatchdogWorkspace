# M96 Corrective Loop — M77 Successor Protected Authority

**Classification:** CORRECTIVE LOOP

## Origin
The M96 v2 local certification passed the corrected M96 real-browser gate, dedicated M96 certification, post-certification validation, and the 212/212 historical verifier collector, then failed inside aggregate `release:check` at `final-ui:test`.

## Failed gate
`scripts/verify-stage-h-m77-final-ui-production-certification-execution.mjs` rejected `apps/tradelink/app.v1.42.0-wm1.js` because its M77 frozen SHA predates the M96 retirement of the obsolete `wmTradeLinkHarmonized` presentation marker.

## Root cause
Historical-verifier successor-governance drift. M96 already authorizes the TradeLink file mutation and its M76 successor verifier requires the transitional marker to be absent, while the M77 deterministic verifier still required byte identity for that entire historical file.

## Corrective delta
M77 remains strict by default. When an explicit M96 successor target and source-guard manifest are present, M96 may diverge from M77 only for the complete, explicitly enumerated retirement surface: the TimeTracker, FuelTrack+, and TradeLink runtime files whose obsolete M74/M75/M76 presentation markers were removed, plus the three retired harmonization stylesheets. Each mutation/removal must be explicitly authorized by the M96 source guard, and each runtime verifier requires its obsolete marker to be absent. All unrelated M77 protected authorities remain SHA-frozen.

## Exit criterion
The M77 deterministic verifier, M96 source/static/deterministic gates, aggregate `release:check`, package hygiene, final checkpoint, and certified publication must all pass.
