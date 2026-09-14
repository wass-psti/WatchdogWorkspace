-- Work Management v1.43.2 — Stage F M29 Database/RLS test-suite hardening.
-- Closes direct-table authorization bypasses exposed by the new pgTAP suite.
begin;

-- Profile role/status changes must pass through admin_set_user_access(), which enforces
-- bootstrap-admin, self-disable, last-admin, validation, and derived module-role invariants.
revoke update on table public.profiles from authenticated;
drop policy if exists "profiles_admin_update" on public.profiles;

-- Platform role is authoritative. Module assignments are derived only by sync_module_roles().
-- Direct authenticated DML would allow drift between platform and module authorization.
revoke insert, update, delete on table public.module_role_assignments from authenticated;
drop policy if exists "assignments_admin_insert" on public.module_role_assignments;
drop policy if exists "assignments_admin_update" on public.module_role_assignments;
drop policy if exists "assignments_admin_delete" on public.module_role_assignments;

-- This helper is required by authenticated RLS policies, but anonymous callers do not need
-- a public EXECUTE surface that can probe platform-administrator status by UUID.
revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
