begin;
create extension if not exists pgtap with schema extensions;
select plan(21);
create temporary table m29_ids(name text primary key,id uuid) on commit drop;
grant select,insert on m29_ids to authenticated;

insert into auth.users(id,email) values
 ('30000000-0000-4000-8000-000000000001','m29-owner@test.local'),
 ('30000000-0000-4000-8000-000000000002','m29-editor@test.local'),
 ('30000000-0000-4000-8000-000000000003','m29-viewer@test.local'),
 ('30000000-0000-4000-8000-000000000004','m29-outsider@test.local'),
 ('30000000-0000-4000-8000-000000000005','m29-admin@test.local'),
 ('30000000-0000-4000-8000-000000000006','m29-disabled@test.local');
update public.profiles set platform_role='admin_general_manager' where id='30000000-0000-4000-8000-000000000005';
select public.sync_module_roles('30000000-0000-4000-8000-000000000005','admin_general_manager',null);

set local role authenticated;
set local request.jwt.claim.sub='30000000-0000-4000-8000-000000000001';
insert into m29_ids values('board',public.wm_create_board('M29 authorization board','pgTAP'));
select ok((select id is not null from m29_ids where name='board'),'owner can create a board through RPC');
select public.wm_add_board_member((select id from m29_ids where name='board'),'m29-editor@test.local','editor');
select public.wm_add_board_member((select id from m29_ids where name='board'),'m29-viewer@test.local','viewer');
select public.wm_add_board_member((select id from m29_ids where name='board'),'m29-disabled@test.local','viewer');
select ok(public.wm_get_board((select id from m29_ids where name='board')) is not null,'owner can read board through RPC');
select throws_ok($$select * from public.work_boards$$,'42501',null,'board tables remain RPC-only');
select public.wm_update_board((select id from m29_ids where name='board'),'M29 owner update','updated');
select is((public.wm_get_board((select id from m29_ids where name='board'))->'board'->>'name'),'M29 owner update','owner can edit board');
select throws_ok(format('select public.wm_remove_board_member(%L::uuid,%L::uuid)',(select id from m29_ids where name='board'),'30000000-0000-4000-8000-000000000001'),'P0001','Board owner cannot be removed','owner membership cannot be removed');

set local request.jwt.claim.sub='30000000-0000-4000-8000-000000000002';
select ok(public.wm_get_board((select id from m29_ids where name='board')) is not null,'editor can view board');
select lives_ok(format('select public.wm_update_board(%L::uuid,%L,%L)',(select id from m29_ids where name='board'),'M29 editor update','editor'),'editor can edit board');
select throws_ok(format('select public.wm_set_board_status(%L::uuid,%L)',(select id from m29_ids where name='board'),'archived'),'42501','Board management access denied','editor cannot manage board lifecycle');
select throws_ok(format('select public.wm_add_board_member(%L::uuid,%L,%L)',(select id from m29_ids where name='board'),'m29-outsider@test.local','viewer'),'42501','Board management access denied','editor cannot manage membership');

set local request.jwt.claim.sub='30000000-0000-4000-8000-000000000003';
select ok(public.wm_get_board((select id from m29_ids where name='board')) is not null,'viewer can view board');
select throws_ok(format('select public.wm_update_board(%L::uuid,%L,%L)',(select id from m29_ids where name='board'),'viewer bypass','bad'),'42501','Board edit access denied','viewer cannot edit board');
select ok(public.work_board_realtime_topic_access('board:'||(select id::text from m29_ids where name='board')),'viewer can join authorized private Board realtime topic');

set local request.jwt.claim.sub='30000000-0000-4000-8000-000000000004';
select is(public.work_board_access((select id from m29_ids where name='board'),'view'),false,'non-member Board view helper fails closed');
select is(public.work_board_access((select id from m29_ids where name='board'),'edit'),false,'non-member Board edit helper fails closed');
select is(public.work_board_access((select id from m29_ids where name='board'),'manage'),false,'non-member Board manage helper fails closed');
select is(public.work_board_access((select id from m29_ids where name='board'),'unsupported'),false,'unknown Board access requirement fails closed');
select throws_ok(format('select public.wm_get_board(%L::uuid)',(select id from m29_ids where name='board')),'42501','Board access denied','non-member cannot read board');
select ok(not public.work_board_realtime_topic_access('board:'||(select id::text from m29_ids where name='board')),'non-member cannot join Board realtime topic');

reset role;
update public.profiles set status='disabled' where id='30000000-0000-4000-8000-000000000006';
set local role authenticated;
set local request.jwt.claim.sub='30000000-0000-4000-8000-000000000006';
select throws_ok(format('select public.wm_get_board(%L::uuid)',(select id from m29_ids where name='board')),'42501','Board access denied','disabled board member cannot read board');

set local request.jwt.claim.sub='30000000-0000-4000-8000-000000000005';
select ok(public.wm_get_board((select id from m29_ids where name='board')) is not null,'platform Admin can manage workspace board without explicit membership');
select lives_ok(format('select public.wm_set_board_status(%L::uuid,%L)',(select id from m29_ids where name='board'),'archived'),'platform Admin can manage board lifecycle');

select * from finish();
rollback;
