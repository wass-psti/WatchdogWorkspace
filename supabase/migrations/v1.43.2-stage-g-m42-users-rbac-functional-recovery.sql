-- Work Management v1.43.2 — Stage G M42 Users / RBAC Functional Recovery.
-- Restores transactional Admin user management and closes concurrent last-admin races.
begin;

drop function if exists public.list_user_directory();
create function public.list_user_directory()
returns table(
  id uuid, email text, display_name text, platform_role text, status text,
  created_at timestamptz, updated_at timestamptz,
  is_bootstrap_admin boolean, is_self boolean, is_last_active_admin boolean
)
language plpgsql security definer set search_path=public as $$
declare caller uuid := auth.uid(); active_admins integer;
begin
  if not public.is_platform_admin(caller) then raise exception 'Administrator access required'; end if;
  select count(*) into active_admins from public.profiles p where p.platform_role='admin_general_manager' and p.status='active';
  return query select p.id,p.email,p.display_name,p.platform_role,p.status,p.created_at,p.updated_at,
    lower(coalesce(p.email,''))='lmsenagan@watchdogautomation.com.ph',
    p.id=caller,
    (p.platform_role='admin_general_manager' and p.status='active' and active_admins<=1)
  from public.profiles p order by lower(coalesce(p.display_name,p.email)),lower(p.email);
end;
$$;

create or replace function public.admin_set_user_access(p_user_id uuid,p_platform_role text,p_status text)
returns setof public.profiles language plpgsql security definer set search_path=public as $$
declare target public.profiles%rowtype; active_admins integer;
begin
  perform pg_advisory_xact_lock(42420042);
  if not public.is_platform_admin(auth.uid()) then raise exception 'Administrator access required'; end if;
  if p_platform_role not in ('admin_general_manager','hr','supervisor','employee') then raise exception 'Unsupported role'; end if;
  if p_status not in ('active','disabled') then raise exception 'Unsupported account status'; end if;
  select * into target from public.profiles where id=p_user_id for update;
  if not found then raise exception 'User account not found'; end if;
  if lower(coalesce(target.email,''))='lmsenagan@watchdogautomation.com.ph' and (p_platform_role<>'admin_general_manager' or p_status<>'active') then raise exception 'The bootstrap administrator cannot be demoted or disabled'; end if;
  if p_user_id=auth.uid() and p_status='disabled' then raise exception 'You cannot disable your own active administrator account'; end if;
  if target.platform_role='admin_general_manager' and target.status='active' and (p_platform_role<>'admin_general_manager' or p_status<>'active') then
    select count(*) into active_admins from public.profiles p where p.platform_role='admin_general_manager' and p.status='active';
    if active_admins<=1 then raise exception 'At least one active Admin/General Manager is required'; end if;
  end if;
  update public.profiles set platform_role=p_platform_role,status=p_status where id=p_user_id;
  perform public.sync_module_roles(p_user_id,p_platform_role,auth.uid());
  return query select * from public.profiles where id=p_user_id;
end;
$$;

revoke all on function public.list_user_directory() from public;
revoke all on function public.admin_set_user_access(uuid,text,text) from public;
grant execute on function public.list_user_directory() to authenticated;
grant execute on function public.admin_set_user_access(uuid,text,text) to authenticated;

notify pgrst, 'reload schema';
commit;
