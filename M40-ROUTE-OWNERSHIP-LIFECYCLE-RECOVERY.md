# Stage G M40 — React/Runtime Route Ownership & Lifecycle Recovery

## Scope

M40 repairs the navigation lifecycle across Home, Boards, Users, Settings, Account, and embedded applications. It does not claim downstream feature correctness for the M41–M51 recovery milestones.

## Implemented authority

- Architecture 48 introduces a typed generation-based route lifecycle coordinator.
- Route ownership follows the surface actually rendered, not only the URL: disabled/recovery/wait states are Auth-owned, forbidden states are neutral Shell-owned, and allowed routes use their manifest feature owner.
- Embedded module presentation is detached for every non-allowed app decision, including redirect, disabled/recovery, and same-URL RBAC revocation.
- Account, Settings, and Users now participate in feature lifecycle activation/deactivation despite sharing one React management runtime; deactivation increments the management epoch and clears route-scoped busy state.
- Changed route presentations close the command palette, account menu, shell tooltip, global overlay claim, and mobile navigation before ownership changes.
- Focus transfer occurs only after a committed route generation and stale generations cannot steal focus from a newer navigation.
- Embedded module teardown cancels the module load watchdog in addition to disposing iframe/native presentation handles.
- Existing Board deactivation remains authoritative for pending data loads, realtime, viewport listeners, preference writes, virtualization frames, drag/drop, resize, inline editing, selection/history, menus, overlays, item workspace state, workflows, and dialogs.

## Verification boundary

Static and deterministic verification can run without a browser. Final certification requires the M40 Playwright matrix on the governed Node 22.16.0 toolchain. The matrix performs three repeated cycles across Home, Boards, Users, Settings, Account, TimeTracker, and TradeLink, verifies exactly one active route surface and singleton React/runtime/Board/overlay hosts, checks commit-scoped focus, closes a command overlay during transitions, and covers same-URL RBAC/disabled ownership transfer.

## Remaining boundaries

- M26 same-origin iframe compatibility remains for embedded applications that have not met native-retirement criteria.
- Boards retain their React presentation facade / imperative Board engine boundary pending M45+ recovery.
- M41, M42, and M43 own Account, Users/RBAC, and Settings functional recovery beyond route lifecycle.
- Overall production readiness remains blocked until M54.


## Browser lifecycle corrective continuation

The target-Mac certification run exposed two issues in the first M40 browser pass. The repeated-route test attempted to treat assigning the already-current `#/` hash as a route transition; that is a browser no-op and does not dispatch `hashchange`. The matrix now orders routes so every overlay assertion follows a real transition and explicitly fails if a requested navigation target already equals the current hash.

The same run also showed that a same-URL management-to-authentication ownership transfer could commit before the new React authentication surface was mounted, causing a single-frame focus attempt to miss `#main`. M40 now scopes focus targets by presentation owner, rejects non-rendered targets, retries for a bounded eight animation frames while the committed generation remains current, and cancels pending focus when a newer transition begins.

Same-URL identity-revalidation browser steps now start revalidation asynchronously and separately verify successful settlement. This keeps M39 authority validation intact while avoiding coupling Playwright's evaluate call to presentation timing. The corrective is documented in `M40-BROWSER-LIFECYCLE-CORRECTIVE.md`.
