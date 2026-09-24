begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users(id,email,raw_user_meta_data) values
 ('52000000-0000-4000-8000-000000000010','m52-admin@test.local','{"display_name":"M52 Admin"}'::jsonb),
 ('52000000-0000-4000-8000-000000000020','m52-target@test.local','{"display_name":"M52 Target"}'::jsonb);

update public.profiles set platform_role='admin_general_manager',status='active' where id='52000000-0000-4000-8000-000000000010';
select public.sync_module_roles('52000000-0000-4000-8000-000000000010','admin_general_manager',null);

select is((select platform_role from public.profiles where id='52000000-0000-4000-8000-000000000020'),'employee','new non-bootstrap account defaults to Employee');
select is((select role from public.module_role_assignments where user_id='52000000-0000-4000-8000-000000000020' and module_id='time-tracker'),'Employee','Employee maps to TimeTracker Employee');
select is((select role from public.module_role_assignments where user_id='52000000-0000-4000-8000-000000000020' and module_id='fueltrack-plus'),'User','Employee maps to FuelTrack+ User');
select is((select role from public.module_role_assignments where user_id='52000000-0000-4000-8000-000000000020' and module_id='tradelink'),'User','Employee maps to TradeLink User');

set local role authenticated;
set local request.jwt.claim.sub='52000000-0000-4000-8000-000000000010';
select lives_ok($$select public.admin_set_user_access('52000000-0000-4000-8000-000000000020','hr','active')$$,'Admin can assign HR role transactionally');
reset role;
select is((select role from public.module_role_assignments where user_id='52000000-0000-4000-8000-000000000020' and module_id='time-tracker'),'HR','HR maps to TimeTracker HR');
select is((select role from public.module_role_assignments where user_id='52000000-0000-4000-8000-000000000020' and module_id='fueltrack-plus'),'User','HR maps to FuelTrack+ User');
select is((select role from public.module_role_assignments where user_id='52000000-0000-4000-8000-000000000020' and module_id='tradelink'),'User','HR maps to TradeLink User');

set local role authenticated;
set local request.jwt.claim.sub='52000000-0000-4000-8000-000000000010';
select lives_ok($$select public.admin_set_user_access('52000000-0000-4000-8000-000000000020','supervisor','active')$$,'Admin can assign Supervisor role transactionally');
reset role;
select is((select role from public.module_role_assignments where user_id='52000000-0000-4000-8000-000000000020' and module_id='time-tracker'),'Supervisor','Supervisor maps to TimeTracker Supervisor');
select is((select role from public.module_role_assignments where user_id='52000000-0000-4000-8000-000000000020' and module_id='fueltrack-plus'),'User','Supervisor maps to FuelTrack+ User');
select is((select role from public.module_role_assignments where user_id='52000000-0000-4000-8000-000000000020' and module_id='tradelink'),'Sales Supervisor','Supervisor maps to TradeLink Sales Supervisor');

set local role authenticated;
set local request.jwt.claim.sub='52000000-0000-4000-8000-000000000010';
select lives_ok($$select public.admin_set_user_access('52000000-0000-4000-8000-000000000020','employee','disabled')$$,'Admin can disable Employee account transactionally');
reset role;
select is((select status from public.profiles where id='52000000-0000-4000-8000-000000000020'),'disabled','disabled account status is authoritative');
select is((select count(*)::integer from public.module_role_assignments where user_id='52000000-0000-4000-8000-000000000020' and enabled),3,'disabled account may retain assignments while account status remains the host fail-closed authority');

set local role authenticated;
set local request.jwt.claim.sub='52000000-0000-4000-8000-000000000020';
select throws_ok($$select * from public.list_user_directory()$$,'P0001','Administrator access required','disabled/non-admin account cannot list users');
reset role;

update public.profiles set platform_role='hr',status='active' where id='52000000-0000-4000-8000-000000000020';
select public.sync_module_roles('52000000-0000-4000-8000-000000000020','hr',null);
set local role authenticated;
set local request.jwt.claim.sub='52000000-0000-4000-8000-000000000020';
select throws_ok($$select * from public.list_user_directory()$$,'P0001','Administrator access required','HR cannot list users');
reset role;

update public.profiles set platform_role='supervisor',status='active' where id='52000000-0000-4000-8000-000000000020';
select public.sync_module_roles('52000000-0000-4000-8000-000000000020','supervisor',null);
set local role authenticated;
set local request.jwt.claim.sub='52000000-0000-4000-8000-000000000020';
select throws_ok($$select * from public.list_user_directory()$$,'P0001','Administrator access required','Supervisor cannot list users');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='52000000-0000-4000-8000-000000000010';
select lives_ok($$select * from public.list_user_directory()$$,'Admin/General Manager can list users');
reset role;
select * from finish();
rollback;
