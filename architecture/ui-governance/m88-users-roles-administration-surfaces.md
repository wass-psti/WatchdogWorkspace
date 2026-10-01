# M88 Users, Roles & Administration Surfaces

M88 is a presentation-only Stage I successor for the Work Management Users administration surface. M42 remains the serialized user/RBAC mutation and database-policy authority; M44 remains the consolidated React management runtime authority. M88 does not modify schema, migrations, Supabase RPC behavior, global RBAC semantics, application-scoped role policies, or module runtime authorization.

## Scope
- Users directory and administration toolbar
- Global platform-role policy presentation
- Per-user role/status forms and protected states
- Access-denied administration state
- Explicit global-vs-application role-boundary presentation
- Responsive, reduced-motion and forced-colors behavior

## Authorization boundary
Work Management global roles remain Admin/General Manager, HR, Supervisor and Employee. TimeTracker and FuelTrack+ keep their certified application-scoped role vocabularies and permission policies. TradeLink document workflow/approval/recovery/VAT/PDF authorities are not converted into Work Management platform roles.
