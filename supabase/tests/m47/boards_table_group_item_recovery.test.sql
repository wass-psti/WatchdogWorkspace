begin;
create extension if not exists pgtap with schema extensions;
select plan(34);
create temporary table m47_ids(name text primary key,id uuid) on commit drop;
grant select,insert,update,delete on m47_ids to authenticated;

-- M47 keeps Board base tables private. The authenticated role is used only for
-- governed RPC execution; white-box postcondition inspection is performed after
-- RESET ROLE by the disposable local database owner. Do not grant direct Board
-- table access merely to make this certification suite readable.
insert into auth.users(id,email) values
 ('47000000-0000-4000-8000-000000000001','m47-owner@test.local');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
insert into m47_ids values('board',public.wm_create_board('M47 recovery board','pgTAP'));
reset role;
insert into m47_ids values('g1',(select id from public.work_board_groups where board_id=(select id from m47_ids where name='board') order by position,id limit 1));

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
insert into m47_ids values('g2',public.wm_add_board_group((select id from m47_ids where name='board'),'Second group'));
reset role;

insert into public.work_board_columns(board_id,column_key,name,data_type,system_key,position,visible,required,config,created_by,updated_by)
values(
  (select id from m47_ids where name='board'),'status','Status','status','status',0,true,false,
  public.work_board_normalize_column_config('status','{"labels":[{"id":"todo","name":"To do","color":"#7f8a9a","active":true},{"id":"done_custom","name":"Done","color":"#23b784","active":true}],"default_label_id":null}'::jsonb),
  '47000000-0000-4000-8000-000000000001','47000000-0000-4000-8000-000000000001'
);

select is((select array_agg(position order by position) from public.work_board_groups where board_id=(select id from m47_ids where name='board')),array[0,1],'group creation preserves contiguous positions');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
insert into m47_ids values('i1',public.wm_add_board_item((select id from m47_ids where name='board'),(select id from m47_ids where name='g1'),'Item 1'));
insert into m47_ids values('i2',public.wm_add_board_item((select id from m47_ids where name='board'),(select id from m47_ids where name='g1'),'Item 2'));
insert into m47_ids values('i3',public.wm_add_board_item((select id from m47_ids where name='board'),(select id from m47_ids where name='g1'),'Item 3'));
reset role;
select is((select status from public.work_board_items where id=(select id from m47_ids where name='i1')),'todo','item creation uses the normalized active default Status label');
select is((select array_agg(position order by position,id) from public.work_board_items where group_id=(select id from m47_ids where name='g1') and archived_at is null),array[0,1,2],'item creation preserves contiguous active positions');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select public.wm_move_board_item((select id from m47_ids where name='i1'),(select id from m47_ids where name='g1'),2,null);
reset role;
select is((select array_agg(title order by position,id) from public.work_board_items where group_id=(select id from m47_ids where name='g1') and archived_at is null),array['Item 2','Item 3','Item 1'],'same-group move reorders without collisions');
select is((select array_agg(position order by position,id) from public.work_board_items where group_id=(select id from m47_ids where name='g1') and archived_at is null),array[0,1,2],'same-group move keeps contiguous positions');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select public.wm_move_board_item((select id from m47_ids where name='i2'),(select id from m47_ids where name='g2'),0,null);
reset role;
select is((select array_agg(position order by position,id) from public.work_board_items where group_id=(select id from m47_ids where name='g1') and archived_at is null),array[0,1],'cross-group move compacts source positions');
select is((select array_agg(position order by position,id) from public.work_board_items where group_id=(select id from m47_ids where name='g2') and archived_at is null),array[0],'cross-group move inserts target position');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select public.wm_set_board_item_archived((select id from m47_ids where name='i3'),true);
reset role;
select is((select count(*)::integer from public.work_board_items where group_id=(select id from m47_ids where name='g1') and archived_at is null),1,'archive removes item from active ordering');
select is((select array_agg(position order by position,id) from public.work_board_items where group_id=(select id from m47_ids where name='g1') and archived_at is null),array[0],'archive compacts remaining active positions');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select throws_ok(format('select public.wm_move_board_item(%L::uuid,%L::uuid,0,null)',(select id from m47_ids where name='i3'),(select id from m47_ids where name='g2')),'P0001','Restore the item before moving it','archived item movement fails closed');
insert into m47_ids values('i4',public.wm_add_board_item((select id from m47_ids where name='board'),(select id from m47_ids where name='g1'),'Item 4'));
reset role;
select is((select position from public.work_board_items where id=(select id from m47_ids where name='i4')),1,'new item fills the next active position after archive');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select public.wm_set_board_item_archived((select id from m47_ids where name='i3'),false);
reset role;
select is((select position from public.work_board_items where id=(select id from m47_ids where name='i3')),2,'restore appends archived item after current active items');
select is((select array_agg(position order by position,id) from public.work_board_items where group_id=(select id from m47_ids where name='g1') and archived_at is null),array[0,1,2],'restore preserves contiguous active positions');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
insert into m47_ids values('dup',public.wm_duplicate_board_item((select id from m47_ids where name='i4')));
reset role;
select is((select position from public.work_board_items where id=(select id from m47_ids where name='dup')),2,'active duplication inserts immediately after source');
select is((select array_agg(position order by position,id) from public.work_board_items where group_id=(select id from m47_ids where name='g1') and archived_at is null),array[0,1,2,3],'active duplication shifts following rows without collisions');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select public.wm_set_board_item_archived((select id from m47_ids where name='i3'),true);
insert into m47_ids values('dup_archived',public.wm_duplicate_board_item((select id from m47_ids where name='i3')));
reset role;
select is((select position from public.work_board_items where id=(select id from m47_ids where name='dup_archived')),3,'archived duplication creates an active copy at group end');
select is((select archived_at is null from public.work_board_items where id=(select id from m47_ids where name='dup_archived')),true,'duplicating archived item never duplicates archive state');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select public.wm_delete_board_item((select id from m47_ids where name='dup'));
reset role;
select is((select array_agg(position order by position,id) from public.work_board_items where group_id=(select id from m47_ids where name='g1') and archived_at is null),array[0,1,2],'active deletion compacts positions');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select public.wm_delete_board_item((select id from m47_ids where name='i3'));
reset role;
select is((select array_agg(position order by position,id) from public.work_board_items where group_id=(select id from m47_ids where name='g1') and archived_at is null),array[0,1,2],'archived deletion leaves active positions unchanged');

insert into public.work_board_item_files(board_id,item_id,storage_path,file_name,mime_type,size_bytes,created_by)
values((select id from m47_ids where name='board'),(select id from m47_ids where name='i2'),'m47/test-object.txt','test-object.txt','text/plain',4,'47000000-0000-4000-8000-000000000001');
set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select throws_ok(format('select public.wm_delete_board_group(%L::uuid)',(select id from m47_ids where name='g2')),'P0001','Remove item files before deleting this group','group deletion refuses to orphan private Storage objects');
reset role;

delete from public.work_board_item_files where item_id=(select id from m47_ids where name='i2');
set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select lives_ok(format('select public.wm_delete_board_group(%L::uuid)',(select id from m47_ids where name='g2')),'group deletion succeeds after attachment metadata is cleared through the authoritative file workflow');
reset role;
select is((select array_agg(position order by position) from public.work_board_groups where board_id=(select id from m47_ids where name='board')),array[0],'group deletion compacts remaining group positions');

set local role authenticated;
set local request.jwt.claim.sub='47000000-0000-4000-8000-000000000001';
select lives_ok(format('select public.wm_move_board_group(%L::uuid,0)',(select id from m47_ids where name='g1')),'group move remains idempotent at the current position');
reset role;
select is((select count(*)::integer from public.work_board_groups where board_id=(select id from m47_ids where name='board')),1,'board keeps one group after recovery sequence');

select ok(pg_get_functiondef('public.wm_add_board_item(uuid,uuid,text)'::regprocedure) like '%pg_advisory_xact_lock%','item creation is serialized by board advisory lock');
select ok(pg_get_functiondef('public.wm_set_board_item_archived(uuid,boolean)'::regprocedure) like '%position=position-1%' and pg_get_functiondef('public.wm_set_board_item_archived(uuid,boolean)'::regprocedure) like '%select count(*) into target%','archive/restore explicitly maintains active ordering');
select ok(pg_get_functiondef('public.wm_delete_board_group(uuid)'::regprocedure) like '%work_board_item_files%' and pg_get_functiondef('public.wm_delete_board_group(uuid)'::regprocedure) like '%position=position-1%','group deletion guards attachments and compacts ordering');
select ok((public.wm_board_contract_attestation()->>'compatible')::boolean,'M46 governed 40-RPC contract remains compatible after M47 semantic recovery');
select is(public.wm_board_contract_attestation()->>'m47_semantics_version','1.43.2-m47-v1','M47 semantic attestation version is deployed');
select ok((public.wm_board_contract_attestation()->>'m47_group_order_ok')::boolean,'M47 attestation confirms contiguous group ordering');
select ok((public.wm_board_contract_attestation()->>'m47_active_item_order_ok')::boolean,'M47 attestation confirms contiguous active-item ordering');
select ok((public.wm_board_contract_attestation()->>'m47_mutation_security_ok')::boolean,'M47 attestation confirms mutation RPC security boundary');
select ok((public.wm_board_contract_attestation()->>'m47_order_indexes_ok')::boolean,'M47 attestation confirms ordering indexes');
select ok((public.wm_board_contract_attestation()->>'m47_compatible')::boolean,'M47 semantic recovery attestation is compatible');

select * from finish();
rollback;
