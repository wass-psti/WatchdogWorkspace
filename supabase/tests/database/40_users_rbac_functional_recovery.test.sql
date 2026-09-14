begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users(id,email) values
 ('42000000-0000-4000-8000-000000000001','m42-admin-a@test.local'),
 ('42000000-0000-4000-8000-000000000002','m42-admin-b@test.local'),
 ('42000000-0000-4000-8000-000000000003','m42-user@test.local');
update public.profiles set platform_role='admin_general_manager' where id in ('42000000-0000-4000-8000-000000000001','42000000-0000-4000-8000-000000000002');
select public.sync_module_roles('42000000-0000-4000-8000-000000000001','admin_general_manager',null);
select public.sync_module_roles('42000000-0000-4000-8000-000000000002','admin_general_manager',null);

set local role authenticated;
set local request.jwt.claim.sub='42000000-0000-4000-8000-000000000001';
select ok((select is_self from public.list_user_directory() where id='42000000-0000-4000-8000-000000000001'),'directory identifies current administrator');
select ok(not (select is_self from public.list_user_directory() where id='42000000-0000-4000-8000-000000000003'),'directory does not mark another account as self');
select ok(not (select is_last_active_admin from public.list_user_directory() where id='42000000-0000-4000-8000-000000000001'),'two active administrators are not reported as last admin');
select is((select status from public.admin_set_user_access('42000000-0000-4000-8000-000000000003','supervisor','disabled') limit 1),'disabled','Admin can disable another account transactionally');
select is((select role from public.module_role_assignments where user_id='42000000-0000-4000-8000-000000000003' and module_id='time-tracker'),'Supervisor','role mutation synchronizes derived module role in same transaction');
select throws_ok($$select * from public.admin_set_user_access('42000000-0000-4000-8000-000000000001','admin_general_manager','disabled')$$,'P0001','You cannot disable your own active administrator account','self-disable remains rejected');
select is((select platform_role from public.admin_set_user_access('42000000-0000-4000-8000-000000000001','employee','active') limit 1),'employee','self-role demotion is allowed while another active admin exists');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='42000000-0000-4000-8000-000000000003';
select throws_ok($$select * from public.list_user_directory()$$,'P0001','Administrator access required','unauthorized role cannot load administrative directory');
select throws_ok($$select * from public.admin_set_user_access('42000000-0000-4000-8000-000000000002','employee','active')$$,'P0001','Administrator access required','unauthorized role cannot mutate user access');
reset role;

select * from finish();
rollback;
