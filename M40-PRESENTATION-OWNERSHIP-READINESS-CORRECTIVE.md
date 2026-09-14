# Stage G M40 — Presentation Ownership & Readiness Corrective

## Evidence addressed

The target-Mac M40 browser run demonstrated two remaining lifecycle defects:

1. `#/boards` could commit lifecycle owner `boards` while M38 backend preflight rendered the generic runtime surface and kept the Board presentation host inactive/hidden.
2. Same-URL RBAC/account-status transitions could commit `shell` or `auth` and render the correct restricted/disabled surface while focus remained on `BODY`.

## Corrective architecture

- RouteController now accepts a presentation resolver that runs before lifecycle `begin()`/commit.
- M38 capability readiness participates in presentation ownership. Pending/blocked gated routes are shell-owned while the backend-preflight surface is rendered. When the capability becomes ready, the same URL explicitly transitions from `shell` to its protected feature owner.
- Route focus no longer uses a bounded animation-frame retry loop.
- A presentation-readiness runtime retains one pending `{revision, owner}` focus request and completes it only when the matching presentation acknowledges a connected, visible focus target.
- Imperative runtime surfaces acknowledge immediately after their route `<main>` is patched.
- React Authentication, Account/Settings/Users, and Boards acknowledge readiness from `useLayoutEffect`, after their committed DOM surface exists.
- Superseding transitions cancel pending focus work; stale revisions cannot focus a newer surface.

## Scope boundaries

This corrective does not change M39 authentication/RBAC authority, M38 capability requirements, module business rules, Board domain/data behavior, database migrations, or Stage G M41+ functional recovery.

## Certification state

Implementation remains `implementation-complete-pending-certification` until the target-Mac M40 Playwright matrix, historical suite, release check, and activation transaction all pass.
