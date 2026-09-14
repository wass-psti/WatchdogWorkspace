# M39 browser authority certification corrective

This corrective keeps M39 scoped to authentication, session restoration/refresh, access-context hydration, RBAC reconciliation, and route authorization.

The initial M39 browser suite incorrectly used Account/Users management DOM ownership as the positive authorization oracle. Those presentation/lifecycle regressions are part of the M37 inventory and remain assigned to M40-M43 (Account specifically to M41, Users to M42). M39 must not repair or silently certify those downstream presentation surfaces.

The corrected browser contract now requires:

- authenticated runtime route ownership for the requested protected route;
- persisted admin and non-admin sessions across reload and a fresh same-browser application page;
- exact M38 module capability readiness through the read-only `backend-preflight.current` runtime diagnostic;
- no access-recovery or route-forbidden state for authorized routes;
- expired-token refresh with persisted rotated access/refresh tokens;
- live module-assignment revocation;
- live disabled-account revocation; and
- explicit recovery from a transient atomic access-context failure while preserving the stored refresh session.

The corrective does not modify Account, Users, or Settings presentation implementation. Those functional recovery milestones remain downstream.
