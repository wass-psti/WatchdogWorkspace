begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

create temporary table m103_ids(name text primary key,id uuid,ts timestamptz) on commit drop;
grant select,insert,update,delete on m103_ids to authenticated;

insert into auth.users(id,email) values
 ('10300000-0000-4000-8000-000000000001','m103-owner@test.local'),
 ('10300000-0000-4000-8000-000000000002','m103-outsider@test.local');

set local role authenticated;
set local request.jwt.claim.sub='10300000-0000-4000-8000-000000000001';
insert into m103_ids(name,id) values('board',public.wm_create_board('M103 import board','pgTAP'));
insert into m103_ids(name,id) values('text_col',public.wm_add_board_column((select id from m103_ids where name='board'),'Text','text','{}'::jsonb));
insert into m103_ids(name,id) values('date_col',public.wm_add_board_column((select id from m103_ids where name='board'),'Date','date','{}'::jsonb));
insert into m103_ids(name,id) values('people_col',public.wm_add_board_column((select id from m103_ids where name='board'),'People','people','{}'::jsonb));
insert into m103_ids(name,id) values('timeline_col',public.wm_add_board_column((select id from m103_ids where name='board'),'Timeline','timeline','{}'::jsonb));
reset role;

insert into m103_ids(name,id) values('group',(select id from public.work_board_groups where board_id=(select id from m103_ids where name='board') order by position,id limit 1));
update m103_ids set ts=(select updated_at from public.work_boards where id=(select id from m103_ids where name='board')) where name='board';

-- Explicit identifier preservation on create.
set local role authenticated;
set local request.jwt.claim.sub='10300000-0000-4000-8000-000000000001';
select lives_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m103_ids where name='board'),
  (select ts from m103_ids where name='board'),
  jsonb_build_array(jsonb_build_object(
    'source_row',2,'operation','create','item_id','10300000-0000-4000-8000-000000000010',
    'item_name','Portable item','group_id',(select id from m103_ids where name='group'),
    'values',jsonb_build_object((select id::text from m103_ids where name='text_col'),'Original')
  ))::text
),'identifier-preserving create succeeds');
reset role;
select ok(exists(select 1 from public.work_board_items where id='10300000-0000-4000-8000-000000000010'::uuid and board_id=(select id from m103_ids where name='board')),'explicit imported Item ID is preserved');
select is((select value#>>'{}' from public.work_board_item_values where item_id='10300000-0000-4000-8000-000000000010'::uuid and column_id=(select id from m103_ids where name='text_col')),'Original','created custom value is preserved');

update m103_ids set ts=(select updated_at from public.work_boards where id=(select id from m103_ids where name='board')) where name='board';
insert into m103_ids(name,id,ts) values('item','10300000-0000-4000-8000-000000000010'::uuid,(select updated_at from public.work_board_items where id='10300000-0000-4000-8000-000000000010'::uuid));

-- Explicit compare-and-swap update.
set local role authenticated;
set local request.jwt.claim.sub='10300000-0000-4000-8000-000000000001';
select lives_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m103_ids where name='board'),
  (select ts from m103_ids where name='board'),
  jsonb_build_array(jsonb_build_object(
    'source_row',3,'operation','update','item_id',(select id from m103_ids where name='item'),
    'expected_item_updated_at',(select ts from m103_ids where name='item'),
    'item_name','Portable item edited','group_id',(select id from m103_ids where name='group'),
    'values',jsonb_build_object((select id::text from m103_ids where name='text_col'),'Changed')
  ))::text
),'current Item ID plus Item Updated At performs an explicit update');
reset role;
select is((select title from public.work_board_items where id=(select id from m103_ids where name='item')),'Portable item edited','bulk-edit re-import updates the existing item');
select is((select value#>>'{}' from public.work_board_item_values where item_id=(select id from m103_ids where name='item') and column_id=(select id from m103_ids where name='text_col')),'Changed','bulk-edit re-import updates mapped values');

update m103_ids set ts=(select updated_at from public.work_boards where id=(select id from m103_ids where name='board')) where name='board';
-- stale item version must fail even when the Board preview version is current.
set local role authenticated;
set local request.jwt.claim.sub='10300000-0000-4000-8000-000000000001';
select throws_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m103_ids where name='board'),
  (select ts from m103_ids where name='board'),
  jsonb_build_array(jsonb_build_object('source_row',4,'operation','update','item_id',(select id from m103_ids where name='item'),'expected_item_updated_at','2026-01-01T00:00:00Z','item_name','Stale edit','group_id',(select id from m103_ids where name='group'),'values','{}'::jsonb))::text
),'40001','The imported item changed after export. Refresh/export and review the update again.','stale item compare-and-swap fails closed');
reset role;

-- Identifier collision fails closed.
set local role authenticated;
set local request.jwt.claim.sub='10300000-0000-4000-8000-000000000001';
select throws_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m103_ids where name='board'),
  (select ts from m103_ids where name='board'),
  jsonb_build_array(jsonb_build_object('source_row',5,'operation','create','item_id',(select id from m103_ids where name='item'),'item_name','Collision','group_id',(select id from m103_ids where name='group'),'values','{}'::jsonb))::text
),'40001','The requested imported Item ID is already in use. Refresh and reconcile the import.','identifier collision fails closed');
reset role;

-- Authoritative cell validation remains enforced by the transaction.
set local role authenticated;
set local request.jwt.claim.sub='10300000-0000-4000-8000-000000000001';
select throws_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m103_ids where name='board'),(select ts from m103_ids where name='board'),
  jsonb_build_array(jsonb_build_object('source_row',6,'operation','create','item_name','Bad date','group_id',(select id from m103_ids where name='group'),'values',jsonb_build_object((select id::text from m103_ids where name='date_col'),'2026-02-31')))::text
),'P0001','Date requires a valid date','database rejects impossible calendar dates');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='10300000-0000-4000-8000-000000000001';
select throws_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m103_ids where name='board'),(select ts from m103_ids where name='board'),
  jsonb_build_array(jsonb_build_object('source_row',7,'operation','create','item_name','Bad member','group_id',(select id from m103_ids where name='group'),'values',jsonb_build_object((select id::text from m103_ids where name='people_col'),'10300000-0000-4000-8000-000000000002')))::text
),'P0001','Assignee must be a board member','database rejects non-member people relationships');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='10300000-0000-4000-8000-000000000001';
select throws_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m103_ids where name='board'),(select ts from m103_ids where name='board'),
  jsonb_build_array(jsonb_build_object('source_row',8,'operation','create','item_name','Bad timeline','group_id',(select id from m103_ids where name='group'),'values',jsonb_build_object((select id::text from m103_ids where name='timeline_col'),jsonb_build_object('start','2026-10-31','end','2026-10-01'))))::text
),'P0001','Timeline end date cannot be before its start date','database rejects reversed timelines');
reset role;

-- Any later row failure rolls back earlier update work in the same import transaction.
update m103_ids set ts=(select updated_at from public.work_boards where id=(select id from m103_ids where name='board')) where name='board';
update m103_ids set ts=(select updated_at from public.work_board_items where id=(select id from m103_ids where name='item')) where name='item';
set local role authenticated;
set local request.jwt.claim.sub='10300000-0000-4000-8000-000000000001';
select throws_ok(format(
  'select public.wm_import_board_items_atomic(%L::uuid,%L::timestamptz,%L::jsonb)',
  (select id from m103_ids where name='board'),(select ts from m103_ids where name='board'),
  jsonb_build_array(
    jsonb_build_object('source_row',9,'operation','update','item_id',(select id from m103_ids where name='item'),'expected_item_updated_at',(select ts from m103_ids where name='item'),'item_name','Should roll back','group_id',(select id from m103_ids where name='group'),'values','{}'::jsonb),
    jsonb_build_object('source_row',10,'operation','create','item_name','Broken relationship','group_id','ffffffff-ffff-4fff-8fff-ffffffffffff','values','{}'::jsonb)
  )::text
),'23503','Import group relationship no longer exists','mixed update/create failure rolls back the complete transaction');
reset role;
select is((select title from public.work_board_items where id=(select id from m103_ids where name='item')),'Portable item edited','failed mixed import leaves prior item unchanged');

select ok(pg_get_functiondef('public.wm_import_board_items_atomic(uuid,timestamptz,jsonb)'::regprocedure) ilike '%expected_item_updated_at%' and pg_get_functiondef('public.wm_import_board_items_atomic(uuid,timestamptz,jsonb)'::regprocedure) ilike '%updated_count%','atomic RPC contains M103 compare-and-swap and update accounting');
select * from finish();
rollback;
