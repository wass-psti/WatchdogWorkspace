begin;
create extension if not exists pgtap with schema extensions;
select plan(11);
create temporary table m101_ids(name text primary key,id uuid, board_updated_at timestamptz) on commit drop;
grant select,insert,update,delete on m101_ids to authenticated;
insert into auth.users(id,email) values
 ('10100000-0000-4000-8000-000000000001','m101-owner@test.local'),
 ('10100000-0000-4000-8000-000000000002','m101-outsider@test.local');

set local role authenticated;
set local request.jwt.claim.sub='10100000-0000-4000-8000-000000000001';
insert into m101_ids(name,id) values('board',public.wm_create_board('M101 import board','pgTAP'));
insert into m101_ids(name,id) values('text_col',public.wm_add_board_column((select id from m101_ids where name='board'),'Import note','text','{}'::jsonb));
reset role;
insert into m101_ids(name,id) values('group',(select id from public.work_board_groups where board_id=(select id from m101_ids where name='board') order by position,id limit 1));
update m101_ids set board_updated_at=(select updated_at from public.work_boards where id=(select id from m101_ids where name='board')) where name='board';

set local role authenticated;
set local request.jwt.claim.sub='10100000-0000-4000-8000-000000000001';
select lives_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m101_ids where name='board'),
  (select board_updated_at from m101_ids where name='board'),
  jsonb_build_array(
    jsonb_build_object('source_row',2,'item_name','Imported A','group_id',(select id from m101_ids where name='group'),'values',jsonb_build_object((select id::text from m101_ids where name='text_col'),'Alpha')),
    jsonb_build_object('source_row',3,'item_name','Imported B','group_id',(select id from m101_ids where name='group'),'values',jsonb_build_object((select id::text from m101_ids where name='text_col'),'Beta'))
  )::text
),'fully valid import commits atomically');
reset role;
select is((select count(*)::integer from public.work_board_items where board_id=(select id from m101_ids where name='board') and title in ('Imported A','Imported B')),2,'successful import creates all reviewed rows');
select is((select count(*)::integer from public.work_board_item_values v join public.work_board_items i on i.id=v.item_id where i.board_id=(select id from m101_ids where name='board') and v.column_id=(select id from m101_ids where name='text_col')),2,'successful import persists mapped custom values');

insert into m101_ids(name,board_updated_at) select 'stale_version',board_updated_at from m101_ids where name='board';
update public.work_boards set updated_at=clock_timestamp() where id=(select id from m101_ids where name='board');
update m101_ids set board_updated_at=(select updated_at from public.work_boards where id=(select id from m101_ids where name='board')) where name='board';
set local role authenticated;
set local request.jwt.claim.sub='10100000-0000-4000-8000-000000000001';
select throws_ok(format('select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',(select id from m101_ids where name='board'),(select board_updated_at from m101_ids where name='stale_version'),'[]'),'40001','This Board changed after the import preview. Refresh and review the import again.','stale preview version fails closed');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='10100000-0000-4000-8000-000000000001';
select throws_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m101_ids where name='board'),
  (select board_updated_at from m101_ids where name='board'),
  jsonb_build_array(
    jsonb_build_object('source_row',4,'item_name','Rollback Me','group_id',(select id from m101_ids where name='group'),'values','{}'::jsonb),
    jsonb_build_object('source_row',5,'item_name','Broken Relationship','group_id','ffffffff-ffff-4fff-8fff-ffffffffffff','values','{}'::jsonb)
  )::text
),'23503','Import group relationship no longer exists','relationship failure aborts the transaction');
reset role;
select is((select count(*)::integer from public.work_board_items where board_id=(select id from m101_ids where name='board') and title='Rollback Me'),0,'relationship failure leaves no partial imported row');

set local role authenticated;
set local request.jwt.claim.sub='10100000-0000-4000-8000-000000000001';
select throws_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m101_ids where name='board'),
  (select board_updated_at from m101_ids where name='board'),
  jsonb_build_array(jsonb_build_object('source_row',6,'item_name','Imported A','group_id',(select id from m101_ids where name='group'),'values','{}'::jsonb))::text
),'40001','An imported item now conflicts with an existing item. Refresh and review the import again.','concurrent/duplicate conflict fails closed');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='10100000-0000-4000-8000-000000000002';
select throws_ok(format('select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',(select id from m101_ids where name='board'),(select board_updated_at from m101_ids where name='board'),'[]'),'42501','Board edit access denied','non-member cannot import');
reset role;
select ok(pg_get_functiondef('public.wm_import_board_items_atomic(uuid,timestamptz,jsonb)'::regprocedure) ilike '%pg_advisory_xact_lock%' and pg_get_functiondef('public.wm_import_board_items_atomic(uuid,timestamptz,jsonb)'::regprocedure) ilike '%for update%','atomic import serializes board and relationship decisions');
select is((select count(*)::integer from information_schema.routine_privileges where routine_schema='public' and routine_name='wm_import_board_items_atomic' and grantee='authenticated' and privilege_type='EXECUTE'),1,'authenticated role has explicit atomic-import execute authority');
select ok(pg_get_functiondef('public.wm_import_board_items_atomic(uuid,timestamptz,jsonb)'::regprocedure) ilike '%raise exception%' and pg_get_functiondef('public.wm_import_board_items_atomic(uuid,timestamptz,jsonb)'::regprocedure) not ilike '%exception when others%then null%','persistence failures are not silently swallowed');
select * from finish();
rollback;
