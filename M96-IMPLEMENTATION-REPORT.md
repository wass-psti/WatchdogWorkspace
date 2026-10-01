# M96 Implementation Report — Visual Consistency & Legacy Styling Retirement

## Defined scope

M96 removes obsolete styling bridges and presentation markers whose responsibilities have already moved to Stage-I successor authorities. The cleanup is deliberately presentation-only and fail-closed against M95.

## Implemented repository delta

1. Retired five one-off CSS bridge files and removed their runtime imports/links.
2. Consolidated still-effective bridge declarations under M84, M85, M86, M87, and M95.
3. Deleted declarations already superseded by later Stage-I styling instead of carrying duplicate rules forward.
4. Removed M74/M75/M76 transitional runtime presentation attributes.
5. Removed four repository-proven unused custom properties: `--m85-tt-gap-xs`, `--m85-tt-gap-sm`, `--m87-tl-raised`, and `--wm-m95-responsive-inline-gutter`.
6. Marked M75/M76 historical reconciliation-layer configuration paths as retired and recorded current successor authorities.
7. Synchronized M72–M78 and M84–M87 historical verifiers so they preserve semantics without requiring retired presentation files.
8. Added M96 source guard, static/deterministic/browser verification, certification, package hygiene, final-checkpoint, and publication controls.
9. Corrected the M96 browser resource-retirement assertion after local v1 certification proved that Vite SPA fallback returned HTTP 200 HTML for a physically absent CSS path. The corrected assertion validates response identity (`text/css` is forbidden; successful fallback must be HTML) rather than assuming HTTP 2xx means the retired asset exists.

## Explicitly unchanged

Database schema, Supabase migrations, backend APIs, authentication/session semantics, authorization/RBAC, persistence, route ownership, TimeTracker attendance/GPS/OT policy, FuelTrack+ request/approval/refueling policy, and TradeLink workflow/PDF/recovery logic are outside M96 and are not intentionally modified.

## Verification evidence

### Implementation checkpoint evidence

- M96 source guard: PASS, bound to the M95 certified ZIP/source provenance.
- M96 static verifier: PASS (`42` live CSS files; `1,201,822` CSS source bytes; `5` retired one-off layers).
- M96 deterministic retirement verifier: PASS.
- M72–M78 targeted historical retirement/successor gates: PASS.
- M84–M87 targeted Stage-I visual successor gates: PASS.
- M95 responsive static/deterministic successor gates: PASS.

### Local v1 certification evidence

- Environment: Node v22.16.0, npm 10.9.2, Git 2.55.0.
- Repository checksum validation: PASS.
- M96 M95-certified source guard: PASS (`2338` baseline files; `33` allowed mutations; `5` allowed removals; `23` allowed new files).
- `npm ci`: PASS (`264` packages installed; `0` vulnerabilities).
- Installed dependency tree verification: PASS (`264` lockfile packages verified).
- M96 static verification: PASS.
- Typecheck: PASS.
- ESLint: PASS.
- Production build: PASS (`5059` modules transformed).
- M96 deterministic retirement verification: PASS.
- M96 browser suite: 4/5 PASS; only the retired-resource HTTP-status assertion failed because Vite SPA fallback served HTML with HTTP 200 for an absent CSS URL.

### Corrective root cause and delta

The failed browser assertion tested `response.ok() === false`, which is not a valid absence predicate under SPA fallback routing. Repository/static evidence independently confirmed all five retired CSS files were absent. The corrective delta changes the test to accept either a non-success response or an HTTP-success HTML fallback, while explicitly rejecting `text/css`. No retired CSS was restored and no production behavior was changed.

Full local/browser/release certification remains mandatory before M96 may become FULLY COMPLETE.

## Corrective v3 — M77 successor protected-authority synchronization
M96 v2 certification exposed a stale M77 deterministic SHA assertion for the M96-authorized TradeLink presentation-marker retirement. The M77 verifier is now successor-aware only for that explicitly governed file; all unrelated M77 protected authorities remain digest-frozen. Full local certification remains required.

- M95→M96 historical source-guard delegation synchronized: predecessor Stage-I guard now fail-closed delegates to the M96→M95 guard when the exact M96 successor binding is present; pure M95 behavior remains strict and unchanged.


## Corrective v4 — Stage-I source-guard delegation synchronization
The v3 aggregate release gate exposed a stale predecessor-guard boundary: `token-theme:source-guard` eventually delegated to the M95→M94 source guard, which evaluated the M96 successor tree directly against the M94/M95 predecessor allowlist and rejected legitimate M96 mutations/removals/additions. M96 v4 adds a fail-closed M95→M96 delegation bound to the exact certified M95 prerequisite hashes. The M96→M95 guard remains authoritative for M96 trees; pure M95 trees remain strictly checked against M94. Targeted verification now passes for the direct M95 guard, the previously failing `token-theme:source-guard`, the M96 guard/static/deterministic gates, M74–M77, M85–M87, and M95 responsive regression checks.
