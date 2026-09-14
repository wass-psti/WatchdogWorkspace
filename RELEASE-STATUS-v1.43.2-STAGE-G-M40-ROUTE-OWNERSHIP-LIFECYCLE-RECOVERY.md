# Work Management App v1.43.2 — Stage G M40 Release Status

## Milestone

Stage G M40 — React/Runtime Route Ownership & Lifecycle Recovery

## Current state

`active-certified`

Architecture: 48

## Implemented and source-verified

- Exclusive route presentation ownership across Home, Boards, Users, Settings, Account, authentication surfaces, and embedded applications.
- Generation-guarded transition commit semantics and stale-transition rejection.
- Deterministic owner deactivation/activation and embedded-host teardown.
- Route-scoped command/account/tooltip/global-overlay cleanup.
- Owner-acknowledged presentation readiness with generation-guarded focus completion and cancellation by superseding transitions.
- Same-URL disabled/recovery/forbidden presentation ownership.
- Repeated-navigation browser matrix with three full route cycles and singleton-host assertions.
- Capability-aware precommit presentation ownership so M38 preflight surfaces remain shell-owned until protected feature readiness is confirmed.
- Target-Mac browser corrections for the previous no-op same-hash test, same-URL focus race, and Boards ownership/preflight contradiction.

## Verification completed in the build environment

- M40 static: 62 checks PASS after the capability-gate, same-URL generation-guard, and Playwright iframe auth-fixture correctives.
- M40 deterministic: 11/11 PASS, including actual runtime helper validation that a newer same-URL lifecycle generation invalidates deferred presentation work.
- M39 compatibility: 48 checks PASS; deterministic 10/10 PASS.
- M38 compatibility: 87 checks PASS; deterministic 7/7 PASS.
- TypeScript: PASS.
- UI static suite: PASS.
- Historical collector: 150/150 PASS.
- Secret scan: PASS.
- Playwright discovery: 3 M40 scenarios.

## Capability gate authority corrective

The target-Mac failure evidence showed a time-of-check/time-of-use contradiction: `resolveBackendCapabilityPresentation()` could select the protected owner while the route renderer immediately performed a second `backendCapabilityPreflight.moduleReady()` check and fell back to the shell runtime/preflight surface. That produced lifecycle owner `boards`/`account` while the protected React host remained hidden.

The corrective removes renderer-level capability re-gating. Backend capability state is now evaluated exactly once by the precommit presentation resolver. If a capability is not ready, the resolver commits shell ownership and renders M38 preflight. If it is ready, the resolver commits the protected owner and the selected renderer cannot downgrade to a different presentation after ownership has been chosen.

A static M40 regression guard now rejects reintroduction of the second gate.

## Certification completed

M40 is active-certified. The exact Browser Validation Candidate source/runtime tree identified by SHA-256 `fa12ce5aee4a361d9c45b018785601b14060e3c9708e17ec6f9a2f88235759bf` passed the target Mac M40 browser gate on 2026-09-12 with `3 passed (9.0s)`, including three repeated route cycles across Home, Boards, Users, Settings, Account, TimeTracker, and TradeLink, same-URL revocation, disabled-account ownership, and `duplicateHosts=0`.

Final certification promotion changes only certification metadata. Runtime, route-lifecycle, focus-reconciliation, presentation ownership, Playwright test logic, and application code are unchanged from the browser-passing tree. Local certification verification additionally passed M40 static (65 checks), M40 deterministic execution (11/11), dependency preflight (15 exact dependencies), and the historical verifier collector (150/150).

## Downstream scope not claimed by M40

M41 Account recovery, M42 Users/RBAC recovery, M43 Settings recovery, M44 management authority consolidation, M45-M51 Boards functional recovery, M52 cross-module authenticated E2E, M53 hardening, and M54 production-readiness certification remain outstanding.

## Route Commit & Focus Corrective

The corrective preserves the committed lifecycle generation for unchanged same-owner refreshes so pending generation-guarded focus work is not invalidated. Browser surface assertions now wait for the final singular visible presentation and emit a complete diagnostic snapshot if that contract does not settle within five seconds. This corrective is now covered by the completed M40 certification evidence tied to the target Mac 3/3 browser run.

## Presentation ownership/readiness corrective

The latest target-Mac browser evidence showed that backend capability gating could render a shell-owned M38 preflight surface after M40 had already committed the protected route owner, and that same-URL restricted/disabled transitions could render correctly while focus remained on `BODY`. The corrective now resolves M38-gated presentation ownership before lifecycle commit and uses explicit presentation-ready acknowledgement for focus completion. Certification remains pending until the target-Mac browser/release transaction passes.

## Same-URL deferred presentation corrective

The subsequent target-Mac run proved that removing renderer-level capability re-gating was necessary but not sufficient. Deferred shell work was still validated only by URL identity, so an older callback could remain eligible when a newer lifecycle generation committed on the same hash. In addition, asynchronous sidebar Board-resource hydration could complete later and call `publishReactShell(...)` despite not owning route presentation.

The runtime now carries a presentation-frame token containing route key, lifecycle revision, and owner. Deferred work is accepted only when the shell is still active and the exact lifecycle generation/owner remains committed. Sidebar Board-resource hydration captures the same token, aborts after any ownership/generation change, and no longer calls `publishReactShell(...)` at all. Presentation writes are therefore limited to the route lifecycle/render paths and ownership-aware shell synchronization.

Static verification now explicitly rejects asynchronous sidebar presentation writes, and deterministic verification exercises the actual frame-guard helper against a same-URL newer-generation transition.


## Playwright same-origin iframe auth-fixture corrective

The remaining M40 route-cycle browser failure was traced to the certification fixture rather than route ownership. `page.addInitScript()` runs for the top-level page and subsequently attached frames. The M39 fixture therefore reseeded `wm.platform.auth.session.v1` when a same-origin TimeTracker or TradeLink iframe initialized. Because the seeded expiry used `Date.now()`, the iframe wrote a different session value into origin-shared `localStorage`; the top-level application received that storage event and legitimately entered `auth.init({ forceStorage:true })`, temporarily producing the observed `owner=auth`, `authenticated=false`, `authView=boot` state on an application route.

The fixture now exits immediately unless `window.top === window`, so only the Work Management top-level document may seed platform auth. The repeated M40 application-route cycle additionally snapshots the platform session after initial identity restoration and asserts that each embedded application transition leaves that session byte-for-byte unchanged.

## Route-focus reconciliation corrective

The repeated route-cycle focus timeout was isolated to a retiring command-palette autofocus race. The implementation now blocks stale palette autofocus after synchronous route teardown and performs a single lifecycle-generation-guarded BODY-focus reconciliation on the next animation frame. The 3-scenario M40 Playwright gate passed on the exact validation tree before certification metadata promotion.

