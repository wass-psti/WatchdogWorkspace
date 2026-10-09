-- Material Tracker host-contract provenance guard.
-- The authoritative WatchdogWorkspace project already applied this migration.
-- This standalone integration repository consumes that host-owned schema rather
-- than creating a competing identity/database lifecycle. On an unprepared host,
-- fail closed and require the Work Management schema baseline first.
do $$
declare required text[] := array[
  'material_tracker_memberships','material_tracker_materials','material_tracker_tasks',
  'material_tracker_activity','material_tracker_comments','material_tracker_notifications',
  'material_tracker_forex_rates','material_tracker_daily_metrics','material_tracker_user_state',
  'material_tracker_presence'
]; t text;
begin
  foreach t in array required loop
    if to_regclass('public.'||t) is null then
      raise exception 'Material Tracker host contract missing table public.%', t;
    end if;
  end loop;
end $$;

-- Required RPC boundary used by the compatibility adapter.
do $$
declare required text[] := array[
  'material_tracker_bootstrap','material_tracker_current_user','material_tracker_directory',
  'material_tracker_list_materials','material_tracker_get_material','material_tracker_create_material',
  'material_tracker_update_material','material_tracker_archive_material','material_tracker_list_activity',
  'material_tracker_list_tasks','material_tracker_create_task','material_tracker_update_task',
  'material_tracker_create_notification','material_tracker_aggregates','material_tracker_get_forex',
  'material_tracker_set_forex','material_tracker_history','material_tracker_get_user_state',
  'material_tracker_put_user_state','material_tracker_list_comments','material_tracker_add_comment',
  'material_tracker_edit_comment','material_tracker_delete_comment','material_tracker_presence_heartbeat',
  'material_tracker_admin_set_role'
]; f text;
begin
  foreach f in array required loop
    if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=f) then
      raise exception 'Material Tracker host contract missing RPC public.%', f;
    end if;
  end loop;
end $$;
