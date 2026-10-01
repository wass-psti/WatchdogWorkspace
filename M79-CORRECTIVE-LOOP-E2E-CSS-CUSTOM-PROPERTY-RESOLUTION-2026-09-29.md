# M79 Corrective Loop — Browser CSS Custom-Property Resolution

## Origin

The first local M79 fail-closed certification attempt reached Stage 6 (Browser/E2E) after environment, source identity, dependency integrity, static analysis, type checking, production build, and deterministic token/theme gates had passed.

## Failure

The Playwright test inspected computed CSS custom properties and expected authored `var(...)` expressions. Chromium returned the computed value of `--wm-semantic-density-control-default` as `36px`, while the test expected `var(--wm-density-control-default)`.

## Root cause

This was a verification-layer defect. CSS custom properties are substituted at computed-value time. A browser-runtime assertion therefore cannot require the authored `var(...)` token stream when it is reading `getComputedStyle(...)`. Source-level alias provenance and runtime semantic resolution are distinct verification responsibilities.

## Corrective delta

- Source-level alias provenance remains enforced by the M79 static/deterministic verifiers against `assets/css/foundation/token-architecture.css` and the primitive/theme authorities.
- The browser verifier now compares each computed semantic role to its computed primitive/reference value for density, breakpoint documentation tokens, blur, and theme accent roles.
- Runtime concrete expectations remain for governed density (`36px`), tablet breakpoint (`840px`), blur overlay (`14px`), rendered light/dark accent colors, surface colors, radius, and transition duration.
- The M79 static verifier now fails if the browser test regresses to expecting authored `var(...)` expressions from computed styles.
- M79 browser-runner diagnostics were corrected to reference M79 rather than the inherited M30 wording.

## Regression surface

No authentication, authorization, routing, persistence, Supabase, database schema, migration, module-domain, or deployment behavior is modified by this correction. The M78 source guard remains authoritative for all non-M79 mutation boundaries.

## Exit criterion

The corrective loop is exited only when a fresh full fail-closed M79 local certification run passes Browser/E2E and every downstream required gate through final checkpoint validation, producing a verified certified M79 baseline and PASS record.
