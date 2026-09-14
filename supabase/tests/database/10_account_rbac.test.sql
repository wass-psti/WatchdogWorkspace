begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users(id,email) values
 ('10000000-0000-4000-8000-000000000001','m29-admin@test.local'),
 ('10000000-0000-4000-8000-000000000002','m29-employee@test.local'),
 ('10000000-0000-4000-8000-000000000003','m29-other@test.local');
update public.profiles set platform_role='admin_general_manager' where id='10000000-0000-4000-8000-000000000001';
select public.sync_module_roles('10000000-0000-4000-8000-000000000001','admin_general_manager',null);

set local role anon;
select throws_ok($$select * from public.profiles$$,'42501',null,'anon cannot read profiles');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
select is((select count(*)::integer from public.profiles),1,'employee sees only own profile');
select throws_ok($$update public.profiles set display_name='Bypass' where id='10000000-0000-4000-8000-000000000002'$$,'42501',null,'employee cannot directly update profiles');
select is((select display_name from public.update_own_profile('  Employee   One  ') limit 1),'Employee One','self-service display-name RPC remains allowed');
select throws_ok($$select * from public.list_user_directory()$$,'P0001','Administrator access required','employee cannot list administrative user directory');
select throws_ok($$select * from public.admin_set_user_access('10000000-0000-4000-8000-000000000003','supervisor','active')$$,'P0001','Administrator access required','employee cannot administer another account');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
select is((select count(*)::integer from public.profiles),3,'active Admin can read the user directory table through RLS');
select throws_ok($$update public.profiles set status='disabled' where id='10000000-0000-4000-8000-000000000003'$$,'42501',null,'Admin cannot bypass safeguards with direct profile UPDATE');
select throws_ok($$insert into public.module_role_assignments(user_id,module_id,role,enabled) values('10000000-0000-4000-8000-000000000003','time-tracker','System Admin',true)$$,'42501',null,'Admin cannot bypass derived roles with direct INSERT');
select throws_ok($$update public.module_role_assignments set role='System Admin' where user_id='10000000-0000-4000-8000-000000000003' and module_id='time-tracker'$$,'42501',null,'Admin cannot bypass derived roles with direct UPDATE');
select throws_ok($$delete from public.module_role_assignments where user_id='10000000-0000-4000-8000-000000000003'$$,'42501',null,'Admin cannot bypass derived roles with direct DELETE');
select is((select platform_role from public.admin_set_user_access('10000000-0000-4000-8000-000000000002','supervisor','active') limit 1),'supervisor','Admin RPC can update platform role');
select is(
  (select jsonb_object_agg(module_id,role order by module_id) from public.module_role_assignments where user_id='10000000-0000-4000-8000-000000000002'),
  '{"fueltrack-plus":"User","time-tracker":"Supervisor","tradelink":"Sales Supervisor"}'::jsonb,
  'platform role mutation derives the expected module roles'
);
select throws_ok($$select * from public.admin_set_user_access('10000000-0000-4000-8000-000000000001','admin_general_manager','disabled')$$,'P0001','You cannot disable your own active administrator account','self-disable safeguard remains enforced');
select throws_ok($$select * from public.admin_set_user_access('10000000-0000-4000-8000-000000000001','supervisor','active')$$,'P0001','At least one active Admin/General Manager is required','last-admin safeguard remains enforced');
reset role;

insert into auth.users(id,email) values ('10000000-0000-4000-8000-000000000004','lmsenagan@watchdogautomation.com.ph');
select is((select platform_role from public.profiles where id='10000000-0000-4000-8000-000000000004'),'admin_general_manager','bootstrap identity is provisioned as Admin/General Manager');
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
select throws_ok($$select * from public.admin_set_user_access('10000000-0000-4000-8000-000000000004','employee','active')$$,'P0001','The bootstrap administrator cannot be demoted or disabled','bootstrap administrator safeguard remains enforced');

select * from finish();
rollback;
