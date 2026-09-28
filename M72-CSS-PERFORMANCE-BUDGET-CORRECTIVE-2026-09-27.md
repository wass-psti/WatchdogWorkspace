# M72 CSS Performance Budget Corrective — 2026-09-27

## Originating failure

The M72 corrective-v3 local certification run passed deterministic, browser/E2E, TypeScript, hardening, UI, development-server, and production-build gates, then failed closed at the M31 production bundle budget because `initialCssRawBytes` was 592131 bytes against the certified 590000-byte ceiling.

## Root cause

`assets/css/foundation/host-ui-migration.css` added a 3012-byte host bridge containing several geometry rules already supplied by the existing host/application/shared feedback styles. The M31 ceiling is retained unchanged; increasing the budget would mask the regression.

## Corrective change

The M72 host-only bridge was reduced to the non-redundant rules required for shared primitive integration: host control containment, command-input normalization, update/toast grid framing, mobile update layout, reduced-motion fallback, and forced-colors fallback. The source layer is now 930 bytes.

The M72 deterministic verifier now enforces a 1200-byte source ceiling for this bridge so equivalent CSS bloat cannot silently return.

## Verification boundary

M72 static/deterministic verification passes after the reduction. A production bundle measurement remains a governed local certification gate because dependency materialization in the assistant container timed out before Vite build execution.
