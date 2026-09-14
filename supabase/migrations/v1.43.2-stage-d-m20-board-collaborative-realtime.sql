-- Work Management v1.43.2 — Stage D M20 Board collaborative Realtime
-- Private Supabase Broadcast + Presence. Canonical Board state remains RPC/RLS-owned.
begin;

create or replace function public.work_board_realtime_topic_access(p_topic text) returns boolean
language plpgsql stable security definer set search_path=public as $$
declare
  board_text text;
  board_id uuid;
begin
  if auth.uid() is null then return false; end if;
  if coalesce(p_topic,'') !~* '^board:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then return false; end if;
  board_text := split_part(p_topic, ':', 2);
  begin
    board_id := board_text::uuid;
  exception when invalid_text_representation then
    return false;
  end;
  return public.work_board_access(board_id, 'view');
end $$;
revoke all on function public.work_board_realtime_topic_access(text) from public;
grant execute on function public.work_board_realtime_topic_access(text) to authenticated;

-- Realtime Authorization is evaluated when a private channel is joined and when
-- a refreshed JWT is supplied. Board access remains derived from the existing
-- SECURITY DEFINER Board authorization authority.
drop policy if exists "wm_board_realtime_receive" on realtime.messages;
create policy "wm_board_realtime_receive"
on realtime.messages
for select
to authenticated
using (
  extension in ('broadcast','presence')
  and public.work_board_realtime_topic_access(realtime.topic())
);

drop policy if exists "wm_board_realtime_presence_track" on realtime.messages;
create policy "wm_board_realtime_presence_track"
on realtime.messages
for insert
to authenticated
with check (
  extension = 'presence'
  and public.work_board_realtime_topic_access(realtime.topic())
);

-- Browser clients intentionally do not receive an INSERT policy for the
-- broadcast extension. Authoritative board-change events originate only from
-- database triggers below.
create or replace function public.work_board_realtime_broadcast_change() returns trigger
language plpgsql security definer set search_path=public as $$
declare
  row_data jsonb;
  old_data jsonb;
  board_id uuid;
  item_id uuid;
  entity text;
  entity_id text;
  actor_id uuid := auth.uid();
begin
  row_data := case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  old_data := case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end;

  -- Member view_mode is a personal presentation preference. Do not fan it out
  -- to all collaborators unless the member role itself changed.
  if tg_table_name='work_board_members' and tg_op='UPDATE'
     and coalesce(row_data->>'role','') = coalesce(old_data->>'role','') then
    return new;
  end if;

  entity := case tg_table_name
    when 'work_boards' then 'board'
    when 'work_board_members' then 'member'
    when 'work_board_groups' then 'group'
    when 'work_board_items' then 'item'
    when 'work_board_columns' then 'column'
    when 'work_board_item_values' then 'cell'
    when 'work_board_item_updates' then 'update'
    when 'work_board_item_files' then 'file'
    else null
  end;
  if entity is null then
    if tg_op='DELETE' then return old; end if;
    return new;
  end if;

  if tg_table_name='work_boards' then
    board_id := nullif(row_data->>'id','')::uuid;
  else
    board_id := nullif(row_data->>'board_id','')::uuid;
  end if;

  item_id := nullif(row_data->>'item_id','')::uuid;
  if tg_table_name='work_board_items' then item_id := nullif(row_data->>'id','')::uuid; end if;
  if board_id is null and item_id is not null then
    select i.board_id into board_id from public.work_board_items i where i.id=item_id;
  end if;
  if board_id is null then
    if tg_op='DELETE' then return old; end if;
    return new;
  end if;

  entity_id := case tg_table_name
    when 'work_boards' then row_data->>'id'
    when 'work_board_members' then row_data->>'user_id'
    when 'work_board_groups' then row_data->>'id'
    when 'work_board_items' then row_data->>'id'
    when 'work_board_columns' then row_data->>'id'
    when 'work_board_item_values' then concat_ws(':', row_data->>'item_id', row_data->>'column_id')
    when 'work_board_item_updates' then row_data->>'id'
    when 'work_board_item_files' then row_data->>'id'
    else null
  end;

  perform realtime.send(
    jsonb_build_object(
      'board_id', board_id,
      'entity', entity,
      'entity_id', nullif(entity_id,''),
      'item_id', item_id,
      'action', tg_op,
      'actor_id', actor_id,
      'occurred_at', clock_timestamp()
    ),
    'board-change',
    'board:' || board_id::text,
    true
  );

  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.work_board_realtime_broadcast_change() from public;

-- One trigger per canonical collaborative Board relation. Activity records are
-- not separately broadcast because the underlying mutation already emits a
-- change and Board refetch returns the authoritative state.
drop trigger if exists work_boards_realtime_change on public.work_boards;
create trigger work_boards_realtime_change after insert or update or delete on public.work_boards
for each row execute function public.work_board_realtime_broadcast_change();

drop trigger if exists work_board_members_realtime_change on public.work_board_members;
create trigger work_board_members_realtime_change after insert or update or delete on public.work_board_members
for each row execute function public.work_board_realtime_broadcast_change();

drop trigger if exists work_board_groups_realtime_change on public.work_board_groups;
create trigger work_board_groups_realtime_change after insert or update or delete on public.work_board_groups
for each row execute function public.work_board_realtime_broadcast_change();

drop trigger if exists work_board_items_realtime_change on public.work_board_items;
create trigger work_board_items_realtime_change after insert or update or delete on public.work_board_items
for each row execute function public.work_board_realtime_broadcast_change();

drop trigger if exists work_board_columns_realtime_change on public.work_board_columns;
create trigger work_board_columns_realtime_change after insert or update or delete on public.work_board_columns
for each row execute function public.work_board_realtime_broadcast_change();

drop trigger if exists work_board_item_values_realtime_change on public.work_board_item_values;
create trigger work_board_item_values_realtime_change after insert or update or delete on public.work_board_item_values
for each row execute function public.work_board_realtime_broadcast_change();

drop trigger if exists work_board_item_updates_realtime_change on public.work_board_item_updates;
create trigger work_board_item_updates_realtime_change after insert or update or delete on public.work_board_item_updates
for each row execute function public.work_board_realtime_broadcast_change();

drop trigger if exists work_board_item_files_realtime_change on public.work_board_item_files;
create trigger work_board_item_files_realtime_change after insert or update or delete on public.work_board_item_files
for each row execute function public.work_board_realtime_broadcast_change();

notify pgrst, 'reload schema';
commit;
