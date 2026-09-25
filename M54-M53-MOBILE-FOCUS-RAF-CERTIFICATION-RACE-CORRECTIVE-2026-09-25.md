# M54 / M53 Mobile Focus RAF Certification Race Corrective — 2026-09-25

## Failure
Candidate 05 reached the dedicated M54 corrective certification and failed the M53 mobile-keyboard Playwright scenario immediately after opening the mobile navigation. The test observed `aria-expanded="true"` but sampled `document.activeElement` before the production shell's scheduled `requestAnimationFrame` focus transfer executed.

## Root cause
The runtime contract is asynchronous by design: `setShellMobileOpen(true)` synchronizes navigation presentation and then schedules focus into the first sidebar navigation/command element on the next animation frame. The historical M53 test asserted sidebar focus synchronously, creating a frame-scheduling race.

## Corrective
The M53 browser authority now uses Playwright `expect.poll` to wait, with a bounded 2-second timeout, until `document.activeElement` is contained by `#primarySidebar`. Escape/trigger-focus restoration assertions remain unchanged.

The M53 static and deterministic execution verifiers now fail closed unless the browser suite retains the asynchronous focus-settlement contract and remains bound to the runtime `requestAnimationFrame` implementation.

## Boundary
No production application behavior, route ownership, navigation semantics, Supabase schema, RLS, RBAC, or deployment configuration is changed. This corrective removes nondeterminism from the certification harness only.
