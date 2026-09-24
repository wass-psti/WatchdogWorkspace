# M54 / M40 Backend Preflight Readiness Corrective — 2026-09-24

## Failure
Candidate 02 reached the historical M40 route-lifecycle browser gate and failed while navigating to Boards. The M40 waiter observed a valid Boards-owned committed surface, but an outstanding M38 backend-capability preflight completion subsequently re-rendered the same capability-gated route through temporary shell ownership.

## Root cause
`waitForM40ApplicationReady()` declared the browser ready after authentication, lifecycle commit, and host-count stabilization only. It did not require the M38 backend capability preflight to reach a terminal state. M40 then began capability-gated route cycling while an earlier asynchronous M38 transaction could still legitimately render the preflight shell.

## Correction
The shared M39/M40 browser fixture now requires `backend-preflight.current.state` to be terminal (`ready` or `blocked`) before declaring the application ready. This preserves production fail-closed behavior and removes cross-authority startup races from the M40 ownership test without relaxing timeouts or route assertions.

## Boundary
No production routing, authorization, or backend-preflight behavior was changed. The correction is confined to historical browser synchronization.
