begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

select ok((select relrowsecurity from pg_class where oid='public.profiles'::regclass),'profiles has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.module_role_assignments'::regclass),'module_role_assignments has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.module_state_entries'::regclass),'module_state_entries has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.workspaces'::regclass),'workspaces has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.workspace_members'::regclass),'workspace_members has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.module_operation_locks'::regclass),'module_operation_locks has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.module_activity_events'::regclass),'module_activity_events has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.work_boards'::regclass),'work_boards has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.work_board_members'::regclass),'work_board_members has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.work_board_groups'::regclass),'work_board_groups has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.work_board_items'::regclass),'work_board_items has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.work_board_events'::regclass),'work_board_events has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.work_board_columns'::regclass),'work_board_columns has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.work_board_item_values'::regclass),'work_board_item_values has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.work_board_item_updates'::regclass),'work_board_item_updates has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.work_board_item_files'::regclass),'work_board_item_files has RLS enabled');

select ok(not has_table_privilege('anon','public.profiles','SELECT'),'anon has no direct profiles SELECT');
select ok(not has_table_privilege('authenticated','public.profiles','UPDATE'),'authenticated has no direct profiles UPDATE bypass');
select ok(not has_table_privilege('authenticated','public.module_role_assignments','INSERT'),'authenticated has no direct module-role INSERT bypass');
select ok(not has_table_privilege('authenticated','public.module_role_assignments','UPDATE'),'authenticated has no direct module-role UPDATE bypass');
select ok(not has_table_privilege('authenticated','public.module_role_assignments','DELETE'),'authenticated has no direct module-role DELETE bypass');

select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_self_or_admin_select'),'profiles self/admin SELECT policy exists');
select ok(not exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_admin_update'),'direct admin profiles UPDATE policy is retired');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='module_role_assignments' and policyname='assignments_self_or_admin_select'),'module role self/admin SELECT policy exists');
select ok(not exists(select 1 from pg_policies where schemaname='public' and tablename='module_role_assignments' and policyname='assignments_admin_insert'),'direct module-role INSERT policy is retired');
select ok(not exists(select 1 from pg_policies where schemaname='public' and tablename='module_role_assignments' and policyname='assignments_admin_update'),'direct module-role UPDATE policy is retired');
select ok(not exists(select 1 from pg_policies where schemaname='public' and tablename='module_role_assignments' and policyname='assignments_admin_delete'),'direct module-role DELETE policy is retired');

select ok(not has_function_privilege('anon','public.is_platform_admin(uuid)','EXECUTE'),'anon cannot execute is_platform_admin');
select is(
  (select count(*)::integer
   from pg_proc p
   join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'
     and p.prosecdef
     and p.prorettype<>'trigger'::regtype
     and has_function_privilege('anon',p.oid,'EXECUTE')),
  0,
  'anon cannot execute any non-trigger public SECURITY DEFINER function'
);
select ok(has_function_privilege('authenticated','public.is_platform_admin(uuid)','EXECUTE'),'authenticated can execute is_platform_admin for RLS evaluation');

select ok(exists(select 1 from storage.buckets where id='work-board-files' and public=false),'work-board-files bucket is private');
select is((select file_size_limit from storage.buckets where id='work-board-files'),20971520::bigint,'work-board-files size limit is 20 MiB');

select ok(exists(select 1 from pg_policies where schemaname='realtime' and tablename='messages' and policyname='wm_board_realtime_receive'),'Realtime receive policy exists');
select ok(exists(select 1 from pg_policies where schemaname='realtime' and tablename='messages' and policyname='wm_board_realtime_presence_track'),'Realtime presence-track policy exists');
select is((select count(*)::integer from pg_policies where schemaname='realtime' and tablename='messages' and cmd='INSERT'),1,'Realtime exposes exactly one authenticated INSERT policy (presence only)');

select is(
  (select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prosecdef and not (coalesce(p.proconfig,'{}'::text[]) @> array['search_path=public']::text[])),
  0,
  'all public SECURITY DEFINER functions pin search_path=public'
);
select ok(
  not exists(
    select 1
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
    where n.nspname='public'
      and p.prosecdef
      and p.prorettype<>'trigger'::regtype
      and acl.grantee=0
      and acl.privilege_type='EXECUTE'
  ),
  'non-trigger public SECURITY DEFINER functions are not executable by PUBLIC'
);

select ok(
  not has_table_privilege('authenticated','public.work_boards','SELECT')
  and not has_table_privilege('authenticated','public.module_state_entries','SELECT')
  and not has_table_privilege('authenticated','public.module_activity_events','SELECT')
  and not has_table_privilege('authenticated','public.workspace_members','SELECT'),
  'RPC-owned domain tables are not directly readable by authenticated clients'
);

select * from finish();
rollback;
