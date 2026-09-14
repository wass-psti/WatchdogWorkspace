# M42 — M40 Composition Stability Diagnostic Corrective

## Scope

This corrective pass is limited to the downstream M40 browser regression discovered during M42 certification. M42-specific browser and database/RLS gates were already proven green on the target Mac before this pass.

## Corrective changes

- Preserves `waitForM39Identity()` as the authoritative identity readiness contract used by M42.
- Adds `installM40CompositionDiagnostics(page)` to capture:
  - Playwright `pageerror` events;
  - browser console errors/warnings;
  - main-frame navigation;
  - `pageshow`, `pagehide`, `beforeunload`, and `unload`;
  - `hashchange`, window errors, and unhandled rejections;
  - React shell addition/removal under `#app` through a `MutationObserver`.
- Persists browser diagnostic events in session storage so a full-document reload cannot erase the evidence.
- Changes `waitForM40ApplicationReady()` from one-shot readiness to same-document stable readiness for at least 350 ms.
- Changes `expectCommittedSurface()` to require the committed owner/surface/host topology to remain stable for at least 250 ms before snapshot assertions.
- Includes collected diagnostics in committed-surface assertion errors.

## Source-level verification

- M42 static verification: PASS — 57 checks.
- M42 deterministic execution verification: PASS — 31 vectors.
- M40 static verification: PASS — 65 checks.
- M40 fixture/spec syntax: PASS.

## Environment limitation

The current execution environment could not restore `node_modules`: clean `npm ci` attempts terminated with a transport timeout. Therefore M42 browser and M40 deterministic/browser gates are intentionally not claimed as passing here. The target-machine run remains authoritative.

## Certification state

M42 remains `implementation-complete-pending-certification`. No M42 certified baseline or PASS record is created by this candidate.
