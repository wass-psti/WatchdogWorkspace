# M39 Kanban M7 Release-Gate Corrective

## Scope

This corrective addresses the global `release:check` blocker encountered after all M39-specific authentication/session/access-context gates passed. It does not change M39 authentication, session, RBAC, access-context, or recovery semantics.

## Verified root cause

Milestone 7 defines `--wm-board-kanban-lane-width: 312px` as the semantic Kanban lane width. The current desktop Kanban rule used `grid-auto-columns:minmax(var(--wm-board-kanban-lane-width),1fr)`, which allowed four implicit lanes to expand on wide viewports. The real Chromium release audit requires lane geometry between 280px and 340px and therefore rejected the expanded desktop lane width.

The existing responsive branches at <=1180px, <=820px and <=600px already consume the fixed semantic lane-width token (or cap it by viewport width). The inconsistent branch was the wide-viewport base rule.

## Correction

The wide-viewport rule now uses `grid-auto-columns:var(--wm-board-kanban-lane-width)`, keeping each Kanban lane at the semantic 312px width and preserving horizontal scrolling for additional lanes.

The Milestone 7 static verifier now also rejects reintroduction of `minmax(var(--wm-board-kanban-lane-width),1fr)` and requires the fixed semantic lane-width rule.

## Certification boundary

This corrective removes the Boards/Kanban M7 global release-gate blocker discovered during M39 activation. M39 must still remain `implementation-complete-pending-certification` until the complete release/certification sequence succeeds on the target macOS environment and the activation script reports `active-certified`.
