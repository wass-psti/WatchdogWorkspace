# Stage G M40 — Route Commit & Focus Corrective

## Scope
This corrective addresses only the browser failures observed after the M40 Browser Lifecycle Corrective RC.

## Verified root causes
1. The lifecycle coordinator created a new revision for repeated renders of the same already-committed route and owner. A pending generation-guarded focus handoff from the real ownership transition was therefore invalidated, while unchanged presentations do not run the transition after-hook. The result was a committed final surface with no surviving focus handoff.
2. The repeated route-cycle browser check inspected React-owned visibility immediately after the imperative lifecycle reported committed. React host visibility can settle after that synchronous lifecycle commit, producing a false surface mismatch even though the final presentation becomes singular and correct.

## Corrections
- `createRouteLifecycleCoordinator().begin()` now returns the current revision without publishing a new transitioning snapshot when the route, route identifiers, owner, and committed phase are unchanged.
- The deterministic M40 suite now proves that an unchanged committed presentation preserves the active generation and cannot supersede pending generation-scoped work.
- The M40 Playwright helper now waits (maximum 5 seconds) for the lifecycle, context, and exactly one visible expected presentation surface to agree before asserting singleton host invariants. Failure output includes the route hash, lifecycle snapshot, runtime context, visible surfaces, host counts, focus target, management/board/auth route metadata, and hidden-state flags.

## Non-goals
This corrective does not change M39 authentication/RBAC rules, Account/Users/Settings business functionality, Boards domain/data behavior, embedded application business logic, Supabase migrations, or the M26/M28 compatibility boundaries.

## Certification
M40 remains `implementation-complete-pending-certification` until the target Mac passes all three M40 browser scenarios, the historical suite, the global release gate, and the transactional M40 activation script.
