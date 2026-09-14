# M42 Database / RLS Corrective

State: implementation-complete-pending-certification.

## Verified failure boundaries

The target-Mac fail-closed run passed all six M42 Playwright scenarios, then stopped in the disposable Supabase pgTAP gate on two database defects:

1. `public.list_user_directory()` referenced `platform_role` and `status` without a table qualifier inside a `RETURNS TABLE` PL/pgSQL function. Those names collide with output variables and caused PostgreSQL to raise an ambiguous-column error before the nine M42 RBAC pgTAP assertions could execute.
2. `public.wm_runtime_capabilities()` used `set search_path=pg_catalog,public`, while `00_rls_structure.test.sql` requires every public SECURITY DEFINER function to include `search_path=public` exactly.

## Corrective implementation

- `supabase/schema.sql`: `list_user_directory()` now counts active administrators through alias `p` with `p.platform_role` and `p.status`; `wm_runtime_capabilities()` now uses `set search_path=public`.
- `supabase/migrations/v1.43.2-stage-g-m42-users-rbac-functional-recovery.sql`: synchronized qualified profile-column references.
- `supabase/migrations/v1.43.2-stage-g-m38-runtime-capability-preflight.sql`: synchronized `set search_path=public`.
- `supabase/migrations/v1.43.2-stage-g-m42-database-corrective.sql`: forward corrective migration for already-deployed databases.
- `verify-stage-g-m42-users-rbac-functional-recovery.mjs`: strengthened to fail if either verified defect reappears or if the forward corrective migration is absent.

## Local source-level evidence

- M42 static verification: PASS (50 checks).
- M42 deterministic execution verification: PASS (31 vectors).
- JavaScript verifier syntax checks: PASS.

The disposable Supabase pgTAP suite must be rerun on the target Mac before M42 can be certified.
