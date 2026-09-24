begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
create temporary table m51_ids(name text primary key,id uuid) on commit drop;
grant select,insert,update,delete on m51_ids to authenticated;
insert into auth.users(id,email) values
 ('51000000-0000-4000-8000-000000000001','m51-owner@test.local'),
 ('51000000-0000-4000-8000-000000000002','m51-outsider@test.local');

set local role authenticated;
set local request.jwt.claim.sub='51000000-0000-4000-8000-000000000001';
insert into m51_ids values('board',public.wm_create_board('M51 concurrency board','pgTAP'));
insert into m51_ids values('concurrent_col',public.wm_add_board_column((select id from m51_ids where name='board'),'Concurrent note','text','{}'::jsonb));
reset role;
insert into m51_ids values('group',(select id from public.work_board_groups where board_id=(select id from m51_ids where name='board') order by position,id limit 1));
insert into m51_ids values('title_col',(select id from public.work_board_columns where board_id=(select id from m51_ids where name='board') and system_key='title' limit 1));

set local role authenticated;
set local request.jwt.claim.sub='51000000-0000-4000-8000-000000000001';
insert into m51_ids values('item',public.wm_add_board_item((select id from m51_ids where name='board'),(select id from m51_ids where name='group'),'Original'));
select lives_ok(format('select public.wm_set_board_cell_if_current(%L::uuid,%L::uuid,%L::jsonb,%L::jsonb)',(select id from m51_ids where name='item'),(select id from m51_ids where name='title_col'),'"Session A"','"Original"'),'compare-and-set accepts an unchanged expected title');
reset role;
select is((select title from public.work_board_items where id=(select id from m51_ids where name='item')),'Session A','successful CAS persists the title');

set local role authenticated;
set local request.jwt.claim.sub='51000000-0000-4000-8000-000000000001';
select throws_ok(format('select public.wm_set_board_cell_if_current(%L::uuid,%L::uuid,%L::jsonb,%L::jsonb)',(select id from m51_ids where name='item'),(select id from m51_ids where name='title_col'),'"Stale overwrite"','"Original"'),'40001','This Board value changed in another session. Reload the latest value before saving.','stale same-field CAS fails closed with SQLSTATE 40001');
reset role;
select is((select title from public.work_board_items where id=(select id from m51_ids where name='item')),'Session A','rejected stale write leaves the authoritative value unchanged');

set local role authenticated;
set local request.jwt.claim.sub='51000000-0000-4000-8000-000000000001';
select public.wm_set_board_cell((select id from m51_ids where name='item'),(select id from m51_ids where name='concurrent_col'),'"Collaborator note"'::jsonb);
select lives_ok(format('select public.wm_set_board_cell_if_current(%L::uuid,%L::uuid,%L::jsonb,%L::jsonb)',(select id from m51_ids where name='item'),(select id from m51_ids where name='title_col'),'"Merged title"','"Session A"'),'non-overlapping concurrent field update can merge through field-scoped CAS');
reset role;
select is((select value#>>'{}' from public.work_board_item_values where item_id=(select id from m51_ids where name='item') and column_id=(select id from m51_ids where name='concurrent_col')),'Collaborator note','title CAS does not overwrite a collaborator custom-cell mutation');
select is((select title from public.work_board_items where id=(select id from m51_ids where name='item')),'Merged title','non-overlapping title mutation is retained');

set local role authenticated;
set local request.jwt.claim.sub='51000000-0000-4000-8000-000000000002';
select throws_ok(format('select public.wm_set_board_cell_if_current(%L::uuid,%L::uuid,%L::jsonb,%L::jsonb)',(select id from m51_ids where name='item'),(select id from m51_ids where name='title_col'),'"Unauthorized"','"Merged title"'),'42501','Board edit access denied','non-member cannot use the CAS mutation authority');
reset role;
select ok(pg_get_functiondef('public.wm_set_board_cell_if_current(uuid,uuid,jsonb,jsonb)'::regprocedure) like '%FOR UPDATE%' or pg_get_functiondef('public.wm_set_board_cell_if_current(uuid,uuid,jsonb,jsonb)'::regprocedure) like '%for update%','CAS implementation serializes decisions using a row lock');
select is((select count(*)::integer from information_schema.routine_privileges where routine_schema='public' and routine_name='wm_set_board_cell_if_current' and grantee='authenticated' and privilege_type='EXECUTE'),1,'authenticated role has explicit CAS execute authority');
select * from finish();
rollback;
