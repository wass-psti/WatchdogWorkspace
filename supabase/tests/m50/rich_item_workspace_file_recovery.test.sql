begin;
create extension if not exists pgtap with schema extensions;
select plan(33);
select is((public.wm_item_workspace_recovery_attestation()->>'m50_semantics_version'),'1.43.2-m50-v1','M50 semantics version is authoritative');
select ok((public.wm_item_workspace_recovery_attestation()->>'compatible')::boolean,'M50 production attestation is catalog-compatible');
select ok(
  coalesce((att->>'compatible')::boolean,false)
  and coalesce((att->>'m47_mutation_security_ok')::boolean,false)
  and coalesce((att->>'m47_compatible')::boolean,false),
  'retained M46/M47 attestation accepts M50 hardened SECURITY DEFINER search paths'
) from (select public.wm_board_contract_attestation() att) q;
select ok(exists(select 1 from storage.buckets where id='work-board-files' and public=false and file_size_limit=20971520),'attachment bucket remains private and 20 MB bounded');
select ok((select with_check like '%edit%' and with_check like '%view%' and with_check like '%owner_id%' from pg_policies where schemaname='storage' and tablename='objects' and policyname='wm board files insert'),'Storage insert preserves M46 view evidence and enforces M50 edit+owner');
select ok((select qual like '%edit%' and qual like '%manage%' and qual like '%owner_id%' from pg_policies where schemaname='storage' and tablename='objects' and policyname='wm board files delete'),'Storage delete enforces edit and uploader-or-manager ownership');
select ok(not has_table_privilege('authenticated','public.work_board_items','SELECT'),'authenticated retains the RPC-only work_board_items table boundary');
select ok(
  exists(
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='wm_internal' and p.proname='work_board_item_belongs_to_board'
      and p.prosecdef and coalesce('search_path=pg_catalog, public'=any(p.proconfig) or 'search_path=pg_catalog,public'=any(p.proconfig),false)
      and has_schema_privilege('authenticated','wm_internal','USAGE')
      and has_function_privilege('authenticated',p.oid,'EXECUTE')
      and not has_function_privilege('anon',p.oid,'EXECUTE')
  ),
  'Storage path membership helper is internal, security-definer, authenticated-only, and schema-usable'
);
select ok(pg_get_functiondef('public.wm_delete_board_permanently(uuid)'::regprocedure) like '%pending Storage objects%' and pg_get_functiondef('public.wm_delete_board_permanently(uuid)'::regprocedure) like '%storage.objects%','Board permanent delete fails closed for metadata and unregistered Storage objects');
select ok(pg_get_functiondef('public.wm_delete_board_item(uuid)'::regprocedure) like '%pending Storage objects%' and pg_get_functiondef('public.wm_delete_board_item(uuid)'::regprocedure) like '%storage.objects%','Item permanent delete fails closed for metadata and unregistered Storage objects');

create temporary table m50_ids(name text primary key,id uuid) on commit drop;
grant select,insert,update,delete on m50_ids to authenticated;
insert into auth.users(id,email) values
 ('50000000-0000-4000-8000-000000000001','m50-owner@test.local'),
 ('50000000-0000-4000-8000-000000000002','m50-viewer@test.local'),
 ('50000000-0000-4000-8000-000000000003','m50-editor@test.local');
set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000001';
insert into m50_ids values('board',public.wm_create_board('M50 recovery board','pgTAP'));
reset role;
insert into m50_ids values('group',(select id from public.work_board_groups where board_id=(select id from m50_ids where name='board') order by position limit 1));
set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000001';
insert into m50_ids values('item',public.wm_add_board_item((select id from m50_ids where name='board'),(select id from m50_ids where name='group'),'Workspace item'));
select public.wm_add_board_member((select id from m50_ids where name='board'),'m50-viewer@test.local','viewer');
select public.wm_add_board_member((select id from m50_ids where name='board'),'m50-editor@test.local','editor');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000002';
select is((public.wm_get_board_item_workspace((select id from m50_ids where name='item'))->'permissions'->>'can_edit')::boolean,false,'viewer workspace permission is read-only');
select is((public.wm_get_board_item_workspace((select id from m50_ids where name='item'))->'permissions'->>'can_comment')::boolean,false,'viewer cannot post updates');
select is((public.wm_get_board_item_workspace((select id from m50_ids where name='item'))->'permissions'->>'can_attach')::boolean,false,'viewer cannot attach files');
select throws_ok(format('select public.wm_add_board_item_update(%L::uuid,%L)',(select id from m50_ids where name='item'),'blocked'),'42501','Board edit access denied','viewer update mutation is denied');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000003';
select is((public.wm_get_board_item_workspace((select id from m50_ids where name='item'))->'permissions'->>'can_edit')::boolean,true,'editor workspace has edit permission');
select is((public.wm_get_board_item_workspace((select id from m50_ids where name='item'))->'permissions'->>'can_attach')::boolean,true,'editor workspace can attach files');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000001';
select is((public.wm_get_board_item_workspace((select id from m50_ids where name='item'))->'permissions'->>'can_edit')::boolean,true,'owner workspace has edit permission');
select ok(public.wm_add_board_item_update((select id from m50_ids where name='item'),'Owner update')>0,'owner can create update');
reset role;
select is((select count(*)::integer from public.work_board_item_updates where item_id=(select id from m50_ids where name='item')),1,'update persists');

set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000001';
select lives_ok(format($sql$insert into storage.objects(bucket_id,name,owner_id) values('work-board-files',%L,%L)$sql$,(select id::text from m50_ids where name='board')||'/'||(select id::text from m50_ids where name='item')||'/owned.txt','50000000-0000-4000-8000-000000000001'),'owner Storage upload passes RLS ownership and Board edit policy');
insert into m50_ids values('file',public.wm_register_board_item_file((select id from m50_ids where name='item'),(select id::text from m50_ids where name='board')||'/'||(select id::text from m50_ids where name='item')||'/owned.txt','owned.txt','text/plain',12));
select is(public.wm_register_board_item_file((select id from m50_ids where name='item'),(select id::text from m50_ids where name='board')||'/'||(select id::text from m50_ids where name='item')||'/owned.txt','owned.txt','text/plain',12),(select id from m50_ids where name='file'),'registration retry is idempotent for same uploader/path');
reset role;
select is((select count(*)::integer from public.work_board_item_files where id=(select id from m50_ids where name='file')),1,'file metadata persists exactly once');
set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000001';
select is((select jsonb_array_length(public.wm_get_board_item_workspace((select id from m50_ids where name='item'))->'files')),1,'workspace exposes registered attachment metadata');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000003';
select throws_ok(format('select public.wm_delete_board_item_file(%L::uuid)',(select id from m50_ids where name='file')),'42501','Only the uploader or board owner can remove this file','non-owner editor cannot finalize another uploader attachment');
select ok(not exists(
  select 1 from storage.objects o
  where o.bucket_id='work-board-files'
    and o.name=(select id::text from m50_ids where name='board')||'/'||(select id::text from m50_ids where name='item')||'/owned.txt'
    and (o.owner_id=auth.uid()::text or public.work_board_access((select id from m50_ids where name='board'),'manage'))
),'non-owner editor does not satisfy Storage delete uploader-or-manager authorization');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000002';
select throws_ok(format('select public.wm_delete_board_item_file(%L::uuid)',(select id from m50_ids where name='file')),'42501','Board edit access denied','viewer cannot finalize attachment deletion');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000001';
select throws_ok(format('select public.wm_delete_board_item_file(%L::uuid)',(select id from m50_ids where name='file')),'P0001','Delete Storage object before finalizing metadata','metadata finalization fails closed while the Storage object still exists');
reset role;

with created as (
  insert into public.work_board_item_files(board_id,item_id,storage_path,file_name,mime_type,size_bytes,created_by)
  values(
    (select id from m50_ids where name='board'),
    (select id from m50_ids where name='item'),
    (select id::text from m50_ids where name='board')||'/'||(select id::text from m50_ids where name='item')||'/already-removed.txt',
    'already-removed.txt','text/plain',7,'50000000-0000-4000-8000-000000000001'
  ) returning id
) insert into m50_ids select 'finalizable_file',id from created;

set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000001';
select is(public.wm_delete_board_item_file((select id from m50_ids where name='finalizable_file')),(select id::text from m50_ids where name='board')||'/'||(select id::text from m50_ids where name='item')||'/already-removed.txt','owner can finalize metadata after Storage object absence is authoritative');
select is(public.wm_delete_board_item_file((select id from m50_ids where name='finalizable_file')),null,'attachment metadata finalization is idempotent');
reset role;
select is((select count(*)::integer from public.work_board_item_files where id=(select id from m50_ids where name='finalizable_file')),0,'attachment metadata is removed after storage-first finalization');

set local role authenticated;
set local request.jwt.claim.sub='50000000-0000-4000-8000-000000000001';
insert into m50_ids values('pending_item',public.wm_add_board_item((select id from m50_ids where name='board'),(select id from m50_ids where name='group'),'Pending storage item'));
select lives_ok(format($sql$insert into storage.objects(bucket_id,name,owner_id) values('work-board-files',%L,%L)$sql$,(select id::text from m50_ids where name='board')||'/'||(select id::text from m50_ids where name='pending_item')||'/pending-registration.txt','50000000-0000-4000-8000-000000000001'),'ambiguous-registration Storage metadata can exist without Board file metadata for recovery testing');
select throws_ok(format('select public.wm_delete_board_item(%L::uuid)',(select id from m50_ids where name='pending_item')),'P0001','Remove item files and pending Storage objects before permanently deleting the item','item deletion fails closed while a pending Storage object exists');
insert into m50_ids values('clean_item',public.wm_add_board_item((select id from m50_ids where name='board'),(select id from m50_ids where name='group'),'Clean deletion item'));
select lives_ok(format('select public.wm_delete_board_item(%L::uuid)',(select id from m50_ids where name='clean_item')),'item deletion succeeds when no Storage object or file metadata exists');
reset role;
select * from finish();
rollback;
