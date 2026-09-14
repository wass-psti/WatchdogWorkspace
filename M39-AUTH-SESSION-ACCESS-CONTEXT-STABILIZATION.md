# Stage G M39 implementation record

M39 stabilizes session restoration, token rotation, atomic access-context hydration, account-status enforcement, RBAC reconciliation, and route authorization. The milestone is intentionally fail-closed: a browser session alone never grants application authority until the current database access context has been validated.

M38 is retained as the certified prerequisite. Account/Users/Settings visual/lifecycle recovery remains downstream in M40-M43; M39 only makes the identity and authorization authority reliable for those milestones. M39 browser certification therefore validates positive route authorization independently from the known M37 management-presentation regressions rather than using Account/Users DOM ownership as an auth success oracle.

The final M39 lifecycle corrective also makes deferred shell synchronization authorization-safe and preserves the protected route across transient access-context recovery. These are M39 runtime lifecycle guarantees; they do not certify the downstream Account/Users/Settings presentation regressions assigned to M40-M43.
