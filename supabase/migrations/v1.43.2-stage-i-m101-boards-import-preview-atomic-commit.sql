-- Stage I M101 — Boards import preview/final commit.
-- One RPC owns the complete mutation transaction. Any exception rolls back all rows.
create or replace function public.wm_import_board_items_atomic(
  p_board_id uuid,
  p_expected_updated_at timestamptz,
  p_rows jsonb
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  b public.work_boards%rowtype;
  r jsonb;
  pair record;
  gid uuid;
  iid uuid;
  cid uuid;
  item_name text;
  pos integer;
  created_count integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if jsonb_typeof(coalesce(p_rows,'null'::jsonb)) <> 'array' then raise exception 'Import rows must be a JSON array' using errcode='22023'; end if;
  if jsonb_array_length(p_rows) > 100000 then raise exception 'Import row limit exceeded' using errcode='54000'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_board_id::text,0));
  select * into b from public.work_boards where id=p_board_id for update;
  if b.id is null or not public.work_board_access(p_board_id,'edit') then raise exception 'Board edit access denied' using errcode='42501'; end if;
  if p_expected_updated_at is null or b.updated_at is distinct from p_expected_updated_at then
    raise exception 'This Board changed after the import preview. Refresh and review the import again.' using errcode='40001';
  end if;

  -- Lock relationships and current rows so relationship resolution and duplicate
  -- decisions stay stable for the duration of this transaction.
  perform 1 from public.work_board_groups where board_id=p_board_id for update;
  perform 1 from public.work_board_columns where board_id=p_board_id for update;
  perform 1 from public.work_board_items where board_id=p_board_id and archived_at is null for update;

  for r in select value from jsonb_array_elements(p_rows)
  loop
    if jsonb_typeof(r) <> 'object' then raise exception 'Every import row must be an object' using errcode='22023'; end if;
    item_name := btrim(coalesce(r->>'item_name',''));
    if char_length(item_name) not between 1 and 240 then raise exception 'Item name must contain 1-240 characters' using errcode='22023'; end if;
    begin gid := (r->>'group_id')::uuid; exception when others then raise exception 'Import group identifier is invalid' using errcode='23503'; end;
    if not exists(select 1 from public.work_board_groups where id=gid and board_id=p_board_id) then
      raise exception 'Import group relationship no longer exists' using errcode='23503';
    end if;
    if exists(select 1 from public.work_board_items where board_id=p_board_id and group_id=gid and archived_at is null and lower(btrim(title))=lower(item_name)) then
      raise exception 'An imported item now conflicts with an existing item. Refresh and review the import again.' using errcode='40001';
    end if;

    select count(*) into pos from public.work_board_items where board_id=p_board_id and group_id=gid and archived_at is null;
    insert into public.work_board_items(board_id,group_id,title,status,position,created_by,updated_by)
    values(p_board_id,gid,item_name,null,pos,auth.uid(),auth.uid()) returning id into iid;

    if jsonb_typeof(coalesce(r->'values','{}'::jsonb)) <> 'object' then raise exception 'Import row values must be an object' using errcode='22023'; end if;
    for pair in select key,value from jsonb_each(coalesce(r->'values','{}'::jsonb))
    loop
      select id into cid from public.work_board_columns
       where board_id=p_board_id and (column_key=pair.key or id::text=pair.key)
       order by case when column_key=pair.key then 0 else 1 end, position, id limit 1;
      if cid is null then raise exception 'Import column relationship no longer exists: %', pair.key using errcode='23503'; end if;
      perform public.wm_set_board_cell(iid,cid,pair.value);
      cid := null;
    end loop;
    created_count := created_count + 1;
  end loop;

  update public.work_boards set updated_at=clock_timestamp(),updated_by=auth.uid() where id=p_board_id;
  perform public.work_board_log(p_board_id,'items.imported','Board items imported','board',p_board_id::text,jsonb_build_object('created',created_count,'updated',0,'skipped',0,'rejected',0));
  return jsonb_build_object('created',created_count,'updated',0,'skipped',0,'rejected',0,'affected',created_count);
end $$;

revoke all on function public.wm_import_board_items_atomic(uuid,timestamptz,jsonb) from public, anon;
grant execute on function public.wm_import_board_items_atomic(uuid,timestamptz,jsonb) to authenticated;
